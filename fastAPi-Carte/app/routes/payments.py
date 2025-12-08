# app/routes/payments.py
from fastapi import APIRouter, HTTPException, Body
from app.database import get_collection
from app.models.response import StandardResponse, PaymentAttemptResponse
from app.utils.response_helpers import success_response, error_response, handle_generic_exception
from app.utils.mongo_helpers import to_mongo_dict
from bson import ObjectId
from datetime import datetime
from typing import Dict, Any

router = APIRouter(prefix="/api/halo", tags=["payments"])

@router.post("/transaction", response_model=StandardResponse[Dict[str, Any]])
async def process_halo_transaction(transaction_data: Dict[str, Any] = Body(...)):
    """Process Halo payment transaction"""
    try:
        # Extract transaction data
        amount = transaction_data.get("amount", 0)
        order_id = transaction_data.get("order_id")
        transaction_id = transaction_data.get("transaction_id", f"HALO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}")
        
        if not order_id:
            return error_response(message="Order ID is required", code=400)
        
        if amount <= 0:
            return error_response(message="Amount must be greater than 0", code=400)
        
        # Check if order exists
        orders_collection = get_collection("orders")
        order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        
        if not order:
            return error_response(message=f"Order {order_id} not found", code=404)
        
        # Create payment attempt
        payment_attempts_collection = get_collection("payment_attempts")
        
        payment_attempt = {
            "order_id": order_id,
            "payment_gateway": "halo",
            "amount": amount,
            "reference": transaction_id,
            "status": "pending",
            "payment_data": transaction_data,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert payment attempt
        result = await payment_attempts_collection.insert_one(payment_attempt)
        attempt_id = str(result.inserted_id)
        
        # Simulate payment processing (in production, integrate with Halo API)
        # For demo purposes, simulate success
        is_successful = transaction_data.get("simulate_success", True)
        
        if is_successful:
            # Update payment attempt status
            await payment_attempts_collection.update_one(
                {"_id": result.inserted_id},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.utcnow().isoformat(),
                        "payment_data": {
                            **transaction_data,
                            "processed_at": datetime.utcnow().isoformat(),
                            "payment_reference": f"PAY-REF-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
                        }
                    }
                }
            )
            
            # Update order payment status
            await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {
                    "$set": {
                        "payment_status": "paid",
                        "payment_method": transaction_data.get("payment_method", "card"),
                        "updated_at": datetime.utcnow().isoformat(),
                        "payment_reference": transaction_id,
                        "transaction_id": transaction_id
                    }
                }
            )
            
            response_data = {
                "status": "success",
                "transaction_id": transaction_id,
                "order_id": order_id,
                "amount": amount,
                "message": "Payment processed successfully",
                "payment_reference": transaction_id,
                "attempt_id": attempt_id
            }
        else:
            # Payment failed
            await payment_attempts_collection.update_one(
                {"_id": result.inserted_id},
                {
                    "$set": {
                        "status": "failed",
                        "cancelled_at": datetime.utcnow().isoformat(),
                        "cancellation_reason": transaction_data.get("error_message", "Payment failed")
                    }
                }
            )
            
            response_data = {
                "status": "failed",
                "transaction_id": transaction_id,
                "order_id": order_id,
                "amount": amount,
                "message": "Payment processing failed",
                "error": transaction_data.get("error_message", "Payment gateway error"),
                "attempt_id": attempt_id
            }
        
        return success_response(
            data=response_data,
            message="Halo transaction processed"
        )
        
    except Exception as e:
        return error_response(
            message="Halo transaction failed",
            code=500,
            details={"error": str(e)}
        )

@router.get("/test", response_model=StandardResponse[Dict[str, Any]])
async def test_halo_endpoint():
    """Test endpoint to verify Halo integration is working"""
    return success_response(
        data={
            "status": "available",
            "message": "Halo payment endpoint is active",
            "timestamp": datetime.utcnow().isoformat()
        }
    )