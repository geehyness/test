# app/logging_config.py - FIXED FOR VERCEL
import logging
import sys
import os
from datetime import datetime
import json

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
    """Setup logging configuration that works on Vercel"""
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Console handler only - Vercel can't write to files
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_format = DetailedFormatter(
        '%(timestamp)s | %(levelname)-8s | %(name)-20s | %(message)s'
    )
    console_handler.setFormatter(console_format)
    
    # ONLY add console handler - no file handlers on Vercel!
    logger.addHandler(console_handler)
    
    # Set specific log levels for noisy libraries
    logging.getLogger('motor').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('asyncio').setLevel(logging.WARNING)
    logging.getLogger('watchfiles').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)

# Create logger instances for different modules
def get_logger(name):
    """Get a named logger instance"""
    return logging.getLogger(name)

# Initialize logging when module is imported
setup_logging()