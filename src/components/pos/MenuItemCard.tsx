// src/app/pos/components/MenuItemCard.tsx
// src/app/pos/components/MenuItemCard.tsx
"use client";

import React from "react";
import {
  Card,
  CardBody,
  Image,
  Stack,
  Heading,
  Text,
  Divider,
  CardFooter,
  ButtonGroup,
  Button,
  Flex,
  Spacer,
  IconButton,
  Box,
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
          item.image_url || // Changed from item.image to item.image_url
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
        <Stack mt="6" spacing="3">
          <Heading size="md" color="var(--dark-gray-text)">
            {item.name}
          </Heading>
          <Text color="var(--medium-gray-text)">{item.description}</Text>
          <Text color="var(--primary-green)" fontSize="2xl" fontWeight="bold">
            R {item.price ? item.price.toFixed(2) : "0.00"}{" "}
            {/* Changed from item.sale_price to item.price */}
          </Text>
        </Stack>
      </CardBody>
      <Divider borderColor="var(--border-color)" />
      <CardFooter>
        <Flex width="full" align="center">
          {currentQuantity > 0 ? (
            <ButtonGroup size="sm" isAttached variant="outline" rounded="md">
              <IconButton
                aria-label="Decrease quantity"
                icon={<MinusIcon />}
                onClick={handleDecreaseQuantity}
                rounded="l-md"
                borderColor="var(--border-color)"
                color="var(--dark-gray-text)"
                _hover={{ bg: "var(--light-gray-bg)" }}
              />
              <Button
                rounded="none"
                borderColor="var(--border-color)"
                color="var(--dark-gray-text)"
                _hover={{ bg: "transparent" }}
                cursor="default"
              >
                {currentQuantity}
              </Button>
              <IconButton
                aria-label="Increase quantity"
                icon={<AddIcon />}
                onClick={handleIncreaseQuantity}
                rounded="r-md"
                borderColor="var(--border-color)"
                color="var(--dark-gray-text)"
                _hover={{ bg: "var(--light-gray-bg)" }}
              />
            </ButtonGroup>
          ) : (
            <Button
              variant="solid"
              colorScheme="green"
              onClick={() => onAddItem(item)}
              width="full"
              rounded="md"
              bg="var(--primary-green)"
              color="white"
              _hover={{ bg: "darken(var(--primary-green), 10%)" }}
            >
              Add to Order
            </Button>
          )}
        </Flex>
      </CardFooter>
    </Card>
  );
}