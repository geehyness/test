# app/utils/response_helpers.py - UPDATED WITH LOGGING
from typing import Any, List, Dict, Optional
from fastapi import HTTPException
from app.utils.mongo_helpers import prepare_response_data
from app.logging_config import get_logger

logger = get_logger("api.response")

def success_response(
    data: Any = None, 
    message: str = "success", 
    code: int = 200
) -> Dict[str, Any]:
    """Helper function to create success responses with MongoDB data transformation"""
    transformed_data = prepare_response_data(data)
    
    # Log successful response
    logger.info(
        f"SUCCESS RESPONSE | Code: {code} | Message: {message}",
        extra={
            "response_code": code,
            "response_message": message,  # Changed from "message" to "response_message"
            "data_type": type(data).__name__,
            "data_count": len(transformed_data) if isinstance(transformed_data, list) else 1 if transformed_data else 0
        }
    )
    
    return {
        "code": code,
        "message": message,
        "data": transformed_data
    }

def paginated_response(
    data: Any,
    total: int,
    page: int,
    limit: int,
    message: str = "success",
    code: int = 200
) -> Dict[str, Any]:
    """Helper function for paginated responses with MongoDB data transformation"""
    transformed_data = prepare_response_data(data)
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    # Log paginated response
    logger.info(
        f"PAGINATED RESPONSE | Code: {code} | Total: {total} | Page: {page}/{total_pages}",
        extra={
            "response_code": code,
            "total_items": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "current_page_count": len(transformed_data)
        }
    )
    
    return {
        "code": code,
        "message": message,
        "data": transformed_data,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

def error_response(
    message: str = "error",
    code: int = 400,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Helper function to create error responses"""
    
    # Log error response
    logger.warning(
        f"ERROR RESPONSE | Code: {code} | Message: {message}",
        extra={
            "error_code": code,
            "error_message": message,  # Changed from "message" to "error_message"
            "error_details": details
        }
    )
    
    return {
        "code": code,
        "message": message,
        "details": details
    }

def handle_http_exception(e: HTTPException) -> Dict[str, Any]:
    """Convert HTTPException to standard error response"""
    logger.warning(
        f"HTTP EXCEPTION | Status: {e.status_code} | Detail: {e.detail}",
        extra={
            "status_code": e.status_code,
            "detail": str(e.detail)
        }
    )
    return error_response(
        message=str(e.detail),
        code=e.status_code
    )

def handle_generic_exception(e: Exception) -> Dict[str, Any]:
    """Convert generic exception to standard error response"""
    logger.error(
        f"GENERIC EXCEPTION | Type: {type(e).__name__} | Message: {str(e)}",
        extra={
            "exception_type": type(e).__name__,
            "exception_message": str(e)
        },
        exc_info=True
    )
    return error_response(
        message=str(e),
        code=500
    )