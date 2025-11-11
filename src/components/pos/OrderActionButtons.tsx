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
    <VStack spacing={3} mt={6} w="full">
      <HStack w="full">
        <Button
          leftIcon={<FaStickyNote />}
          onClick={onAddNotes}
          variant="outline"
          colorScheme="gray"
          flex="1"
        >
          Notes
        </Button>
        <Button
          leftIcon={<FaTag />}
          onClick={onApplyDiscount}
          variant="outline"
          colorScheme="gray"
          flex="1"
        >
          Discount
        </Button>
        <Button
          leftIcon={<FaChair />}
          onClick={onSelectTable}
          variant="outline"
          colorScheme="gray"
          flex="1"
        >
          Table
        </Button>
      </HStack>
      <HStack w="full">
        <Button
          leftIcon={<FaPaperPlane />}
          onClick={onSendToKitchen}
          colorScheme="orange"
          flex="1"
          isDisabled={isOrderEmpty || isOrderSent}
        >
          {isOrderSent ? "Sent to Kitchen" : "Send to Kitchen"}
        </Button>
        <Button
          leftIcon={<FaTrash />}
          onClick={onClearOrder}
          colorScheme="red"
          variant="outline"
          flex="1"
        >
          Clear Order
        </Button>
      </HStack>
      <Button
        leftIcon={<FaCashRegister />}
        onClick={onOpenPaymentModal} // Use the new prop here
        colorScheme="green"
        size="lg"
        width="full"
        isDisabled={isOrderEmpty}
      >
        Checkout
      </Button>
    </VStack>
  );
}