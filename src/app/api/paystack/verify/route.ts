// src/app/api/paystack/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not defined in environment variables.");
}

const paystackAxios = axios.create({
    baseURL: 'https://api.paystack.co',
    headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
    },
});

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
        return NextResponse.json({ message: 'Reference is required' }, { status: 400 });
    }

    try {
        const { data: verification } = await paystackAxios.get(`/transaction/verify/${reference}`);

        if (verification.status === true && verification.data.status === 'success') {
            // Payment is successful
            // You can update your database here with the orderId from metadata
            const orderId = verification.data.metadata.custom_fields.find(
                (field: any) => field.variable_name === 'order_id'
            )?.value;

            // TODO: Update order status in your main backend (FastAPI)
            // For now, just return success
            console.log(`Payment successful for order: ${orderId}`);

            return NextResponse.json({
                status: 'success',
                message: 'Payment verified successfully',
                data: verification.data,
            }, { status: 200 });
        } else {
            return NextResponse.json({
                status: 'failed',
                message: verification.message || 'Payment verification failed',
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Error verifying Paystack transaction:', error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json({ message: error.response?.data?.message || 'Paystack API error' }, { status: error.response?.status || 500 });
        }
        return NextResponse.json({ message: 'Internal server error while verifying payment' }, { status: 500 });
    }
}