// src/app/api/payfast/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { payfastService, getPayFastConfig } from '@/lib/payfast';

// Valid PayFast domains for security verification
const VALID_PAYFAST_DOMAINS = [
  'www.payfast.co.za',
  'w1w.payfast.co.za',
  'w2w.payfast.co.za',
  'sandbox.payfast.co.za'
];

export async function POST(request: NextRequest) {
  console.log('🔔 PayFast ITN received');

  try {
    const formData = await request.formData();
    const notificationData: Record<string, any> = {};

    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      notificationData[key] = value;
    }

    // Log received data (without sensitive info)
    console.log('📦 ITN Data:', {
      pf_payment_id: notificationData.pf_payment_id,
      payment_status: notificationData.payment_status,
      amount_gross: notificationData.amount_gross,
      m_payment_id: notificationData.m_payment_id,
      item_name: notificationData.item_name
    });

    // === SECURITY CHECKS ===

    // 1. Verify Signature
    const isValidSignature = await payfastService.verifySignature(notificationData);
    if (!isValidSignature) {
      console.error('❌ PayFast signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Verify Valid PayFast Domain
    const isValidDomain = verifyPayFastDomain(request);
    if (!isValidDomain) {
      console.error('❌ Invalid PayFast domain');
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    // 3. Verify Payment Data
    const orderAmount = await getOrderAmount(notificationData.m_payment_id);
    const isValidAmount = verifyPaymentAmount(orderAmount, parseFloat(notificationData.amount_gross || '0'));
    if (!isValidAmount) {
      console.error('❌ Payment amount mismatch');
      return NextResponse.json({ error: 'Amount verification failed' }, { status: 400 });
    }

    // 4. Server Confirmation (optional but recommended)
    const isServerValid = await verifyWithPayFastServer(notificationData);
    if (!isServerValid) {
      console.error('❌ Server validation failed');
      return NextResponse.json({ error: 'Server validation failed' }, { status: 400 });
    }

    // === PROCESS PAYMENT ===
    const paymentStatus = notificationData.payment_status;
    const pfPaymentId = notificationData.pf_payment_id;
    const mPaymentId = notificationData.m_payment_id;
    const amountGross = notificationData.amount_gross;

    if (paymentStatus === 'COMPLETE') {
      console.log('✅ PayFast payment completed:', { 
        pfPaymentId, 
        mPaymentId, 
        amountGross 
      });
      
      // Update order status in database
      await updateOrderStatus(mPaymentId, 'paid', {
        pf_payment_id: pfPaymentId,
        amount_gross: amountGross,
        payment_date: new Date().toISOString(),
        payment_method: 'payfast',
        custom_data: {
          custom_str1: notificationData.custom_str1,
          custom_str2: notificationData.custom_str2,
          name_first: notificationData.name_first,
          name_last: notificationData.name_last,
          email_address: notificationData.email_address
        }
      });

      // Additional business logic
      await processSuccessfulPayment(mPaymentId, notificationData);

    } else if (paymentStatus === 'CANCELLED') {
      console.log('❌ PayFast payment cancelled:', { pfPaymentId, mPaymentId });
      await updateOrderStatus(mPaymentId, 'cancelled', {
        pf_payment_id: pfPaymentId,
        cancellation_date: new Date().toISOString()
      });
    } else {
      console.log('ℹ️ PayFast payment status:', paymentStatus);
    }

    // Return 200 OK to PayFast to prevent retries
    console.log('✅ ITN processed successfully');
    return new NextResponse(null, { status: 200 });

  } catch (error) {
    console.error('💥 PayFast ITN processing error:', error);
    return NextResponse.json({ 
      error: 'ITN processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Security verification functions
function verifyPayFastDomain(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  if (!referer) {
    console.warn('⚠️ No referer header found');
    return false;
  }

  try {
    const refererHost = new URL(referer).hostname;
    const isValid = VALID_PAYFAST_DOMAINS.includes(refererHost);
    console.log(`🌐 Domain verification: ${refererHost} -> ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (error) {
    console.error('🌐 Domain verification error:', error);
    return false;
  }
}

function verifyPaymentAmount(expected: number, actual: number): boolean {
  const isValid = Math.abs(expected - actual) < 0.01; // Allow for floating point precision
  console.log(`💰 Amount verification: expected ${expected}, actual ${actual} -> ${isValid ? 'VALID' : 'INVALID'}`);
  return isValid;
}

async function verifyWithPayFastServer(data: Record<string, any>): Promise<boolean> {
  try {
    // In a real implementation, you would make a server-to-server request
    // to PayFast's validation endpoint: https://www.payfast.co.za/eng/query/validate
    
    const config = getPayFastConfig();
    const baseUrl = config.sandbox ? 'https://sandbox.payfast.co.za' : 'https://www.payfast.co.za';
    
    // For now, we'll return true and implement this properly in production
    console.log('🔒 Server validation skipped (implement in production)');
    return true;
    
    /* Production implementation:
    const response = await fetch(`${baseUrl}/eng/query/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(data as any).toString()
    });
    
    const result = await response.text();
    return result === 'VALID';
    */
  } catch (error) {
    console.error('🔒 Server validation error:', error);
    return false;
  }
}

// Database and business logic functions
async function getOrderAmount(orderId: string): Promise<number> {
  try {
    // Fetch order from your database
    // This is a placeholder - implement based on your database structure
    console.log(`📋 Fetching order amount for: ${orderId}`);
    
    // Example implementation:
    // const order = await fetchOrderFromDatabase(orderId);
    // return order.total_amount;
    
    return 100.00; // Placeholder
  } catch (error) {
    console.error('📋 Error fetching order amount:', error);
    return 0;
  }
}

async function updateOrderStatus(
  orderId: string, 
  status: string, 
  paymentDetails?: any
): Promise<void> {
  try {
    console.log(`🔄 Updating order ${orderId} to status: ${status}`);
    
    // Update order in your database
    // This is a placeholder - implement based on your database structure
    
    // Example implementation:
    // await updateOrderInDatabase(orderId, {
    //   status: status,
    //   payment_status: status,
    //   ...paymentDetails,
    //   updated_at: new Date().toISOString()
    // });
    
    console.log(`✅ Order ${orderId} updated to ${status}`);
  } catch (error) {
    console.error(`❌ Error updating order ${orderId}:`, error);
    throw error;
  }
}

async function processSuccessfulPayment(orderId: string, paymentData: any): Promise<void> {
  try {
    console.log(`🎉 Processing successful payment for order: ${orderId}`);
    
    // Implement additional business logic:
    
    // 1. Send confirmation email
    await sendConfirmationEmail(orderId, paymentData);
    
    // 2. Update inventory
    await updateInventory(orderId);
    
    // 3. Notify kitchen/management systems
    await notifyKitchenSystem(orderId);
    
    // 4. Update analytics/reporting
    await updateSalesAnalytics(orderId, paymentData);
    
    console.log(`✅ Successfully processed payment for order: ${orderId}`);
  } catch (error) {
    console.error(`❌ Error processing payment for order ${orderId}:`, error);
    // Don't throw here - we've already updated the order status
  }
}

// Helper functions for business logic
async function sendConfirmationEmail(orderId: string, paymentData: any): Promise<void> {
  console.log(`📧 Sending confirmation email for order: ${orderId}`);
  // Implement email sending logic
}

async function updateInventory(orderId: string): Promise<void> {
  console.log(`📦 Updating inventory for order: ${orderId}`);
  // Implement inventory update logic
}

async function notifyKitchenSystem(orderId: string): Promise<void> {
  console.log(`👨‍🍳 Notifying kitchen system for order: ${orderId}`);
  // Implement kitchen notification logic
}

async function updateSalesAnalytics(orderId: string, paymentData: any): Promise<void> {
  console.log(`📊 Updating sales analytics for order: ${orderId}`);
  // Implement analytics update logic
}