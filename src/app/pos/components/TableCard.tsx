// src/app/pos/components/TableCard.tsx
'use client';

import React from 'react';
import { Card, Box, Text, Icon, Badge } from '@chakra-ui/react';
import { FaChair } from 'react-icons/fa';
import { Table as TableType } from '@/app/config/entities'; // Alias Table

interface TableCardProps {
  table: TableType;
  onClick: () => void;
  isSelected: boolean;
}

export default function TableCard({ table, onClick, isSelected }: TableCardProps) {
  // Determine background and border color based on status and selection
  let bgColor = 'var(--background-color-light)';
  let borderColor = 'var(--border-color)';
  let textColor = 'var(--dark-gray-text)';

  if (isSelected) {
    bgColor = 'var(--primary-green)';
    borderColor = 'var(--primary-green)';
    textColor = 'white';
  } else {
    switch (table.status) {
      case 'available':
        borderColor = 'green.300';
        textColor = 'green.600';
        break;
      case 'occupied':
        borderColor = 'red.300';
        textColor = 'red.600';
        break;
      case 'reserved':
        borderColor = 'orange.300';
        textColor = 'orange.600';
        break;
      case 'cleaning':
        borderColor = 'blue.300';
        textColor = 'blue.600';
        break;
      default:
        break;
    }
  }

  return (
    <Card
      p={4}
      textAlign="center"
      rounded="lg"
      shadow="sm"
      borderWidth="2px"
      borderColor={borderColor}
      bg={bgColor}
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s ease-in-out"
      _hover={{
        transform: 'translateY(-3px)',
        shadow: 'md',
        borderColor: isSelected ? 'darken(var(--primary-green), 10%)' : 'var(--primary-green)',
      }}
    >
      <Icon as={FaChair} w={8} h={8} mb={2} color={isSelected ? 'white' : textColor} />
      <Text fontWeight="bold" fontSize="lg" color={isSelected ? 'white' : textColor} fontFamily="var(--font-lexend-deca)">
        {table.name}
      </Text>
      <Text fontSize="sm" color={isSelected ? 'white' : 'var(--medium-gray-text)'}>
        Capacity: {table.capacity}
      </Text>
      <Badge
        mt={2}
        colorScheme={
          isSelected ? 'whiteAlpha' :
          table.status === 'available' ? 'green' :
          table.status === 'occupied' ? 'red' :
          table.status === 'reserved' ? 'orange' :
          'gray'
        }
        px={2}
        py={1}
        rounded="md"
        fontSize="xs"
        textTransform="capitalize"
      >
        {table.status}
      </Badge>
    </Card>
  );
}