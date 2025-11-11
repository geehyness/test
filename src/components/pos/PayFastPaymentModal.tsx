// src/components/pos/PayFastPaymentModal.tsx
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Box,
  HStack,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react';
import { FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';
import { payfastService, PayFastPaymentData } from '@/lib/payfast';
import { Order } from '@/lib/config/entities';

interface PayFastPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    cellNumber?: string;
  };
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
}

export const PayFastPaymentModal: React.FC<PayFastPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  customer,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePayFastPayment = async () => {
    try {
      setIsProcessing(true);

      // Create payment data
      const paymentData = await payfastService.createPaymentData({
        amount: order.total_amount,
        itemName: `Order #${order.id}`,
        itemDescription: `Payment for order ${order.id} at ${new Date().toLocaleDateString()}`,
        mPaymentId: order.id,
        customer: {
          firstName: customer?.firstName || 'Customer',
          lastName: customer?.lastName || '',
          email: customer?.email || '',
          cellNumber: customer?.cellNumber,
        },
        customData: {
          str1: JSON.stringify({
            orderId: order.id,
            storeId: order.store_id,
            tableId: order.table_id,
          }),
        },
      });

      // Submit payment
      payfastService.submitPayment(paymentData);

      // Note: The actual payment result will come via the notify_url webhook
      // We'll handle the redirect in the success/cancel pages

    } catch (error) {
      console.error('PayFast payment error:', error);
      onPaymentError?.(error instanceof Error ? error.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <FaCreditCard />
            <Text>Pay with PayFast</Text>
          </HStack>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Secure Payment</Text>
                <Text fontSize="sm">
                  You will be redirected to PayFast's secure payment gateway to complete your transaction.
                </Text>
              </Box>
            </Alert>

            <Box p={3} bg="gray.50" borderRadius="md">
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="medium">Order Total:</Text>
                  <Text fontWeight="bold" color="green.600">
                    R {order.total_amount.toFixed(2)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Order ID:</Text>
                  <Text fontSize="sm" fontFamily="mono">
                    {order.id}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <HStack spacing={3} color="gray.600" justify="center">
              <HStack spacing={1}>
                <FaLock size={12} />
                <Text fontSize="sm">256-bit SSL</Text>
              </HStack>
              <HStack spacing={1}>
                <FaShieldAlt size={12} />
                <Text fontSize="sm">PCI DSS Compliant</Text>
              </HStack>
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="outline"
              onClick={handleClose}
              isDisabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handlePayFastPayment}
              isLoading={isProcessing}
              loadingText="Redirecting..."
              leftIcon={<FaCreditCard />}
            >
              Proceed to PayFast
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};