// src/app/pos/components/MenuCategoryFilter.tsx
'use client';

import React from 'react';
import { HStack, Button, Text, Box } from '@chakra-ui/react';
import { Category } from '@/lib/config/entities'; // Import Category interface

interface MenuCategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function MenuCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: MenuCategoryFilterProps) {
  return (
    <Box overflowX="auto" pb={2} mb={4}>
      {/* FIX: Removed redundant `as` prop to fix `spacing` error */}
      <HStack spacing={3} minW="max-content">
        <Button
          onClick={() => onSelectCategory(null)}
          variant={selectedCategory === null ? 'solid' : 'outline'}
          colorScheme="green"
          size="sm"
          bg={selectedCategory === null ? 'var(--primary-green)' : 'transparent'}
          color={selectedCategory === null ? 'white' : 'var(--dark-gray-text)'}
          borderColor="var(--border-color)"
          _hover={{
            bg: selectedCategory === null ? 'darken(var(--primary-green), 10%)' : 'var(--light-gray-bg)',
          }}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            variant={selectedCategory === category.id ? 'solid' : 'outline'}
            colorScheme="green"
            size="sm"
            bg={selectedCategory === category.id ? 'var(--primary-green)' : 'transparent'}
            color={selectedCategory === category.id ? 'white' : 'var(--dark-gray-text)'}
            borderColor="var(--border-color)"
            _hover={{
              bg: selectedCategory === category.id ? 'darken(var(--primary-green), 10%)' : 'var(--light-gray-bg)',
            }}
          >
            {category.name}
          </Button>
        ))}
      </HStack>
    </Box>
  );
}