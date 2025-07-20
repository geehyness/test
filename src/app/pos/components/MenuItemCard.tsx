// src/app/pos/components/MenuItemCard.tsx
'use client';

import React from 'react';
import {
  Card,
  CardBody,
  Image as ChakraImage,
  Stack,
  Heading,
  Text,
  Divider,
  CardFooter,
  Button,
  Flex,
  useToast
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { MenuItem as MenuItemType } from '@/app/config/entities'; // Alias to avoid conflict

interface MenuItemCardProps {
  item: MenuItemType;
  onAddItem: (item: MenuItemType) => void;
}

export default function MenuItemCard({ item, onAddItem }: MenuItemCardProps) {
  const toast = useToast();

  const handleAddItemClick = () => {
    onAddItem(item);
    toast({
      title: 'Item Added',
      description: `${item.name} added to order.`,
      status: 'success',
      duration: 1500,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Ensure item.description is a string before using string methods
  const itemDescription = item.description || '';

  return (
    <Card
      maxW="sm"
      rounded="lg"
      shadow="md"
      bg="var(--background-color-light)"
      overflow="hidden"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
    >
      <ChakraImage
        src={item.image_url || 'https://placehold.co/400x200/E0E0E0/000000?text=No+Image'}
        alt={item.name}
        objectFit="cover"
        height="150px"
        width="100%"
      />

      <CardBody p={4}>
        <Stack spacing={2}>
          <Heading size="md" color="var(--dark-gray-text)" fontFamily="var(--font-lexend-deca)">
            {item.name}
          </Heading>
          <Text fontSize="sm" color="var(--medium-gray-text)">
            {itemDescription.substring(0, 70)}{itemDescription.length > 70 ? '...' : ''}
          </Text>
          <Text color="var(--primary-green)" fontSize="xl" fontWeight="bold">
            R {(item.price || 0).toFixed(2)} {/* Added || 0 to handle undefined price */}
          </Text>
        </Stack>
      </CardBody>

      <Divider borderColor="var(--border-color)" />

      <CardFooter p={4}>
        <Flex justify="center" width="100%">
          <Button
            variant="solid"
            bg="var(--primary-green)"
            color="white"
            _hover={{ bg: 'darken(var(--primary-green), 10%)' }}
            leftIcon={<AddIcon />}
            onClick={handleAddItemClick}
            isDisabled={!item.is_available}
            width="full"
            rounded="md"
            py={2}
          >
            {item.is_available ? 'Add to Order' : 'Unavailable'}
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );
}
