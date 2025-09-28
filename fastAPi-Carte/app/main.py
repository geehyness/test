# app/main.py - UPDATED
from fastapi import FastAPI, HTTPException  # Added HTTPException import
from app.routes import core, hr, inventory, auth
from app.database import client
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="POS System API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - FIXED: Remove duplicate prefix
app.include_router(core.router)  # Remove prefix="/api" since it's already in router
app.include_router(hr.router)
app.include_router(inventory.router)
app.include_router(auth.router)

@app.on_event("startup")
async def startup_event():
    try:
        await client.admin.command('ping')
        print("✅ Connected to MongoDB!")
    except Exception as e:
        print(f"❌ Could not connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    print("✅ MongoDB connection closed.")

@app.get("/")
async def root():
    return {"message": "POS System API is running"}

@app.get("/health")
async def health_check():
    try:
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "unhealthy", "database": "disconnected"}