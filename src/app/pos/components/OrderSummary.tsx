// src/app/pos/components/OrderSummary.tsx
"use client";

import React from "react";
import {
  Box,
  Heading,
  VStack,
  Flex,
  Text,
  HStack,
  IconButton,
  Divider,
  Spacer,
  Badge,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon, DeleteIcon } from "@chakra-ui/icons";
import { Order, OrderItem as OrderItemType } from "@/app/config/entities"; // Alias OrderItem

interface OrderSummaryProps {
  currentOrder: Order;
  onRemoveItem: (foodId: string) => void; // Changed parameter type to foodId
  onUpdateQuantity: (foodId: string, quantity: number) => void; // Changed parameter type to foodId
}

export default function OrderSummary({
  currentOrder,
  onRemoveItem,
  onUpdateQuantity,
}: OrderSummaryProps) {
  return (
    <Box>
      <Flex align="center" mb={4}>
        <Heading
          as="h2"
          size="lg"
          color="var(--dark-gray-text)"
          fontFamily="var(--font-lexend-deca)"
        >
          Current Order
        </Heading>
        <Spacer />
        {currentOrder.table_id && (
          <Badge colorScheme="purple" fontSize="md" px={3} py={1} rounded="md">
            Table: {currentOrder.table_id}
          </Badge>
        )}
      </Flex>

      <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto" pr={2}>
        {currentOrder.items.length === 0 ? (
          <Text textAlign="center" py={10} color="var(--medium-gray-text)">
            No items in the current order.
          </Text>
        ) : (
          currentOrder.items.map((item) => (
            <Flex
              key={item.food_id}
              p={3}
              borderWidth="1px"
              borderColor="var(--border-color)"
              rounded="md"
              align="center"
              bg="var(--light-gray-bg)"
            >
              <Box flex="1">
                <Text
                  fontWeight="semibold"
                  color="var(--dark-gray-text)"
                  noOfLines={1}
                  fontFamily="var(--font-lexend-deca)"
                >
                  {item.name}
                </Text>
                <Text fontSize="sm" color="var(--medium-gray-text)">
                  R {item.price_at_sale?.toFixed(2)}
                </Text>{" "}
                {/* Added optional chaining */}
                {item.notes && (
                  <Text
                    fontSize="xs"
                    color="var(--medium-gray-text)"
                    fontStyle="italic"
                    mt={1}
                  >
                    Notes: {item.notes}
                  </Text>
                )}
              </Box>
              <HStack spacing={2} ml={4}>
                <IconButton
                  aria-label="Decrease quantity"
                  icon={<MinusIcon />}
                  size="sm"
                  onClick={() =>
                    onUpdateQuantity(item.food_id, item.quantity - 1)
                  }
                  isDisabled={item.quantity <= 1}
                  rounded="md"
                  colorScheme="red"
                  variant="ghost"
                />
                <Text fontWeight="bold" color="var(--dark-gray-text)">
                  {item.quantity}
                </Text>
                <IconButton
                  aria-label="Increase quantity"
                  icon={<AddIcon />}
                  size="sm"
                  onClick={() =>
                    onUpdateQuantity(item.food_id, item.quantity + 1)
                  }
                  rounded="md"
                  colorScheme="green"
                  variant="ghost"
                />
                <IconButton
                  aria-label="Remove item"
                  icon={<DeleteIcon />}
                  size="sm"
                  // Changed from item.menu_item_id to item.food_id
                  onClick={() => onRemoveItem(item.food_id)}
                  rounded="md"
                  colorScheme="red"
                  variant="ghost"
                />
              </HStack>
            </Flex>
          ))
        )}
      </VStack>

      <Divider my={6} borderColor="var(--border-color)" />

      <VStack spacing={2} align="stretch">
        <Flex justify="space-between">
          <Text color="var(--medium-gray-text)">Subtotal:</Text>
          <Text fontWeight="semibold" color="var(--dark-gray-text)">
            R {currentOrder.subtotal_amount?.toFixed(2)}
          </Text>{" "}
          {/* Added optional chaining */}
        </Flex>
        <Flex justify="space-between">
          <Text color="var(--medium-gray-text)">
            Tax (
            {currentOrder.tax_amount > 0
              ? (
                  (currentOrder.tax_amount /
                    (currentOrder.subtotal_amount || 1)) *
                  100
                ).toFixed(0)
              : 0}
            %):
          </Text>{" "}
          {/* Added nullish coalescing for subtotal_amount */}
          <Text fontWeight="semibold" color="var(--dark-gray-text)">
            R {currentOrder.tax_amount?.toFixed(2)}
          </Text>{" "}
          {/* Added optional chaining */}
        </Flex>
        {currentOrder.discount_amount > 0 && (
          <Flex justify="space-between">
            <Text color="var(--medium-gray-text)">Discount:</Text>
            <Text fontWeight="semibold" color="red.500">
              - R {currentOrder.discount_amount?.toFixed(2)}
            </Text>{" "}
            {/* Added optional chaining */}
          </Flex>
        )}
        <Flex justify="space-between" mt={4}>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="var(--dark-gray-text)"
            fontFamily="var(--font-lexend-deca)"
          >
            Total:
          </Text>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="var(--primary-green)"
            fontFamily="var(--font-lexend-deca)"
          >
            R {currentOrder.total_amount?.toFixed(2)}
          </Text>{" "}
          {/* Added optional chaining */}
        </Flex>
      </VStack>
    </Box>
  );
}
