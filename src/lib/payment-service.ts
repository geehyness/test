// src/lib/payment-service.ts
import { payfastService, PayFastPaymentData } from './payfast';
import { fetchDataWithContext } from './api';

export interface PaymentResult {
  success: boolean;
  paymentData?: PayFastPaymentData;
  error?: string;
  orderId?: string;
}

export class PaymentService {
  /**
   * Initiate PayFast payment for an order
   */
  static async initiatePayFastPayment(
    order: any,
    customerInfo: any
  ): Promise<PaymentResult> {
    try {
      console.log('🚀 Initiating PayFast payment for order:', order.id);

      // Create payment data
      const paymentData = await payfastService.createPaymentData({
        amount: order.total_amount,
        itemName: `Order #${order.id}`,
        itemDescription: `Food order from restaurant`,
        mPaymentId: order.id,
        customer: {
          firstName: customerInfo.firstName || 'Customer',
          lastName: customerInfo.lastName || '',
          email: customerInfo.email || '',
          cellNumber: customerInfo.phone || ''
        },
        customData: {
          str1: order.store_id || 'default-store',
          str2: order.table_id || 'takeaway',
          str3: customerInfo.firstName || '',
          str4: customerInfo.email || '',
          int1: Math.floor(order.total_amount)
        }
      });

      // Save payment attempt to database
      await this.recordPaymentAttempt(order.id, paymentData);

      console.log('✅ PayFast payment data generated:', {
        orderId: order.id,
        amount: order.total_amount
      });

      return {
        success: true,
        paymentData,
        orderId: order.id
      };

    } catch (error) {
      console.error('❌ PayFast payment initiation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed'
      };
    }
  }

  /**
   * Handle successful payment (called from ITN)
   */
  static async handleSuccessfulPayment(orderId: string, paymentDetails: any): Promise<void> {
    try {
      console.log(`💰 Processing successful payment for order: ${orderId}`);

      // Update order status
      await fetchDataWithContext(
        `orders/${orderId}/payment-success`,
        undefined,
        {
          payment_status: 'paid',
          payment_method: 'payfast',
          payment_reference: paymentDetails.pf_payment_id,
          paid_amount: parseFloat(paymentDetails.amount_gross),
          payment_date: new Date().toISOString(),
          status: 'confirmed'
        },
        'PUT'
      );

      // Record successful payment
      await this.recordPaymentSuccess(orderId, paymentDetails);

      // Additional business logic
      await this.sendConfirmationEmail(orderId, paymentDetails);
      await this.updateInventory(orderId);

      console.log(`✅ Payment processed successfully for order: ${orderId}`);

    } catch (error) {
      console.error(`❌ Error processing payment for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Handle cancelled payment
   */
  static async handleCancelledPayment(orderId: string, paymentDetails: any): Promise<void> {
    try {
      console.log(`❌ Processing cancelled payment for order: ${orderId}`);

      await fetchDataWithContext(
        `orders/${orderId}/payment-cancelled`,
        undefined,
        {
          payment_status: 'cancelled',
          status: 'cancelled',
          cancellation_date: new Date().toISOString()
        },
        'PUT'
      );

      await this.recordPaymentCancellation(orderId, paymentDetails);

      console.log(`✅ Payment cancellation processed for order: ${orderId}`);

    } catch (error) {
      console.error(`❌ Error processing payment cancellation for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Record payment attempt for audit trail
   */
  // In payment-service.ts - update the recordPaymentAttempt method
  // In your payment-service.ts - update the recordPaymentAttempt method
  private static async recordPaymentAttempt(orderId: string, paymentData: PayFastPaymentData): Promise<void> {
    try {
      const attemptData = {
        order_id: orderId,
        payment_gateway: 'payfast',
        amount: parseFloat(paymentData.amount),
        reference: paymentData.m_payment_id,
        status: 'initiated',
        payment_data: paymentData,
        created_at: new Date().toISOString()
      };

      console.log('📝 Recording payment attempt:', attemptData);

      await fetchDataWithContext(
        'payment_attempts',
        undefined,
        attemptData,
        'POST'
      );

      console.log('✅ Payment attempt recorded successfully');
    } catch (error) {
      console.warn('⚠️ Payment attempts endpoint not available - continuing without recording');
      // Don't throw - this shouldn't block the payment process
    }
  }

  // Also update the other recording methods similarly:
  private static async recordPaymentSuccess(orderId: string, paymentDetails: any): Promise<void> {
    try {
      await fetchDataWithContext(
        'payment_attempts',
        undefined,
        {
          order_id: orderId,
          payment_gateway: 'payfast',
          amount: parseFloat(paymentDetails.amount_gross),
          reference: paymentDetails.pf_payment_id,
          status: 'completed',
          payment_data: paymentDetails,
          completed_at: new Date().toISOString()
        },
        'PUT'
      );
    } catch (error) {
      console.warn('⚠️ Could not record payment success - endpoint not available');
    }
  }

  private static async recordPaymentCancellation(orderId: string, paymentDetails: any): Promise<void> {
    try {
      await fetchDataWithContext(
        'payment_attempts',
        undefined,
        {
          order_id: orderId,
          payment_gateway: 'payfast',
          status: 'cancelled',
          cancellation_reason: 'user_cancelled',
          cancelled_at: new Date().toISOString()
        },
        'PUT'
      );
    } catch (error) {
      console.warn('⚠️ Could not record payment cancellation - endpoint not available');
    }
  }

  // Update the getPaymentStatus method to handle missing endpoint
  static async getPaymentStatus(orderId: string): Promise<any> {
    try {
      const status = await fetchDataWithContext(
        `payment_attempts/order/${orderId}`,
        undefined,
        undefined,
        'GET'
      );
      return status;
    } catch (error) {
      console.warn('⚠️ Payment status endpoint not available');
      return {
        status: 'unknown',
        message: 'Payment tracking not available'
      };
    }
  }

  private static async sendConfirmationEmail(orderId: string, paymentDetails: any): Promise<void> {
    try {
      console.log(`📧 Sending confirmation email for order ${orderId}`);
      // Implement email sending logic here
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
    }
  }

  private static async updateInventory(orderId: string): Promise<void> {
    try {
      console.log(`📦 Updating inventory for order ${orderId}`);
      // Implement inventory update logic here
    } catch (error) {
      console.error('❌ Error updating inventory:', error);
    }
  }


}
