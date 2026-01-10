# app/main.py - COMPLETELY CORRECTED VERSION
from fastapi import FastAPI
from app.database import client
from fastapi.middleware.cors import CORSMiddleware
from app.logging_config import get_logger, setup_logging
from app.routes import (
    core_router, hr_router, inventory_router, auth_router,
    payroll_router, payments_router, log_router  # FIXED IMPORTS
)
from app.routes.reports import router as reports_router
from app.routes.analytics import router as analytics_router


import os

from datetime import datetime
from bson import ObjectId

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

# CORS Configuration
origins_env = os.getenv("ALLOWED_ORIGINS", "")
if origins_env:
    origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
else:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:8000",
        "https://carte-pos.vercel.app",
        "https://carte-fastapi.vercel.app"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include ALL routers
app.include_router(core_router)
app.include_router(hr_router) 
app.include_router(inventory_router)
app.include_router(auth_router)
app.include_router(payroll_router)
app.include_router(payments_router)  # FIXED: Use .router
app.include_router(log_router)
app.include_router(reports_router)
app.include_router(analytics_router)

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
    if client:
        client.close()
        logger.info("✅ MongoDB connection closed.")
        print("✅ MongoDB connection closed.")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "POS System API is running"}

@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS is configured correctly"}