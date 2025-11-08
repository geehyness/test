# app/routes/payfast_itn.py - UPDATED VERSION (using httpx)
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Form
from typing import Dict, Any
import hashlib
from urllib.parse import urlencode
import httpx  # ✅ Use httpx instead of aiohttp
from app.database import get_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()

class PayFastITNService:
    def __init__(self):
        self.sandbox_mode = True
        self.merchant_id = "10000100"
        self.merchant_key = "46f0cd694581a"
        self.passphrase = ""  # Empty for sandbox
    
    def generate_signature(self, data: Dict[str, Any], include_passphrase: bool = True) -> str:
        """Generate MD5 signature for PayFast"""
        # Create parameter string
        param_string = ""
        for key in sorted(data.keys()):
            if key != 'signature' and data[key] not in [None, ""]:
                param_string += f"{key}={data[key]}&"
        
        param_string = param_string[:-1]  # Remove trailing &
        
        # Add passphrase if required
        if include_passphrase and self.passphrase:
            param_string += f"&passphrase={self.passphrase}"
        
        # Generate MD5 hash
        return hashlib.md5(param_string.encode()).hexdigest()
    
    def validate_signature(self, data: Dict[str, Any]) -> bool:
        """Validate PayFast signature"""
        received_signature = data.get('signature', '')
        generated_signature = self.generate_signature(data)
        return received_signature == generated_signature
    
    async def validate_with_payfast(self, data: Dict[str, Any]) -> bool:
        """Validate payment with PayFast server"""
        try:
            base_url = "https://sandbox.payfast.co.za" if self.sandbox_mode else "https://api.payfast.co.za"
            url = f"{base_url}/eng/query/validate"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, data=data)
                result = response.text
                print(f"🔍 PayFast validation response: {result}")
                return result.strip() == "VALID"
        except Exception as e:
            print(f"❌ PayFast validation error: {e}")
            return False
    
    async def handle_successful_payment(self, data: Dict[str, Any]):
        """Handle successful payment"""
        try:
            # Update order status
            orders_collection = get_collection("orders")
            payment_attempts_collection = get_collection("payment_attempts")
            
            order_id = data.get('m_payment_id')
            pf_payment_id = data.get('pf_payment_id')
            amount = float(data.get('amount_gross', 0))
            
            print(f"💰 Processing successful payment for order: {order_id}")
            
            if order_id and order_id.startswith('order-'):
                # For temporary order IDs, find the actual order
                order = await orders_collection.find_one({"items.order_id": order_id})
                if order:
                    order_id = str(order["_id"])
            
            if order_id:
                # Update order payment status
                result = await orders_collection.update_one(
                    {"_id": ObjectId(order_id)},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "confirmed",
                        "payment_reference": pf_payment_id,
                        "paid_amount": amount,
                        "payment_date": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }}
                )
                
                print(f"✅ Order updated: {result.modified_count} documents modified")
                
                # Update payment attempt
                await payment_attempts_collection.update_one(
                    {"order_id": order_id},
                    {"$set": {
                        "status": "completed",
                        "reference": pf_payment_id,
                        "completed_at": datetime.utcnow().isoformat(),
                        "payment_data": data
                    }}
                )
                
                print(f"✅ Payment successful for order {order_id}")
                
        except Exception as e:
            print(f"❌ Error handling successful payment: {e}")

payfast_itn_service = PayFastITNService()

@router.post("/payfast/itn")
async def handle_payfast_itn(
    request: Request, 
    background_tasks: BackgroundTasks,
    m_payment_id: str = Form(None),
    pf_payment_id: str = Form(None),
    payment_status: str = Form(None),
    amount_gross: str = Form(None),
    item_name: str = Form(None),
    signature: str = Form(None)
):
    """Handle PayFast Instant Transaction Notification"""
    try:
        # Parse all form data
        form_data = await request.form()
        itn_data = dict(form_data)
        
        print("📨 Received ITN from PayFast:")
        for key, value in itn_data.items():
            print(f"   {key}: {value}")
        
        # Immediately return 200 to acknowledge receipt
        # This prevents PayFast from retrying
        response = {"status": "received"}
        
        # Process payment in background
        background_tasks.add_task(process_payfast_payment, itn_data)
        
        return response
        
    except Exception as e:
        print(f"❌ ITN processing error: {e}")
        # Still return 200 to prevent retries
        return {"status": "error", "message": str(e)}

async def process_payfast_payment(itn_data: Dict[str, Any]):
    """Process PayFast payment in background"""
    try:
        print("🔄 Processing PayFast payment in background...")
        
        # 1. Validate payment status
        payment_status = itn_data.get('payment_status')
        if payment_status != 'COMPLETE':
            print(f"❌ Payment not complete: {payment_status}")
            return
        
        print("✅ Payment status: COMPLETE")
        
        # 2. Validate signature
        if not payfast_itn_service.validate_signature(itn_data):
            print("❌ Invalid signature")
            return
        
        print("✅ Signature validated")
        
        # 3. Validate with PayFast server
        if not await payfast_itn_service.validate_with_payfast(itn_data):
            print("❌ Server validation failed")
            return
        
        print("✅ Server validation successful")
        
        # 4. Handle successful payment
        await payfast_itn_service.handle_successful_payment(itn_data)
        
        print("✅ Payment processed successfully")
        
    except Exception as e:
        print(f"❌ Error processing payment: {e}")

@router.get("/payfast/test")
async def test_payfast_endpoint():
    """Test endpoint to verify PayFast ITN is working"""
    return {
        "status": "PayFast ITN endpoint is active",
        "sandbox_mode": payfast_itn_service.sandbox_mode,
        "merchant_id": payfast_itn_service.merchant_id
    }