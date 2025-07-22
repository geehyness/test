// src/app/pos/components/MenuItemList.tsx
"use client";

import React from "react";
import { SimpleGrid, Box, Text } from "@chakra-ui/react";
import MenuItemCard from "./MenuItemCard";
import { Food as MenuItemType, OrderItem } from "@/app/config/entities"; // Changed alias to Food

interface MenuItemListProps {
  menuItems: MenuItemType[]; // Now correctly typed as Food[]
  onAddItem: (item: MenuItemType) => void;
  onUpdateQuantity: (foodId: string, quantity: number) => void;
  currentOrderItems: OrderItem[];
}

export default function MenuItemList({
  menuItems,
  onAddItem,
  onUpdateQuantity,
  currentOrderItems,
}: MenuItemListProps) {
  if (menuItems.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="var(--medium-gray-text)">
          No menu items found.
        </Text>
        <Text fontSize="md" color="var(--medium-gray-text)" mt={2}>
          Try adjusting your search or category filters.
        </Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} mt={6}>
      {menuItems.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item} // 'item' is now correctly of type Food
          onAddItem={onAddItem}
          onUpdateQuantity={onUpdateQuantity}
          currentQuantity={
            currentOrderItems.find((orderItem) => orderItem.food_id === item.id)
              ?.quantity || 0
          }
        />
      ))}
    </SimpleGrid>
  );
}
