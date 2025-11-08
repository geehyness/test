// src/app/api/paystack/initialize-transaction/route.ts

import { NextResponse } from 'next/server';
// You will need to install this library: npm install paystack-api
import Paystack from 'paystack-api';

// Initialize the Paystack client with your secret key from .env.local
// It's crucial to only use the Secret Key (sk_...) here, not the Public Key (pk_...).
if (!process.env.PAYSTACK_SECRET_KEY) {
	throw new Error("PAYSTACK_SECRET_KEY is not defined in environment variables.");
}
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

export async function POST(request: Request) {
	try {
		const { amount, email, currency, orderId, callbackUrl } = await request.json();

		if (!amount || !email || !currency || !orderId || !callbackUrl) {
			return NextResponse.json({ message: 'Missing required fields: amount, email, currency, orderId, or callbackUrl' }, { status: 400 });
		}

		// Initialize transaction with Paystack API
		const transaction = await paystack.transaction.initialize({
			amount: amount, // Must be in the lowest currency unit (Kobo/Cents), e.g., ZAR * 100
			email: email,
			currency: currency, // Should be "ZAR"
			callback_url: callbackUrl,
			// Pass order details as metadata for later verification
			metadata: {
				custom_fields: [
					{
						display_name: "Order ID",
						variable_name: "order_id",
						value: orderId,
					},
				],
			},
		});

		if (transaction.status === true) {
			// Return the authorization URL to the client for redirection
			return NextResponse.json({ authorization_url: transaction.data.authorization_url }, { status: 200 });
		} else {
			// Handle error response from Paystack API
			return NextResponse.json({ message: transaction.message || 'Paystack initialization failed' }, { status: 500 });
		}

	} catch (error) {
		console.error('Error initializing Paystack transaction:', error);
		return NextResponse.json({ message: 'Internal server error while initializing payment' }, { status: 500 });
	}
}