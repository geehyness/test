// src/app/pos/components/MenuItemList.tsx
'use client';

import React from 'react';
import { SimpleGrid, Box, Text } from '@chakra-ui/react';
import MenuItemCard from './MenuItemCard';
import { MenuItem as MenuItemType } from '@/app/config/entities'; // Alias to avoid conflict

interface MenuItemListProps {
  menuItems: MenuItemType[];
  onAddItem: (item: MenuItemType) => void;
}

export default function MenuItemList({ menuItems, onAddItem }: MenuItemListProps) {
  if (menuItems.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="var(--medium-gray-text)">No menu items found.</Text>
        <Text fontSize="md" color="var(--medium-gray-text)" mt={2}>Try adjusting your search or category filters.</Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} mt={6}>
      {menuItems.map((item) => (
        <MenuItemCard key={item.id} item={item} onAddItem={onAddItem} />
      ))}
    </SimpleGrid>
  );
}