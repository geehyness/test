# app/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.database import get_collection
from app.models.hr import Employee
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
    employees_collection = get_collection("employees")
    employee = await employees_collection.find_one({"email": form_data.username})
    
    if not employee or not bcrypt.checkpw(form_data.password.encode(), employee["password"].encode()):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": employee["email"], "id": str(employee["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}

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
    
    employees_collection = get_collection("employees")
    employee = await employees_collection.find_one({"email": email})
    if employee is None:
        raise credentials_exception
    
    return Employee.from_mongo(employee)