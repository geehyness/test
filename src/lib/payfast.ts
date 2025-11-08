// src/lib/payfast.ts - FIXED VERSION

import { md5 } from 'js-md5';

export interface PayFastPaymentData {
	merchant_id: string;
	merchant_key: string;
	return_url: string;
	cancel_url: string;
	notify_url: string;
	name_first: string;
	name_last: string;
	email_address: string;
	cell_number?: string;
	m_payment_id: string;
	amount: string;
	item_name: string;
	item_description: string;
	custom_str1?: string;
	custom_str2?: string;
	custom_str3?: string;
	custom_str4?: string;
	custom_str5?: string;
	custom_int1?: string;
	custom_int2?: string;
	custom_int3?: string;
	custom_int4?: string;
	custom_int5?: string;
	email_confirmation?: string;
	confirmation_address?: string;
	payment_method?: string;
	signature?: string;
}

export interface PayFastCustomer {
	firstName: string;
	lastName: string;
	email: string;
	cellNumber?: string;
}

export interface PayFastCustomData {
	str1?: string;
	str2?: string;
	str3?: string;
	str4?: string;
	str5?: string;
	int1?: number;
	int2?: number;
	int3?: number;
	int4?: number;
	int5?: number;
}

class PayFastService {
	private merchantId: string;
	private merchantKey: string;
	private passphrase: string;
	private isSandbox: boolean;
	private returnUrl: string;
	private cancelUrl: string;
	private notifyUrl: string;

	constructor() {
		// PayFast sandbox credentials
		this.merchantId = '10000100';
		this.merchantKey = '46f0cd694581a';
		this.passphrase = ''; // No passphrase for sandbox
		this.isSandbox = true;

		// Update these URLs to match your actual domain
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
		this.returnUrl = `${baseUrl}/payment/success`;
		this.cancelUrl = `${baseUrl}/payment/cancelled`;
		this.notifyUrl = `http://127.0.0.1:8000/api/payfast/itn`; // Your backend ITN endpoint
	}

	async createPaymentData(params: {
		amount: number;
		itemName: string;
		itemDescription: string;
		mPaymentId: string;
		customer: PayFastCustomer;
		customData?: PayFastCustomData;
	}): Promise<PayFastPaymentData> {
		const { amount, itemName, itemDescription, mPaymentId, customer, customData } = params;

		// Validate amount
		if (amount <= 0) {
			throw new Error('Amount must be greater than 0');
		}

		// Format amount to string with 2 decimal places
		const formattedAmount = amount.toFixed(2);

		const paymentData: any = {
			merchant_id: this.merchantId,
			merchant_key: this.merchantKey,
			return_url: this.returnUrl,
			cancel_url: this.cancelUrl,
			notify_url: this.notifyUrl,
			name_first: (customer.firstName || 'Customer').substring(0, 100),
			name_last: (customer.lastName || '').substring(0, 100),
			email_address: (customer.email || 'customer@example.com').substring(0, 100),
			m_payment_id: mPaymentId.substring(0, 100),
			amount: formattedAmount,
			item_name: itemName.substring(0, 100),
			item_description: itemDescription.substring(0, 255),
			email_confirmation: '1',
			confirmation_address: (customer.email || 'customer@example.com').substring(0, 100),
		};

		// Add cell number if provided
		if (customer.cellNumber) {
			paymentData.cell_number = customer.cellNumber.substring(0, 100);
		}

		// Add custom data if provided
		if (customData) {
			if (customData.str1) paymentData.custom_str1 = customData.str1.substring(0, 255);
			if (customData.str2) paymentData.custom_str2 = customData.str2.substring(0, 255);
			if (customData.str3) paymentData.custom_str3 = customData.str3.substring(0, 255);
			if (customData.str4) paymentData.custom_str4 = customData.str4.substring(0, 255);
			if (customData.str5) paymentData.custom_str5 = customData.str5.substring(0, 255);
			if (customData.int1 !== undefined) paymentData.custom_int1 = customData.int1.toString();
			if (customData.int2 !== undefined) paymentData.custom_int2 = customData.int2.toString();
			if (customData.int3 !== undefined) paymentData.custom_int3 = customData.int3.toString();
			if (customData.int4 !== undefined) paymentData.custom_int4 = customData.int4.toString();
			if (customData.int5 !== undefined) paymentData.custom_int5 = customData.int5.toString();
		}

		console.log('🔍 Payment data before signature:', paymentData);

		// Generate signature
		paymentData.signature = this.generateSignature(paymentData);

		console.log('🔍 Final payment data with signature:', paymentData);

		// Debug: Verify signature generation
		this.debugSignature(paymentData);

		return paymentData as PayFastPaymentData;
	}

	private generateSignature(data: any): string {
		// 1. Filter and sort parameters alphabetically
		const paramString = Object.keys(data)
			.filter(key =>
				key !== 'signature' &&
				data[key] !== undefined &&
				data[key] !== null &&
				data[key] !== ''
			)
			.sort()
			.map(key => {
				// 2. URL encode both key and value
				const encodedKey = encodeURIComponent(key);
				const encodedValue = encodeURIComponent(data[key].toString()).replace(/%20/g, '+');
				return `${encodedKey}=${encodedValue}`;
			})
			.join('&');

		// 3. Add passphrase if it exists and is not empty
		let stringToSign = paramString;
		if (this.passphrase && this.passphrase.trim() !== '') {
			const encodedPassphrase = encodeURIComponent(this.passphrase).replace(/%20/g, '+');
			stringToSign = `${paramString}&passphrase=${encodedPassphrase}`;
		}

		console.log('String being signed:', stringToSign);

		// 4. Generate MD5 hash
		return md5(stringToSign);
	}

	testSignatureGeneration(): void {
		const testData = {
			merchant_id: this.merchantId,
			merchant_key: this.merchantKey,
			return_url: this.returnUrl,
			amount: '100.00',
			item_name: 'Test Item'
		};
		
		console.log('Testing Signature Generation:');
		const signature = this.generateSignature(testData);
		console.log('Generated Signature:', signature);
	}

	private isEmptyValue(value: any): boolean {
		if (value === undefined || value === null) return true;
		if (typeof value === 'string' && value.trim() === '') return true;
		if (typeof value === 'number' && isNaN(value)) return true;
		return false;
	}

	private debugSignature(paymentData: any): void {
		// Remove signature for debugging
		const debugData = { ...paymentData };
		delete debugData.signature;

		const paramString = Object.keys(debugData)
			.filter(key =>
				!this.isEmptyValue(debugData[key])
			)
			.sort()
			.map(key => {
				const value = debugData[key].toString();
				return `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`;
			})
			.join('&');

		const stringToSign = this.passphrase
			? `${paramString}&passphrase=${encodeURIComponent(this.passphrase).replace(/%20/g, '+')}`
			: paramString;

		console.log('🐛 DEBUG SIGNATURE GENERATION:');
		console.log('📋 Parameters (alphabetical order):');
		Object.keys(debugData)
			.filter(key => !this.isEmptyValue(debugData[key]))
			.sort()
			.forEach(key => {
				console.log(`   ${key}: ${debugData[key]}`);
			});
		console.log('🔗 Param string:', paramString);
		console.log('🔗 String to sign:', stringToSign);
		console.log('🔑 Generated signature:', md5(stringToSign));
		console.log('📤 Submitted signature:', paymentData.signature);
	}

	async submitPayment(paymentData: PayFastPaymentData): Promise<void> {
		const baseUrl = this.isSandbox
			? 'https://sandbox.payfast.co.za/eng/process'
			: 'https://www.payfast.co.za/eng/process';

		try {
			console.log('🚀 Submitting to PayFast:', {
				url: baseUrl,
				data: paymentData,
				isSandbox: this.isSandbox
			});

			// Debug: Log all fields being sent in alphabetical order
			console.log('🔍 PayFast Payment Data Fields (alphabetical order):');
			Object.keys(paymentData)
				.sort()
				.forEach(key => {
					const value = paymentData[key as keyof PayFastPaymentData];
					if (!this.isEmptyValue(value)) {
						console.log(`   ${key}: ${value} (length: ${value?.toString().length})`);
					}
				});

			// Validate required fields
			const requiredFields = ['merchant_id', 'merchant_key', 'amount', 'item_name'];
			const missingFields = requiredFields.filter(field =>
				this.isEmptyValue(paymentData[field as keyof PayFastPaymentData])
			);

			if (missingFields.length > 0) {
				throw new Error(`Missing required PayFast fields: ${missingFields.join(', ')}`);
			}

			// Create form and submit
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = baseUrl;
			form.style.display = 'none';

			// Add all payment data as hidden inputs in alphabetical order
			Object.keys(paymentData)
				.sort()
				.forEach(key => {
					const value = paymentData[key as keyof PayFastPaymentData];
					if (!this.isEmptyValue(value)) {
						const input = document.createElement('input');
						input.type = 'hidden';
						input.name = key;
						input.value = value as string;
						form.appendChild(input);

						console.log(`📝 Adding field: ${key} = ${value}`);
					}
				});

			document.body.appendChild(form);
			console.log('✅ Form created with', form.children.length, 'fields');

			// Verify the form data
			console.log('🔍 Final form data verification:');
			Array.from(form.elements).forEach((element: any) => {
				if (element.type === 'hidden') {
					console.log(`   ${element.name}: ${element.value}`);
				}
			});

			form.submit();

		} catch (error) {
			console.error('❌ PayFast submission error:', error);
			throw new Error('Failed to redirect to PayFast: ' + error.message);
		}
	}

	/*/ Test method to verify signature generation
	testSignatureGeneration(): void {
		const testData = {
			merchant_id: this.merchantId,
			merchant_key: this.merchantKey,
			return_url: this.returnUrl,
			amount: '100.00',
			item_name: 'Test Item'
		};

		console.log('🧪 TESTING SIGNATURE GENERATION:');
		const signature = this.generateSignature(testData);
		console.log('✅ Test signature:', signature);
		console.log('✅ Signature length:', signature.length);
		console.log('✅ Signature format (should be 32 hex chars):', /^[a-f0-9]{32}$/.test(signature));
	}*/

	// Get PayFast environment info
	getEnvironment() {
		return {
			isSandbox: this.isSandbox,
			merchantId: this.merchantId,
			baseUrl: this.isSandbox
				? 'https://sandbox.payfast.co.za'
				: 'https://www.payfast.co.za'
		};
	}
}

export const payfastService = new PayFastService();