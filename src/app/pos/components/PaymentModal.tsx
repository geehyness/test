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
  Spacer,
  useToast,
  Flex,
  Box // Import Box here
} from '@chakra-ui/react';
import { FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  onProcessPayment: (method: 'cash' | 'card' | 'split', tenderedAmount?: number) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderTotal,
  onProcessPayment,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<number | ''>(orderTotal);
  const toast = useToast();

  const changeDue = typeof cashTendered === 'number' ? cashTendered - orderTotal : 0;

  const handleProcessClick = () => {
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
      onProcessPayment('cash', cashTendered);
    } else if (paymentMethod === 'card') {
      onProcessPayment('card');
    } else if (paymentMethod === 'split') {
      // For split payment, you'd likely open another modal or have more complex UI
      // For simplicity, we'll just process it as a placeholder for now
      toast({
        title: 'Split Payment Initiated',
        description: 'Split payment flow would begin here.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      onProcessPayment('split');
    }
    // onClose(); // Close modal after processing
  };

  // Reset cash tendered when modal opens or total changes
  React.useEffect(() => {
    if (isOpen) {
      setCashTendered(orderTotal);
    }
  }, [isOpen, orderTotal]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent rounded="lg" bg="var(--background-color-light)" color="var(--dark-gray-text)">
        <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>Process Payment</ModalHeader>
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
              <FormLabel as="legend" color="var(--dark-gray-text)" fontWeight="semibold">Select Payment Method</FormLabel>
              <RadioGroup onChange={(value: 'cash' | 'card' | 'split') => setPaymentMethod(value)} value={paymentMethod}>
                <HStack spacing={5}>
                  <Radio value="cash" colorScheme="green" size="lg">
                    <HStack>
                      <FaMoneyBillWave /> <Text>Cash</Text>
                    </HStack>
                  </Radio>
                  <Radio value="card" colorScheme="blue" size="lg">
                    <HStack>
                      <FaCreditCard /> <Text>Card</Text>
                    </HStack>
                  </Radio>
                  {/* <Radio value="split" colorScheme="purple" size="lg">
                    <HStack>
                      <FaHandshake /> <Text>Split Payment</Text>
                    </HStack>
                  </Radio> */}
                </HStack>
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

            {paymentMethod === 'card' && (
              <Box mt={4} p={4} borderWidth="1px" rounded="md" borderColor="var(--border-color)" bg="var(--light-gray-bg)">
                <Text textAlign="center" color="var(--medium-gray-text)">
                  Simulating Card Payment...
                </Text>
                <Text textAlign="center" fontSize="sm" color="var(--medium-gray-text)" mt={2}>
                  In a real application, this would integrate with a payment gateway.
                </Text>
              </Box>
            )}

            {/* {paymentMethod === 'split' && (
              <Box mt={4} p={4} borderWidth="1px" rounded="md" borderColor="var(--border-color)" bg="var(--light-gray-bg)">
                <Text textAlign="center" color="var(--medium-gray-text)">
                  Split Payment Options (e.g., by amount, by item, multiple methods)
                </Text>
                <Text textAlign="center" fontSize="sm" color="var(--medium-gray-text)" mt={2}>
                  This section would contain UI for managing split payments.
                </Text>
              </Box>
            )} */}

          </VStack>
        </ModalBody>
        <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
          <Button variant="ghost" onClick={onClose} mr={3}>Cancel</Button>
          <Button
            bg="var(--primary-green)"
            color="white"
            _hover={{ bg: 'darken(var(--primary-green), 10%)' }}
            onClick={handleProcessClick}
            isDisabled={paymentMethod === 'cash' && (typeof cashTendered !== 'number' || cashTendered < orderTotal)}
          >
            Process Payment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
