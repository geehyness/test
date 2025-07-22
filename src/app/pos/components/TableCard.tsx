// src/app/pos/components/TableCard.tsx
"use client";

import React from "react";
import { Box, Text, VStack, Icon, useColorModeValue } from "@chakra-ui/react";
import { FaChair } from "react-icons/fa";
import { Table } from "@/app/config/entities";

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
  const selectedBg = useColorModeValue("blue.100", "blue.700");

  const availableBorder = useColorModeValue("green.200", "green.700");
  const occupiedBorder = useColorModeValue("red.200", "red.700");
  const reservedBorder = useColorModeValue("orange.200", "orange.700");
  const selectedBorder = useColorModeValue("blue.500", "blue.400");

  const availableText = useColorModeValue("green.800", "green.200");
  const occupiedText = useColorModeValue("red.800", "red.200");
  const reservedText = useColorModeValue("orange.800", "orange.200");
  const selectedText = useColorModeValue("blue.800", "blue.200");

  let bgColor = useColorModeValue("gray.50", "gray.700"); // Default
  let borderColor = useColorModeValue("gray.200", "gray.600"); // Default
  let textColor = useColorModeValue("gray.800", "gray.100"); // Default

  if (isSelected) {
    bgColor = selectedBg;
    borderColor = selectedBorder;
    textColor = selectedText;
  } else if (isOccupied) {
    // Use the new isOccupied prop
    bgColor = occupiedBg;
    borderColor = occupiedBorder;
    textColor = occupiedText;
  } else if (table.status === "available") {
    bgColor = availableBg;
    borderColor = availableBorder;
    textColor = availableText;
  } else if (table.status === "reserved") {
    bgColor = reservedBg;
    borderColor = reservedBorder;
    textColor = reservedText;
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      textAlign="center"
      cursor={isOccupied ? "not-allowed" : "pointer"} // Disable click if occupied
      onClick={isOccupied ? undefined : onClick} // Prevent click handler if occupied
      bg={bgColor}
      borderColor={borderColor}
      color={textColor}
      _hover={isOccupied ? {} : { shadow: "md", transform: "scale(1.02)" }}
      transition="all 0.2s ease-in-out"
      opacity={isOccupied ? 0.7 : 1} // Make occupied tables slightly transparent
    >
      <VStack spacing={2}>
        <Icon as={FaChair} w={8} h={8} />
        <Text fontSize="xl" fontWeight="bold">
          {table.name}
        </Text>
        <Text fontSize="sm" color={textColor}>
          Capacity: {table.capacity}
        </Text>
        <Text fontSize="sm" color={textColor} fontWeight="medium">
          Status: {table.status ? table.status.toUpperCase() : "UNKNOWN"}
        </Text>
      </VStack>
    </Box>
  );
}
