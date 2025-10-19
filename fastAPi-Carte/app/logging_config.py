# app/logging_config.py
import logging
import sys
from logging.handlers import RotatingFileHandler
import os
from datetime import datetime
import json

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)

# Custom formatter that includes timestamps with milliseconds
class DetailedFormatter(logging.Formatter):
    def format(self, record):
        # Add current timestamp with milliseconds
        record.timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        
        # Format message for JSON-like structure
        if hasattr(record, 'extra_data'):
            extra_data = json.dumps(record.extra_data, default=str)
            record.msg = f"{record.msg} | Extra: {extra_data}"
        
        return super().format(record)

def setup_logging():
    """Setup comprehensive logging configuration"""
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_format = DetailedFormatter(
        '%(timestamp)s | %(levelname)-8s | %(name)-20s | %(message)s'
    )
    console_handler.setFormatter(console_format)
    
    # File handler with rotation
    file_handler = RotatingFileHandler(
        'logs/api.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_format = DetailedFormatter(
        '%(timestamp)s | %(levelname)-8s | %(name)-20s | %(filename)s:%(lineno)d | %(message)s'
    )
    file_handler.setFormatter(file_format)
    
    # Add handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    # Set specific log levels for noisy libraries
    logging.getLogger('motor').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('asyncio').setLevel(logging.WARNING)
    logging.getLogger('watchfiles').setLevel(logging.WARNING)  # ADD THIS LINE
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)


# Create logger instances for different modules
def get_logger(name):
    """Get a named logger instance"""
    return logging.getLogger(name)

# Initialize logging when module is imported
setup_logging()