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
  const selectedBg = useColorModeValue("blue.1