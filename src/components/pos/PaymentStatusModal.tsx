// src/app/pos/components/PaymentStatusModal.tsx
'use client';

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  HStack,
  Box,
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaHome, FaReceipt, FaCreditCard } from 'react-icons/fa';

interface PaymentStatusModalProps {
  isOpen: boolean;
  status: 'success' | 'cancel' | 'processing' | null;
  orderId?: string;
  transactionId?: string;
  onClose: () => void;
  onRetry?: () => void;
  onViewReceipt?: () => void;
}

export default function PaymentStatusModal({
  isOpen,
  status,
  orderId,
  transactionId,
  onClose,
  onRetry,
  onViewReceipt,
}: PaymentStatusModalProps) {
  if (!status) return null;

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <VStack spacing={6} textAlign="center" py={8}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <VStack spacing={2}>
              <Text fontSize="xl" fontWeight="medium" color="blue.600">
                Processing Payment...
              </Text>
              <Text fontSize="sm" color="gray.600">
                Please wait while we verify your payment.
              </Text>
            </VStack>
          </VStack>
        );

      case 'success':
        return (
          <VStack spacing={6} textAlign="center" py={4}>
            <Box color="green.500">
              <FaCheckCircle size={64} />
            </Box>
            
            <VStack spacing={3}>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                Payment Successful!
              </Text>
              <Text fontSize="lg" color="gray.600">
                Thank you for your payment. Your order has been processed successfully.
              </Text>
            </VStack>

            {(orderId || transactionId) && (
              <Alert status="info" borderRadius="md" maxW="sm">
                <AlertIcon />
                <Box>
                  <AlertTitle>Payment Confirmed</AlertTitle>
                  <AlertDescription>
                    {orderId && `Order: ${orderId}`}
                    {transactionId && ` | Transaction: ${transactionId}`}
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            <HStack spacing={3} pt={2}>
              <Button
                leftIcon={<FaHome />}
                colorScheme="blue"
                variant="outline"
                onClick={onClose}
              >
                Back to POS
              </Button>
              <Button
                leftIcon={<FaReceipt />}
                colorScheme="green"
                onClick={onViewReceipt}
              >
                View Receipt
              </Button>
            </HStack>
          </VStack>
        );

      case 'cancel':
        return (
          <VStack spacing={6} textAlign="center" py={4}>
            <Box color="red.500">
              <FaTimesCircle size={64} />
            </Box>
            
            <VStack spacing={3}>
              <Text fontSize="2xl" fontWeight="bold" color="red.600">
                Payment Cancelled
              </Text>
              <Text fontSize="lg" color="gray.600">
                Your payment was cancelled. No charges have been made to your account.
              </Text>
            </VStack>

            <Alert status="warning" borderRadius="md" maxW="sm">
              <AlertIcon />
              You can try again or choose a different payment method.
            </Alert>

            <HStack spacing={3} pt={2}>
              <Button
                leftIcon={<FaHome />}
                colorScheme="blue"
                variant="outline"
                onClick={onClose}
              >
                Back to POS
              </Button>
              <Button
                leftIcon={<FaCreditCard />}
                colorScheme="orange"
                onClick={onRetry}
              >
                Try Again
              </Button>
            </HStack>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="md" 
      isCentered
      closeOnOverlayClick={status !== 'processing'}
      closeOnEsc={status !== 'processing'}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={6}>
          {renderContent()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}