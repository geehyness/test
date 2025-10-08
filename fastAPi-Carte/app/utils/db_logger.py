# app/utils/db_logger.py
from app.logging_config import get_logger
from bson import ObjectId
import json
from datetime import datetime

logger = get_logger("api.database")

class DBLogger:
    @staticmethod
    def log_operation(operation: str, collection: str, query: dict = None, 
                     data: dict = None, result: any = None, error: str = None):
        """Log database operations"""
        
        log_data = {
            "operation": operation,
            "collection": collection,
            "query": DBLogger._sanitize_query(query) if query else None,
            "data_count": len(data) if isinstance(data, (list, dict)) else 1 if data else 0,
            "result_count": DBLogger._get_result_count(result),
            "error": error
        }
        
        if error:
            logger.error(f"DB {operation.upper()} FAILED | Collection: {collection}", extra=log_data)
        else:
            logger.info(f"DB {operation.upper()} | Collection: {collection}", extra=log_data)
    
    @staticmethod
    def _sanitize_query(query: dict) -> dict:
        """Sanitize query for logging (remove sensitive data)"""
        if not query:
            return {}
        
        sanitized = {}
        for key, value in query.items():
            if isinstance(value, dict):
                sanitized[key] = DBLogger._sanitize_query(value)
            elif isinstance(value, ObjectId):
                sanitized[key] = f"ObjectId({str(value)})"
            elif key.lower() in ['password', 'token', 'secret', 'authorization']:
                sanitized[key] = "***REDACTED***"
            else:
                sanitized[key] = value
        return sanitized
    
    @staticmethod
    def _get_result_count(result: any) -> int:
        """Get count of results for logging"""
        if result is None:
            return 0
        elif isinstance(result, list):
            return len(result)
        elif hasattr(result, 'inserted_id'):  # Insert result
            return 1
        elif hasattr(result, 'modified_count'):  # Update result
            return getattr(result, 'modified_count', 0)
        elif hasattr(result, 'deleted_count'):  # Delete result
            return getattr(result, 'deleted_count', 0)
        elif isinstance(result, dict):
            return 1
        return 0

# Convenience functions
def log_find(collection: str, query: dict = None, result_count: int = 0):
    DBLogger.log_operation("find", collection, query, result=result_count)

def log_insert(collection: str, data: dict = None, result: any = None):
    DBLogger.log_operation("insert", collection, data=data, result=result)

def log_update(collection: str, query: dict = None, data: dict = None, result: any = None):
    DBLogger.log_operation("update", collection, query, data, result)

def log_delete(collection: str, query: dict = None, result: any = None):
    DBLogger.log_operation("delete", collection, query, result=result)

def log_error(collection: str, operation: str, error: str, query: dict = None):
    DBLogger.log_operation(operation, collection, query, error=error)