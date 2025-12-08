# app/main.py - UPDATED WITH PAYFAST
from fastapi import FastAPI, HTTPException
from app.routes import core, hr, inventory, auth
from app.database import client
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.logging_middleware import LoggingMiddleware
from app.logging_config import get_logger, setup_logging
from app.routes import core, hr, inventory, auth, payroll_router, log_router
import os

from fastapi.encoders import jsonable_encoder
from datetime import datetime
from bson import ObjectId

# Import the PayFast ITN router
from app.routes.payfast_itn import router as payfast_itn_router

# Setup logging
setup_logging()
logger = get_logger("api.main")

# Create ONE FastAPI instance with all configurations
app = FastAPI(
    title="POS System API", 
    version="1.0.0",
    json_encoders={
        datetime: lambda v: v.isoformat(),
        ObjectId: str
    }
)

# Add middleware to the single app instance
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "https://carte-pos.vercel.app/"],  # Specific origins for security
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include routers
app.include_router(core.router)
app.include_router(hr.router) 
app.include_router(inventory.router)
app.include_router(auth.router)
app.include_router(payroll_router)
app.include_router(log_router)
app.include_router(payfast_itn_router)  # ADD PAYFAST ITN ROUTER

@app.on_event("startup")
async def startup_event():
    try:
        if client is None:
            logger.error("❌ MongoDB client is None - check MONGODB_URL environment variable")
            return
            
        await client.admin.command('ping')
        logger.info("✅ Connected to MongoDB!")
        print("✅ Connected to MongoDB!")
    except Exception as e:
        logger.error(f"❌ Could not connect to MongoDB: {e}")
        print(f"❌ Could not connect to MongoDB: {e}")

@app.get("/health")
async def health_check():
    try:
        if client is None:
            return {"status": "unhealthy", "database": "not_configured"}
            
        await client.admin.command('ping')
        logger.info("Health check: OK")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "database": "disconnected"}

@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    logger.info("✅ MongoDB connection closed.")
    print("✅ MongoDB connection closed.")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "POS System API is running"}

@app.options("/test-cors")
@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS is configured correctly"}