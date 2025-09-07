// src/app/pos/components/OrderActionButtons.tsx
"use client";

import React from "react";
import {
  VStack,
  Button,
  Flex,
  Text,
  HStack,
  Icon,
  Box,
  Badge,
} from "@chakra-ui/react";
import {
  FaStickyNote,
  FaTag,
  FaChair,
  FaPaperPlane,
  FaCashRegister,
  FaTrash,
  FaMoneyBillWave,
  FaCreditCard,
  FaCheckCircle,
} from "react-icons/fa";
import { Order } from "@/lib/config/entities";

interface OrderActionButtonsProps {
  onAddNotes: () => void;
  onApplyDiscount: () => void;
  onSelectTable: () => void;
  onSendToKitchen: () => void;
  onOpenPaymentModal: () => void; // New prop to open the payment modal
  onClearOrder: () => void;
  currentOrder: Order;
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => Promise<void>;
}

export default function OrderActionButtons({
  onAddNotes,
  onApplyDiscount,
  onSelectTable,
  onSendToKitchen,
  onOpenPaymentModal, // Destructure the new prop
  onClearOrder,
  currentOrder,
}: OrderActionButtonsProps) {
  const isOrderEmpty = currentOrder.items.length === 0;
  const isOrderSent =
    currentOrder.status !== "new" && currentOrder.status !== "pending";

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
          _hover={{ bg: "var(--light-gray-bg)" }}
          isDisabled={isOrderEmpty || isOrderSent}
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
          _hover={{ bg: "var(--light-gray-bg)" }}
          isDisabled={isOrderEmpty || isOrderSent}
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
        _hover={{ bg: "blue.600" }}
        isDisabled={isOrderSent}
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
        _hover={{ bg: "orange.500" }}
        isDisabled={
          isOrderEmpty ||
          isOrderSent ||
          (!currentOrder.table_id && currentOrder.order_type !== "takeaway")
        }
      >
        Send to Kitchen
      </Button>

      {/* Checkout Button - now opens the parent-controlled modal */}
      <Button
        leftIcon={<FaCashRegister />}
        onClick={onOpenPaymentModal}
        colorScheme="green"
        width="full"
        size="lg"
        rounded="md"
        bg="var(--primary-green)"
        color="white"
        _hover={{ bg: "darken(var(--primary-green), 10%)" }}
        isDisabled={isOrderEmpty || isOrderSent}
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
        _hover={{ bg: "red.50" }}
        isDisabled={isOrderEmpty}
      >
        Clear Order
      </Button>

      {/* The Modal component has been removed from this file */}
    </VStack>
  );
}