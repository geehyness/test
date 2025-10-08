# app/main.py - UPDATED WITH LOGGING
from fastapi import FastAPI, HTTPException
from app.routes import core, hr, inventory, auth
from app.database import client
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.logging_middleware import LoggingMiddleware
from app.logging_config import get_logger, setup_logging
from app.routes import core, hr, inventory, auth, log_router
import os

# Setup logging
setup_logging()
logger = get_logger("api.main")

app = FastAPI(title="POS System API", version="1.0.0")

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - FIXED: Remove duplicate prefix since routers already have /api
app.include_router(core.router)
app.include_router(hr.router) 
app.include_router(inventory.router)
app.include_router(auth.router)
app.include_router(log_router)

@app.on_event("startup")
async def startup_event():
    try:
        await client.admin.command('ping')
        logger.info("✅ Connected to MongoDB!")
        print("✅ Connected to MongoDB!")
    except Exception as e:
        logger.error(f"❌ Could not connect to MongoDB: {e}")
        print(f"❌ Could not connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    logger.info("✅ MongoDB connection closed.")
    print("✅ MongoDB connection closed.")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "POS System API is running"}

@app.get("/health")
async def health_check():
    try:
        await client.admin.command('ping')
        logger.info("Health check: OK")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "database": "disconnected"}