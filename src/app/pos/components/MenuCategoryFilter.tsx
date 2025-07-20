// src/app/pos/components/MenuCategoryFilter.tsx
'use client';

import React from 'react';
import { HStack, Button, Text, Box } from '@chakra-ui/react';
import { Category } from '@/app/config/entities'; // Import Category interface

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
      <HStack spacing={3} minW="max-content">
        <Button
          onClick={() => onSelectCategory(null)}
          variant={selectedCategory === null ? 'solid' : 'outline'}
          colorScheme={selectedCategory === null ? 'green' : 'gray'}
          bg={selectedCategory === null ? 'var(--primary-green)' : 'transparent'}
          color={selectedCategory === null ? 'white' : 'var(--dark-gray-text)'}
          borderColor="var(--border-color)"
          _hover={{
            bg: selectedCategory === null ? 'darken(var(--primary-green), 10%)' : 'var(--light-gray-bg)',
            color: selectedCategory === null ? 'white' : 'var(--dark-gray-text)',
          }}
          rounded="md"
          px={5}
          py={3}
          fontSize="md"
          fontWeight="medium"
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            variant={selectedCategory === category.id ? 'solid' : 'outline'}
            colorScheme={selectedCategory === category.id ? 'green' : 'gray'}
            bg={selectedCategory === category.id ? 'var(--primary-green)' : 'transparent'}
            color={selectedCategory === category.id ? 'white' : 'var(--dark-gray-text)'}
            borderColor="var(--border-color)"
            _hover={{
              bg: selectedCategory === category.id ? 'darken(var(--primary-green), 10%)' : 'var(--light-gray-bg)',
              color: selectedCategory === category.id ? 'white' : 'var(--dark-gray-text)',
            }}
            rounded="md"
            px={5}
            py={3}
            fontSize="md"
            fontWeight="medium"
          >
            {category.name}
          </Button>
        ))}
      </HStack>
    </Box>
  );
}