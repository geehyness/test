// src/app/pos/components/PaymentModal.tsx
'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  VStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  HStack,
  RadioGroup,
  Radio,
  useToast,
  Flex,
  Box,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FaMoneyBillWave, FaCreditCard, FaShieldAlt, FaLock } from 'react-icons/fa';
import { payfastService } from '@/lib/payfast';
import PaymentStatusModal from './PaymentStatusModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  orderId: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    cellNumber?: string;
  };
  onProcessPayment: (method: 'cash' | 'card' | 'split' | 'payfast', tenderedAmount?: number, transactionId?: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderTotal,
  orderId,
  customer,
  onProcessPayment,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split' | 'payfast'>('cash');
  const [cashTendered, setCashTendered] = useState<number | ''>(orderTotal);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancel' | 'processing' | null>(null);
  const [transactionId, setTransactionId] = useState<string>('');
  const toast = useToast();

  const changeDue = typeof cashTendered === 'number' ? cashTendered - orderTotal : 0;

  const handleProcessClick = async () => {
    if (paymentMethod === 'cash') {
      if (typeof cashTendered !== 'number' || cashTendered < orderTotal) {
        toast({
          title: 'Insufficient Cash',
          description: 'Tendered amount must be greater than or equal to the total.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsProcessing(true);
      setPaymentStatus('processing');

      // Simulate cash processing
      setTimeout(() => {
        const mockTransactionId = `CASH-${Date.now()}`;
        setTransactionId(mockTransactionId);
        setPaymentStatus('success');
        onProcessPayment('cash', cashTendered, mockTransactionId);
        setIsProcessing(false);
      }, 1500);

    } else if (paymentMethod === 'card') {
      setIsProcessing(true);
      setPaymentStatus('processing');

      // Simulate card processing
      setTimeout(() => {
        const mockTransactionId = `CARD-${Date.now()}`;
        setTransactionId(mockTransactionId);
        setPaymentStatus('success');
        onProcessPayment('card', undefined, mockTransactionId);
        setIsProcessing(false);
      }, 2000);

    } else if (paymentMethod === 'payfast') {
      handlePayFastPayment();
    } else if (paymentMethod === 'split') {
      toast({
        title: 'Split Payment Initiated',
        description: 'Split payment flow would begin here.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      onProcessPayment('split');
    }
  };

  const handlePayFastPayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');

      // Create payment data for PayFast
      const paymentData = payfastService.createPaymentData({
        amount: orderTotal,
        itemName: `Order #${orderId}`,
        itemDescription: `Restaurant order ${orderId}`,
        mPaymentId: orderId,
        customer: {
          firstName: customer?.firstName || 'Customer',
          lastName: customer?.lastName,
          email: customer?.email,
          cellNumber: customer?.cellNumber,
        },
        customData: {
          str1: JSON.stringify({
            orderId: orderId,
            type: 'restaurant_order',
            timestamp: new Date().toISOString(),
          }),
        },
      });

      // For demo purposes, simulate PayFast payment
      // In real implementation, this would redirect to PayFast
      setTimeout(() => {
        const mockTransactionId = `PF-${Date.now()}`;
        setTransactionId(mockTransactionId);
        setPaymentStatus('success');
        onProcessPayment('payfast', undefined, mockTransactionId);
        setIsProcessing(false);
      }, 2500);

      // Actual PayFast integration (commented out for demo)
      // payfastService.submitPayment(paymentData);

    } catch (error) {
      console.error('PayFast payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to process PayFast payment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsProcessing(false);
      setPaymentStatus(null);
    }
  };

  const handleStatusModalClose = () => {
    setPaymentStatus(null);
    setTransactionId('');
    if (paymentStatus === 'success' || paymentStatus === 'cancel') {
      onClose();
    }
  };

  const handleRetryPayment = () => {
    setPaymentStatus(null);
    setTransactionId('');
    // Optionally reset to a specific payment method
    // setPaymentMethod('payfast');
  };

  const handleViewReceipt = () => {
    // Implement receipt viewing logic
    console.log('View receipt for order:', orderId);
    toast({
      title: 'Receipt Generated',
      description: 'Receipt has been generated successfully.',
      status: 'success',
      duration: 3000,
    });
  };

  const handleCancelPayment = () => {
    setPaymentStatus('cancel');
    setIsProcessing(false);
  };

  // Reset cash tendered when modal opens or total changes
  React.useEffect(() => {
    if (isOpen) {
      setCashTendered(orderTotal);
      setPaymentStatus(null);
      setTransactionId('');
      setIsProcessing(false);
    }
  }, [isOpen, orderTotal]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent rounded="lg" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>
            Process Payment
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Text fontSize="2xl" fontWeight="bold" color="var(--dark-gray-text)" fontFamily="var(--font-lexend-deca)">
                  Order Total:
                </Text>
                <Text fontSize="3xl" fontWeight="extrabold" color="var(--primary-green)" fontFamily="var(--font-lexend-deca)">
                  R {orderTotal.toFixed(2)}
                </Text>
              </Flex>

              <FormControl as="fieldset">
                <FormLabel as="legend" color="var(--dark-gray-text)" fontWeight="semibold">
                  Select Payment Method
                </FormLabel>
                <RadioGroup
                  onChange={(value: 'cash' | 'card' | 'split' | 'payfast') => setPaymentMethod(value)}
                  value={paymentMethod}
                >
                  <VStack spacing={3} align="stretch">
                    <Radio value="cash" colorScheme="green" size="lg" isDisabled={isProcessing}>
                      <HStack spacing={3}>
                        <FaMoneyBillWave />
                        <VStack align="start" spacing={0}>
                          <Text>Cash</Text>
                          <Text fontSize="sm" color="var(--medium-gray-text)">
                            Pay with cash
                          </Text>
                        </VStack>
                      </HStack>
                    </Radio>

                    <Radio value="card" colorScheme="blue" size="lg" isDisabled={isProcessing}>
                      <HStack spacing={3}>
                        <FaCreditCard />
                        <VStack align="start" spacing={0}>
                          <Text>Card</Text>
                          <Text fontSize="sm" color="var(--medium-gray-text)">
                            Credit/Debit card
                          </Text>
                        </VStack>
                      </HStack>
                    </Radio>

                    <Radio value="payfast" colorScheme="orange" size="lg" isDisabled={isProcessing}>
                      <HStack spacing={3}>
                        <FaShieldAlt />
                        <VStack align="start" spacing={0}>
                          <Text>PayFast</Text>
                          <Text fontSize="sm" color="var(--medium-gray-text)">
                            Secure online payment
                          </Text>
                        </VStack>
                      </HStack>
                    </Radio>
                  </VStack>
                </RadioGroup>
              </FormControl>

              {paymentMethod === 'cash' && (
                <Box>
                  <FormControl mt={4}>
                    <FormLabel color="var(--dark-gray-text)">Cash Tendered</FormLabel>
                    <Input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(parseFloat(e.target.value) || '')}
                      placeholder="Enter amount received"
                      size="lg"
                      rounded="md"
                      borderColor="var(--border-color)"
                      focusBorderColor="var(--primary-green)"
                      color="var(--dark-gray-text)"
                      isDisabled={isProcessing}
                    />
                  </FormControl>
                  <Flex justify="space-between" mt={3} align="center">
                    <Text fontSize="lg" color="var(--medium-gray-text)">Change Due:</Text>
                    <Text fontSize="2xl" fontWeight="bold" color={changeDue >= 0 ? 'green.500' : 'red.500'}>
                      R {changeDue.toFixed(2)}
                    </Text>
                  </Flex>
                </Box>
              )}

              {paymentMethod === 'payfast' && (
                <Box mt={4}>
                  <Alert status="info" borderRadius="md" mb={3}>
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Secure Payment</Text>
                      <Text fontSize="sm">
                        You will be redirected to PayFast's secure payment gateway.
                      </Text>
                    </Box>
                  </Alert>

                  <VStack spacing={2} align="stretch" p={3} bg="orange.50" borderRadius="md">
                    <HStack spacing={2} color="orange.600">
                      <FaLock size={14} />
                      <Text fontSize="sm" fontWeight="medium">256-bit SSL Encryption</Text>
                    </HStack>
                    <HStack spacing={2} color="orange.600">
                      <FaShieldAlt size={14} />
                      <Text fontSize="sm" fontWeight="medium">PCI DSS Compliant</Text>
                    </HStack>
                  </VStack>

                  <Text fontSize="sm" color="var(--medium-gray-text)" mt={2} textAlign="center">
                    Supports credit cards, debit cards, EFT, and mobile payments
                  </Text>
                </Box>
              )}

              {isProcessing && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text>Processing {paymentMethod} payment...</Text>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
            <Button
              variant="ghost"
              onClick={isProcessing ? handleCancelPayment : onClose}
              mr={3}
              colorScheme={isProcessing ? "red" : "gray"}
            >
              {isProcessing ? 'Cancel Payment' : 'Cancel'}
            </Button>
            <Button
              bg={paymentMethod === 'payfast' ? 'orange.500' : 'var(--primary-green)'}
              color="white"
              _hover={{
                bg: paymentMethod === 'payfast' ? 'orange.600' : 'darken(var(--primary-green), 10%)'
              }}
              onClick={handleProcessClick}
              isDisabled={
                (paymentMethod === 'cash' && (typeof cashTendered !== 'number' || cashTendered < orderTotal)) ||
                isProcessing
              }
              isLoading={isProcessing}
              loadingText="Processing..."
            >
              {paymentMethod === 'payfast' ? 'Proceed to PayFast' : 'Process Payment'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payment Status Modal */}
      <PaymentStatusModal
        isOpen={!!paymentStatus}
        status={paymentStatus}
        orderId={orderId}
        transactionId={transactionId}
        onClose={handleStatusModalClose}
        onRetry={handleRetryPayment}
        onViewReceipt={handleViewReceipt}
      />
    </>
  );
}