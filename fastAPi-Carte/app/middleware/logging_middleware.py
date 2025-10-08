# app/middleware/logging_middleware.py
import time
import json
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.logging_config import get_logger
import uuid

logger = get_logger("api.middleware")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid.uuid4())[:8]
        
        # Log request
        start_time = time.time()
        
        # Get client info
        client_host = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Log request details
        logger.info(
            f"REQUEST [{request_id}] | {request.method} {request.url.path} | "
            f"Client: {client_host} | User-Agent: {user_agent}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_host": client_host,
                "user_agent": user_agent,
                "query_params": dict(request.query_params),
                "headers": dict(request.headers)
            }
        )
        
        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                f"RESPONSE [{request_id}] | Status: {response.status_code} | "
                f"Time: {process_time:.3f}s",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "process_time": process_time,
                    "response_headers": dict(response.headers)
                }
            )
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"ERROR [{request_id}] | Exception: {str(e)} | Time: {process_time:.3f}s",
                extra={
                    "request_id": request_id,
                    "error": str(e),
                    "process_time": process_time,
                    "exception_type": type(e).__name__
                },
                exc_info=True
            )
            raise