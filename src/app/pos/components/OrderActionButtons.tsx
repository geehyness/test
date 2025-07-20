// src/app/pos/components/OrderActionButtons.tsx
'use client';

import React from 'react';
import { VStack, Button, Flex } from '@chakra-ui/react';
import { FaStickyNote, FaTag, FaChair, FaPaperPlane, FaCashRegister, FaTrash } from 'react-icons/fa';

interface OrderActionButtonsProps {
  onAddNotes: () => void;
  onApplyDiscount: () => void;
  onSelectTable: () => void;
  onSendToKitchen: () => void;
  onCheckout: () => void;
  onClearOrder: () => void;
}

export default function OrderActionButtons({
  onAddNotes,
  onApplyDiscount,
  onSelectTable,
  onSendToKitchen,
  onCheckout,
  onClearOrder,
}: OrderActionButtonsProps) {
  return (
    <VStack spacing={3} mt={6} width="full">
      <Flex width="full" gap={3}>
        <Button
          leftIcon={<FaStickyNote />}
          onClick={onAddNotes}
          colorScheme="gray"
          variant="outline"
          width="full"
          rounded="md"
          borderColor="var(--border-color)"
          color="var(--dark-gray-text)"
          _hover={{ bg: 'var(--light-gray-bg)' }}
        >
          Add Notes
        </Button>
        <Button
          leftIcon={<FaTag />}
          onClick={onApplyDiscount}
          colorScheme="gray"
          variant="outline"
          width="full"
          rounded="md"
          borderColor="var(--border-color)"
          color="var(--dark-gray-text)"
          _hover={{ bg: 'var(--light-gray-bg)' }}
        >
          Discount
        </Button>
      </Flex>
      <Button
        leftIcon={<FaChair />}
        onClick={onSelectTable}
        colorScheme="blue"
        width="full"
        rounded="md"
        bg="blue.500"
        color="white"
        _hover={{ bg: 'blue.600' }}
      >
        Select Table
      </Button>
      <Button
        leftIcon={<FaPaperPlane />}
        onClick={onSendToKitchen}
        colorScheme="orange"
        width="full"
        rounded="md"
        bg="orange.400"
        color="white"
        _hover={{ bg: 'orange.500' }}
      >
        Send to Kitchen
      </Button>
      <Button
        leftIcon={<FaCashRegister />}
        onClick={onCheckout}
        colorScheme="green"
        width="full"
        size="lg"
        rounded="md"
        bg="var(--primary-green)"
        color="white"
        _hover={{ bg: 'darken(var(--primary-green), 10%)' }}
      >
        Checkout
      </Button>
      <Button
        leftIcon={<FaTrash />}
        onClick={onClearOrder}
        colorScheme="red"
        variant="outline"
        width="full"
        rounded="md"
        borderColor="red.300"
        color="red.500"
        _hover={{ bg: 'red.50' }}
      >
        Clear Order
      </Button>
    </VStack>
  );
}