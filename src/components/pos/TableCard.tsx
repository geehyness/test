// src/app/pos/components/TableCard.tsx
"use client";

import React from "react";
import { Box, Text, VStack, Icon, 
  // FIX: Import useColorModeValue
  useColorModeValue } from "@chakra-ui/react";
import { FaChair } from "react-icons/fa";
import { Table } from "@/lib/config/entities";

interface TableCardProps {
  table: Table;
  onClick: () => void;
  isSelected: boolean;
  isOccupied: boolean; // Added this prop
}

export default function TableCard({
  table,
  onClick,
  isSelected,
  isOccupied,
}: TableCardProps) {
  // Determine colors based on status and selection
  const availableBg = useColorModeValue("green.50", "green.800");
  const occupiedBg = useColorModeValue("red.50", "red.800");
  const reservedBg = useColorModeValue("orange.50", "orange.800");
  const selectedBg = useColorModeValue("blue.100", "blue.600");

  const availableBorder = useColorModeValue("green.200", "green.600");
  const occupiedBorder = useColorModeValue("red.200", "red.600");
  const reservedBorder = useColorModeValue("orange.200", "orange.600");
  const selectedBorder = useColorModeValue("blue.400", "blue.300");

  let bg = availableBg;
  let borderColor = availableBorder;
  let textColor = useColorModeValue("green.800", "green.100");

  if (isOccupied) {
    bg = occupiedBg;
    borderColor = occupiedBorder;
    textColor = useColorModeValue("red.800", "red.100");
  } else if (table.status === "reserved") {
    bg = reservedBg;
    borderColor = reservedBorder;
    textColor = useColorModeValue("orange.800", "orange.100");
  }

  if (isSelected) {
    bg = selectedBg;
    borderColor = selectedBorder;
    textColor = useColorModeValue("blue.800", "blue.100");
  }

  return (
    <Box
      p={4}
      borderWidth="2px"
      borderColor={borderColor}
      borderRadius="xl" // Changed to xl for more rounded corners
      bg={bg}
      cursor={isOccupied ? "not-allowed" : "pointer"}
      onClick={!isOccupied ? onClick : undefined}
      transition="all 0.2s ease-in-out"
      _hover={!isOccupied ? { transform: "scale(1.05)", shadow: "lg" } : {}}
      textAlign="center"
      opacity={isOccupied ? 0.6 : 1}
      position="relative"
    >
      <VStack spacing={1}>
        <Icon as={FaChair} w={8} h={8} color={textColor} />
        <Text fontWeight="bold" fontSize="lg" color={textColor}>
          {table.name}
        </Text>
        <Text fontSize="sm" color={textColor}>
          Capacity: {table.capacity}
        </Text>
        <Text fontSize="xs" color={textColor}>
          {isOccupied
            ? `Occupied (Order #${table.current_order_id})`
            : table.status.toUpperCase()}
        </Text>
      </VStack>
    </Box>
  );
}