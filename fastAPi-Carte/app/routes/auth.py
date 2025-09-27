# app/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.database import get_collection
from app.models.hr import Employee
from app.models.core import User
from bson import ObjectId
import bcrypt
import jwt
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/api", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users_collection = get_collection("users")
    employees_collection = get_collection("employees")
    
    # Find user by email
    user = await users_collection.find_one({"email": form_data.username})
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Check password (in real app, use proper hashing)
    # For demo, using simple comparison
    if form_data.password != user.get("password", ""):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Find employee linked to this user
    employee = await employees_collection.find_one({"user_id": str(user["_id"])})
    
    if not employee:
        raise HTTPException(status_code=400, detail="No employee found for this user account")
    
    # Create access token
    access_token = create_access_token(data={
        "sub": user["email"], 
        "id": str(user["_id"]),
        "employee_id": str(employee["_id"]),
        "store_id": employee.get("store_id", "")
    })
    
    # Return employee data with store_id
    employee_data = Employee.from_mongo(employee)
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "employee": employee_data.model_dump()
    }

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_employee(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.JWTError:
        raise credentials_exception
    
    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    employees_collection = get_collection("employees")
    employee = await employees_collection.find_one({"user_id": str(user["_id"])})
    if employee is None:
        raise credentials_exception
    
    return Employee.from_mongo(employee)

@router.get("/employees/me")
async def read_employees_me(current_employee: Employee = Depends(get_current_employee)):
    return current_employee