// src/app/payment/cancel/page.tsx
"use client";

import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  Button, 
  Alert, 
  AlertIcon,
  Icon
} from '@chakra-ui/react';
import { FaTimesCircle, FaShoppingCart, FaHome } from 'react-icons/fa';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PaymentCancel() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('order_id');
  const pfPaymentId = searchParams.get('pf_payment_id');

  const handleRetryPayment = () => {
    if (orderId) {
      router.push(`/checkout?order_id=${orderId}`);
    } else {
      router.push('/');
    }
  };

  const handleBackToMenu = () => {
    router.push('/');
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={6} textAlign="center">
        {/* Cancel Icon */}
        <Icon as={FaTimesCircle} w={20} h={20} color="red.500" />
        
        {/* Main Heading */}
        <Heading as="h1" size="2xl" color="red.600">
          Payment Cancelled
        </Heading>
        
        {/* Subtitle */}
        <Text fontSize="xl" color="gray.600">
          Your payment was not completed
        </Text>

        {/* Order Info */}
        {(orderId || pfPaymentId) && (
          <VStack spacing={2}>
            {orderId && (
              <Text fontSize="sm" color="gray.600">
                Order: #{orderId}
              </Text>
            )}
            {pfPaymentId && (
              <Text fontSize="sm" color="gray.600">
                Payment Reference: {pfPaymentId}
              </Text>
            )}
          </VStack>
        )}

        {/* Alert */}
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Your payment was cancelled. No charges have been made to your account.
        </Alert>

        {/* Action Buttons */}
        <VStack spacing={3} w="100%" maxW="300px">
          <Button
            colorScheme="blue"
            size="lg"
            w="100%"
            leftIcon={<FaShoppingCart />}
            onClick={handleRetryPayment}
          >
            Retry Payment
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
          If you continue to experience issues, please contact our support team.
        </Text>
      </VStack>
    </Container>
  );
}