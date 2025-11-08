// src/app/payment/success/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    Button,
    // FIX: Import Alert sub-components
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Spinner,
    // FIX: Import Card and its sub-components
    Card,
    CardBody,
    Icon,
    StackProps,
    ButtonProps
} from '@chakra-ui/react';
import { FaCheckCircle, FaHome, FaTimesCircle } from 'react-icons/fa';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentStatus() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');
    const [orderDetails, setOrderDetails] = useState<any>(null);

    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref'); // Paystack also uses trxref

    useEffect(() => {
        const verifyPayment = async () => {
            const paystackRef = reference || trxref;
            if (!paystackRef) {
                setVerificationStatus('failed');
                setErrorMessage('No payment reference found in the URL. Your payment might not have been processed correctly.');
                return;
            }

            try {
                // Call our own backend endpoint for verification
                const response = await fetch(`/api/paystack/verify?reference=${paystackRef}`);
                const result = await response.json();

                if (response.ok && result.status === 'success') {
                    // Payment is successful and verified on the backend
                    setVerificationStatus('success');
                    const orderIdFromResult = result.data?.metadata?.custom_fields?.find(
                        (f: any) => f.variable_name === 'order_id'
                    )?.value;
                    setOrderDetails({
                        id: orderIdFromResult,
                        total: result.data.amount / 100, // Convert from kobo/cents
                        reference: result.data.reference
                    });
                    
                    // You can optionally update your main backend order status here if needed
                    // await fetch(`http://127.0.0.1:8000/api/orders/${orderIdFromResult}`, { method: 'PUT', ... });

                } else {
                    // Verification failed on the backend
                    setVerificationStatus('failed');
                    setErrorMessage(result.message || 'Payment verification failed. Please contact support.');
                }
            } catch (error) {
                // Network or other errors during verification
                setVerificationStatus('failed');
                setErrorMessage('An error occurred while verifying your payment. Please contact support if you have been charged.');
            }
        };

        verifyPayment();
    }, [reference, trxref]);

    const handleBackToMenu = () => {
        // This should ideally redirect back to the specific customer menu
        // For now, we'll redirect to a generic page
        router.push('/'); 
    };

    const handleViewOrder = () => {
        if (orderDetails?.id) {
            // Redirect to an order status page if you have one
            // router.push(`/order-status/${orderDetails.id}`);
        }
    };

    return (
        // FIX: Removed redundant `as` prop
        <VStack spacing={6} textAlign="center">
            {verificationStatus === 'verifying' && (
                <>
                    {/* FIX: Removed incorrect `thickness` prop */}
                    <Spinner size="xl" color="blue.500" />
                    <Heading as="h1" size="xl" color="gray.700">
                        Verifying Payment...
                    </Heading>
                    <Text fontSize="lg" color="gray.500">
                        Please wait while we securely confirm your transaction. Do not close this page.
                    </Text>
                </>
            )}

            {verificationStatus === 'success' && (
                <>
                    <Icon as={FaCheckCircle} w={20} h={20} color="green.500" />
                    <Heading as="h1" size="2xl" color="green.600">
                        Payment Successful!
                    </Heading>
                    <Text fontSize="xl" color="gray.600">
                        Thank you for your order.
                    </Text>
                    {/* FIX: Use Card directly */}
                    <Card w="100%" maxW="400px" variant="outline">
                        {/* FIX: Use CardBody directly */}
                        <CardBody>
                            {/* FIX: Removed redundant `as` prop */}
                            <VStack spacing={4}>
                                <Text fontWeight="bold" fontSize="lg">
                                    Order #{orderDetails?.id || 'N/A'}
                                </Text>
                                {orderDetails?.reference && (
                                    <Text fontSize="sm" color="gray.600">
                                        Payment Reference: {orderDetails.reference}
                                    </Text>
                                )}
                                {orderDetails?.total && (
                                    <Text>
                                        Total: <strong>R {orderDetails.total.toFixed(2)}</strong>
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>
                    {/* FIX: Use Alert directly */}
                    <Alert status="success" borderRadius="md">
                        {/* FIX: Use AlertIcon directly */}
                        <AlertIcon />
                        Your payment has been processed successfully and your order is being prepared.
                    </Alert>
                    {/* FIX: Removed redundant `as` prop */}
                    <VStack spacing={3} w="100%" maxW="300px">
                        {/* FIX: Removed redundant `as` prop and fixed leftIcon prop */}
                        <Button
                            variant="outline"
                            size="lg"
                            w="100%"
                            leftIcon={<FaHome />}
                            onClick={handleBackToMenu}
                        >
                            Back to Menu
                        </Button>
                    </VStack>
                </>
            )}

            {verificationStatus === 'failed' && (
                <>
                    <Icon as={FaTimesCircle} w={20} h={20} color="red.500" />
                    <Heading as="h1" size="2xl" color="red.600">
                        Payment Verification Failed
                    </Heading>
                    {/* FIX: Use Alert directly */}
                    <Alert status="error" borderRadius="md">
                        {/* FIX: Use AlertIcon directly */}
                        <AlertIcon />
                        <Box>
                            {/* FIX: Use AlertTitle directly */}
                            <AlertTitle>Verification Error</AlertTitle>
                            {/* FIX: Use AlertDescription directly */}
                            <AlertDescription>
                                {errorMessage || 'We could not confirm your payment. Please contact support if you have been charged.'}
                            </AlertDescription>
                        </Box>
                    </Alert>
                    {/* FIX: Removed redundant `as` prop */}
                    <VStack spacing={3} w="100%" maxW="300px">
                        {/* FIX: Removed redundant `as` prop and fixed leftIcon prop */}
                        <Button
                            variant="outline"
                            size="lg"
                            w="100%"
                            leftIcon={<FaHome />}
                            onClick={handleBackToMenu}
                        >
                            Back to Menu
                        </Button>
                    </VStack>
                </>
            )}
        </VStack>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Container maxW="container.md" py={10}>
            <Suspense fallback={<Spinner />}>
                <PaymentStatus />
            </Suspense>
        </Container>
    );
}