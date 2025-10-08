# app/utils/log_viewer.py
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Query
from app.models.response import StandardResponse
from app.utils.response_helpers import success_response
from app.logging_config import get_logger

logger = get_logger("api.log_viewer")

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.get("/", response_model=StandardResponse[dict])
async def get_logs(
    lines: int = Query(100, description="Number of lines to return"),
    level: str = Query(None, description="Filter by log level"),
    search: str = Query(None, description="Search term")
):
    """Get recent logs from the API log file"""
    try:
        log_file = "logs/api.log"
        if not os.path.exists(log_file):
            return success_response(data={"logs": [], "total": 0})
        
        with open(log_file, 'r') as f:
            all_lines = f.readlines()
        
        # Filter logs
        filtered_lines = []
        for line in all_lines[-lines:]:  # Get last N lines
            line = line.strip()
            if not line:
                continue
                
            # Apply filters
            if level and level.upper() not in line:
                continue
                
            if search and search.lower() not in line.lower():
                continue
                
            filtered_lines.append(line)
        
        # Return in chronological order (newest first)
        filtered_lines.reverse()
        
        return success_response(data={
            "logs": filtered_lines,
            "total": len(filtered_lines),
            "file": log_file
        })
        
    except Exception as e:
        logger.error(f"Error reading logs: {e}")
        return success_response(data={"logs": [], "total": 0, "error": str(e)})

@router.get("/stats", response_model=StandardResponse[dict])
async def get_log_stats():
    """Get log statistics"""
    try:
        log_file = "logs/api.log"
        if not os.path.exists(log_file):
            return success_response(data={"total_lines": 0, "file_size": 0})
        
        with open(log_file, 'r') as f:
            lines = f.readlines()
        
        # Count by level
        level_counts = {"INFO": 0, "WARNING": 0, "ERROR": 0, "DEBUG": 0}
        for line in lines:
            for level in level_counts.keys():
                if f"| {level} " in line:
                    level_counts[level] += 1
                    break
        
        return success_response(data={
            "total_lines": len(lines),
            "file_size": os.path.getsize(log_file),
            "level_counts": level_counts,
            "last_modified": datetime.fromtimestamp(os.path.getmtime(log_file)).isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting log stats: {e}")
        return success_response(data={"error": str(e)})