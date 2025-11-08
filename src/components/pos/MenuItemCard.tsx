// src/app/pos/components/MenuItemCard.tsx
// src/app/pos/components/MenuItemCard.tsx
"use client";

import React from "react";
import {
  Card,
  Image,
  Stack,
  Heading,
  Text,
  ButtonGroup,
  Button,
  Flex,
  Spacer,
  IconButton,
  Box,
  // FIX: Import Divider
  Divider,
  CardBody,
  CardFooter,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { Food as MenuItemType } from "@/lib/config/entities"; // Changed alias to Food

interface MenuItemCardProps {
  item: MenuItemType; // Now correctly typed as Food
  onAddItem: (item: MenuItemType) => void;
  onUpdateQuantity: (foodId: string, quantity: number) => void;
  currentQuantity: number;
}

export default function MenuItemCard({
  item,
  onAddItem,
  onUpdateQuantity,
  currentQuantity,
}: MenuItemCardProps) {
  const handleIncreaseQuantity = () => {
    onUpdateQuantity(item.id, currentQuantity + 1);
  };

  const handleDecreaseQuantity = () => {
    if (currentQuantity > 0) {
      onUpdateQuantity(item.id, currentQuantity - 1);
    }
  };

  return (
    <Card
      maxW="sm"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      bg="var(--background-color-light)"
    >
      <Image
        src={
          (item.image_urls && item.image_urls[0]) || // Changed from item.image to item.image_url
          "https://placehold.co/400x200/E0E0E0/000000?text=No+Image"
        }
        alt={item.name}
        borderRadius="lg"
        objectFit="cover"
        height="150px"
        width="100%"
        fallbackSrc="https://placehold.co/400x200/E0E0E0/000000?text=No+Image"
      />

      <CardBody>
        {/* FIX: Corrected `spacing` prop */}
        <Stack mt="6" spacing="3">
          <Heading size="md" color="var(--dark-gray-text)">
            {item.name}
          </Heading>
          <Text color="var(--medium-gray-text)">{item.description}</Text>
          <Text color="var(--primary-green)" fontSize="2xl" fontWeight="bold">
            R {item.price.toFixed(2)}
          </Text>
        </Stack>
      </CardBody>

      <Divider />

      <CardFooter>
        {currentQuantity === 0 ? (
          <Button
            variant="solid"
            colorScheme="green"
            onClick={() => onAddItem(item)}
            width="full"
            bg="var(--primary-green)"
            color="white"
            _hover={{ bg: "darken(var(--primary-green), 10%)" }}
          >
            Add to Order
          </Button>
        ) : (
          <Flex width="full" justifyContent="space-between" alignItems="center">
            <IconButton
              aria-label="Decrease quantity"
              icon={<MinusIcon />}
              onClick={handleDecreaseQuantity}
              isRound
              size="md"
              colorScheme="red"
              variant="outline"
            />
            <Text fontSize="lg" fontWeight="bold">
              {currentQuantity}
            </Text>
            <IconButton
              aria-label="Increase quantity"
              icon={<AddIcon />}
              onClick={handleIncreaseQuantity}
              isRound
              size="md"
              colorScheme="green"
              variant="outline"
            />
          </Flex>
        )}
      </CardFooter>
    </Card>
  );
}