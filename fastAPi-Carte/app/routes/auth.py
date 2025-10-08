from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.database import get_collection
from app.models.hr import Employee
from app.models.response import StandardResponse, EmployeeResponse, LoginResponse
from app.utils.response_helpers import success_response, error_response, handle_generic_exception
from bson import ObjectId
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

router = APIRouter(prefix="/api", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# --- Configuration & Environment Variables ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# --- Utility Functions ---

def hash_password(password: str) -> str:
    """Hash a password for storing."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against one provided by user."""
    if not hashed_password.startswith("$2b$"):
        return plain_password == hashed_password
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Creates a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def _fetch_and_enrich_employee_data(employee_id: str) -> Dict[str, Any]:
    """
    Fetches employee data and enriches it with detailed role information.
    """
    try:
        employees_collection = get_collection("employees")
        access_roles_collection = get_collection("access_roles")
        
        employee = await employees_collection.find_one({"_id": ObjectId(employee_id)})
        if not employee:
            raise HTTPException(status_code=404, detail="Employee data not found")
            
        # Convert MongoDB document to Employee Pydantic model for base data
        employee_data = Employee.from_mongo(employee)
        employee_dict = employee_data.model_dump()
        
        # 1. Get main access role details
        main_access_role = None
        if employee.get("main_access_role_id"):
            main_access_role = await access_roles_collection.find_one(
                {"_id": ObjectId(employee["main_access_role_id"])}
            )
        
        if main_access_role:
            employee_dict["main_access_role"] = {
                "id": str(main_access_role["_id"]),
                "name": main_access_role.get("name", ""),
                "description": main_access_role.get("description", ""),
                "permissions": main_access_role.get("permissions", []),
                "landing_page": main_access_role.get("landing_page", "")
            }
        
        # 2. Get all access roles for the employee
        employee_access_roles: List[Dict] = []
        role_ids = [ObjectId(rid) for rid in employee.get("access_role_ids", [])]
        if role_ids:
            async for role in access_roles_collection.find({"_id": {"$in": role_ids}}):
                employee_access_roles.append({
                    "id": str(role["_id"]),
                    "name": role.get("name", ""),
                    "description": role.get("description", ""),
                    "permissions": role.get("permissions", []),
                    "landing_page": role.get("landing_page", "")
                })
        
        employee_dict["access_roles"] = employee_access_roles
        
        return employee_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug/users", response_model=StandardResponse[List[dict]])
async def debug_users():
    """Debug endpoint to see all users and their emails"""
    try:
        users_collection = get_collection("users")
        users = []
        async for user in users_collection.find():
            users.append({
                "id": str(user["_id"]),
                "username": user.get("username"),
                "email": user.get("email"),
                "has_password": bool(user.get("password")),
                "password_length": len(user.get("password", "")),
                "password_prefix": user.get("password", "")[:10] + "..." if user.get("password") else None
            })
        return success_response(data=users)
    except Exception as e:
        return handle_generic_exception(e)

# --- JWT Functions ---

async def get_current_employee(token: str = Depends(oauth2_scheme)):
    """Verifies the JWT token and returns the employee data."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id: str = payload.get("employee_id")
        if employee_id is None:
            raise credentials_exception
            
        employees_collection = get_collection("employees")
        employee_doc = await employees_collection.find_one({"_id": ObjectId(employee_id)})

        if employee_doc is None:
            raise credentials_exception

        return {"id": employee_id, "store_id": payload.get("store_id")}

    except jwt.PyJWTError:
        raise credentials_exception

# --- Public Endpoints ---

# In app/routes/auth.py - Update the register_employee function
@router.post("/register", response_model=StandardResponse[EmployeeResponse])
async def register_employee(employee: Employee):
    """Registers a new employee."""
    try:
        employees_collection = get_collection("employees")
        
        # Check for duplicate email
        if await employees_collection.find_one({"email": employee.email}):
            return error_response(
                message=f"Employee with email '{employee.email}' already exists.",
                code=409
            )

        # Insert the new employee using the helper function
        from app.utils.mongo_helpers import to_mongo_dict
        employee_dict = to_mongo_dict(employee)
        employee_dict["password"] = hash_password("defaultpassword")
        
        new_employee = await employees_collection.insert_one(employee_dict)
        created_employee = await employees_collection.find_one({"_id": new_employee.inserted_id})
        
        return success_response(
            data=Employee.from_mongo(created_employee),
            message="Employee registered successfully",
            code=201
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.post("/login", response_model=StandardResponse[LoginResponse])
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Handles employee login, validates credentials, and generates a JWT."""
    try:
        users_collection = get_collection("users")
        
        # Find user by email or username
        user = await users_collection.find_one({
            "$or": [
                {"email": form_data.username},
                {"username": form_data.username}
            ]
        })
        
        if not user:
            return error_response(message="Invalid credentials", code=401)
        
        # Check password
        password_valid = verify_password(form_data.password, user.get("password", ""))
        
        if not password_valid:
            return error_response(message="Invalid credentials", code=401)
        
        # Find employee linked to this user
        employees_collection = get_collection("employees")
        employee = await employees_collection.find_one({"user_id": str(user["_id"])})
        
        if not employee:
            return error_response(message="Account not authorized for employee access", code=403)
        
        employee_id = str(employee["_id"])
        
        # Get enriched employee data
        enriched_employee_data = await _fetch_and_enrich_employee_data(employee_id)
        
        # Create access token
        access_token = create_access_token(data={
            "sub": user["email"], 
            "user_id": str(user["_id"]),
            "employee_id": employee_id,
            "store_id": enriched_employee_data.get("store_id", ""),
            "roles": enriched_employee_data.get("access_role_ids", [])
        })
        
        return success_response(data={
            "access_token": access_token,
            "token_type": "bearer",
            "employee": enriched_employee_data
        })
    except HTTPException as e:
        return error_response(message=str(e.detail), code=e.status_code)
    except Exception as e:
        return handle_generic_exception(e)

async def get_current_employee_full(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Decodes the JWT token and fetches the current employee's detailed information.
    """
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id: str = payload.get("employee_id")
        if employee_id is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired", headers={"WWW-Authenticate": "Bearer"})
    except jwt.JWTError:
        raise credentials_exception
    
    # Fetch and enrich employee data
    try:
        enriched_employee_data = await _fetch_and_enrich_employee_data(employee_id)
    except HTTPException:
        raise credentials_exception
    
    return enriched_employee_data

@router.get("/employees/me", response_model=StandardResponse[EmployeeResponse])
async def read_employees_me(current_employee: Dict[str, Any] = Depends(get_current_employee_full)):
    """Retrieves the full profile of the currently authenticated employee."""
    return success_response(data=current_employee)

@router.post("/logout", response_model=StandardResponse[dict])
async def logout():
    """Provides a successful logout message."""
    return success_response(data=None, message="Successfully logged out")

@router.post("/refresh-token", response_model=StandardResponse[LoginResponse])
async def refresh_token(current_employee: Dict[str, Any] = Depends(get_current_employee_full)):
    """Generates a new JWT for an authenticated user."""
    try:
        users_collection = get_collection("users")
        user = await users_collection.find_one({"_id": ObjectId(current_employee.get("user_id"))})
        
        if not user:
            return error_response(message="User not found", code=404)
        
        access_token = create_access_token(data={
            "sub": user["email"], 
            "user_id": str(user["_id"]),
            "employee_id": current_employee.get("id"),
            "store_id": current_employee.get("store_id", ""),
            "roles": current_employee.get("access_role_ids", [])
        })
        
        return success_response(data={
            "access_token": access_token,
            "token_type": "bearer",
            "employee": current_employee
        })
    except Exception as e:
        return handle_generic_exception(e)

@router.post("/forgot-password", response_model=StandardResponse[dict])
async def forgot_password(email: str):
    """Initiates the password reset process."""
    try:
        users_collection = get_collection("users")
        user = await users_collection.find_one({"email": email})
        
        if user:
            # Placeholder for password reset logic
            pass
        
        # Always return the same message for security
        return success_response(
            data=None,
            message="If an account with that email exists, a password reset link has been sent."
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.post("/reset-password", response_model=StandardResponse[dict])
async def reset_password(token: str, new_password: str):
    """Processes the password reset request using the token."""
    try:
        # Placeholder for password reset logic
        return success_response(
            data=None,
            message="If the token is valid, your password has been reset successfully."
        )
    except Exception as e:
        return handle_generic_exception(e)

@router.get("/verify-token", response_model=StandardResponse[dict])
async def verify_token(current_employee: Dict[str, Any] = Depends(get_current_employee_full)):
    """Used by the frontend to verify if the token is still valid."""
    return success_response(data={
        "valid": True,
        "employee_id": current_employee.get("id"),
        "store_id": current_employee.get("store_id"),
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    })

@router.get("/health")
async def auth_health_check():
    """Health check for the authentication service."""
    return success_response(data={"status": "healthy", "module": "auth"})