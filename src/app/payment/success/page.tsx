// src/app/payment/success/page.tsx
"use client";

import { useEffect, useState } from 'react';
import {
	Box,
	Container,
	Heading,
	Text,
	VStack,
	Button,
	Alert,
	AlertIcon,
	Spinner,
	Card,
	CardBody,
	Icon
} from '@chakra-ui/react';
import { FaCheckCircle, FaShoppingCart, FaHome } from 'react-icons/fa';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PaymentSuccess() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [orderDetails, setOrderDetails] = useState<any>(null);

	const orderId = searchParams.get('order_id');
	const pfPaymentId = searchParams.get('pf_payment_id');
	const paymentStatus = searchParams.get('payment_status');

	useEffect(() => {
		// Simulate loading order details
		const loadOrderDetails = async () => {
			try {
				// In a real app, you would fetch order details from your API
				await new Promise(resolve => setTimeout(resolve, 2000));

				setOrderDetails({
					id: orderId,
					total: 150.00, // This would come from your API
					items: 3, // This would come from your API
					estimatedTime: '20-30 minutes'
				});
			} catch (error) {
				console.error('Error loading order details:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadOrderDetails();
	}, [orderId]);

	const handleBackToMenu = () => {
		router.push('/');
	};

	const handleViewOrder = () => {
		if (orderId) {
			router.push(`/orders/${orderId}`);
		}
	};

	return (
		<Container maxW="container.md" py={10}>
			<VStack spacing={6} textAlign="center">
				{/* Success Icon */}
				<Icon as={FaCheckCircle} w={20} h={20} color="green.500" />

				{/* Main Heading */}
				<Heading as="h1" size="2xl" color="green.600">
					Payment Successful!
				</Heading>

				{/* Subtitle */}
				<Text fontSize="xl" color="gray.600">
					Thank you for your order
				</Text>

				{isLoading ? (
					<VStack spacing={4}>
						<Spinner size="xl" color="green.500" />
						<Text>Loading your order details...</Text>
					</VStack>
				) : (
					<Card w="100%" maxW="400px">
						<CardBody>
							<VStack spacing={4}>
								<Text fontWeight="bold" fontSize="lg">
									Order #{orderId}
								</Text>

								{pfPaymentId && (
									<Text fontSize="sm" color="gray.600">
										Payment Reference: {pfPaymentId}
									</Text>
								)}

								{orderDetails && (
									<>
										<Text>
											Total: <strong>R {orderDetails.total.toFixed(2)}</strong>
										</Text>
										<Text>
											Items: <strong>{orderDetails.items}</strong>
										</Text>
										<Text>
											Estimated Preparation Time: <strong>{orderDetails.estimatedTime}</strong>
										</Text>
									</>
								)}
							</VStack>
						</CardBody>
					</Card>
				)}

				{/* Success Alert */}
				<Alert status="success" borderRadius="md">
					<AlertIcon />
					Your payment has been processed successfully. You will receive a confirmation email shortly.
				</Alert>

				{/* Action Buttons */}
				<VStack spacing={3} w="100%" maxW="300px">
					<Button
						colorScheme="green"
						size="lg"
						w="100%"
						leftIcon={<FaShoppingCart />}
						onClick={handleViewOrder}
						isDisabled={!orderId}
					>
						View Order Details
					</Button>

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

				{/* Additional Info */}
				<Text fontSize="sm" color="gray.500" mt={4}>
					If you have any questions about your order, please contact our support team.
				</Text>
			</VStack>
		</Container>
	);
}