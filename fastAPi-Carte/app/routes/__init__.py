# app/routes/__init__.py - UPDATED
from .core import router as core_router
from .hr import router as hr_router
from .inventory import router as inventory_router
from .auth import router as auth_router
from .payroll import router as payroll_router
from .payments import router as payments_router
from .reports import router as reports_router 
from app.utils.log_viewer import router as log_router

__all__ = [
    "core_router", 
    "hr_router", 
    "inventory_router", 
    "auth_router", 
    "payroll_router", 
    "payments_router",
    "reports_router", 
    "log_router"
]