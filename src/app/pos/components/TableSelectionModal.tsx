// src/app/pos/components/TableSelectionModal.tsx
"use client";

import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  SimpleGrid,
  Text,
  useToast,
  Box, // Added for the Takeaway card
  Icon, // Added for the Takeaway icon
  Badge, // Added for the Takeaway badge
} from "@chakra-ui/react";
import { FaWalking } from "react-icons/fa"; // Import FaWalking for takeaway icon
import TableCard from "./TableCard";
import { Table as TableType } from "@/app/config/entities"; // Alias Table

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableType[];
  onSelectTable: (tableId: string | null) => void;
  currentSelectedTableId: string | null;
  allowTakeaway?: boolean; // Re-added prop to control Takeaway option visibility
}

export default function TableSelectionModal({
  isOpen,
  onClose,
  tables,
  onSelectTable,
  currentSelectedTableId,
  allowTakeaway = false, // Default to false if not provided
}: TableSelectionModalProps) {
  const toast = useToast();

  const handleTableClick = (table: TableType) => {
    // Prevent selecting an occupied table unless it's the one already selected
    if (table.status === "occupied" && table.id !== currentSelectedTableId) {
      toast({
        title: "Table Occupied",
        description: `${table.name} is currently occupied. Please select an available table or Takeaway.`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onSelectTable(table.id);
    toast({
      title: "Table Selected",
      description: `${table.name} has been assigned to the order.`,
      status: "info",
      duration: 1500,
      isClosable: true,
      position: "top-right",
    });
    // Do NOT close the modal here, let "Confirm Selection" button handle it
  };

  const handleTakeawayClick = () => {
    onSelectTable(null); // Null signifies takeaway
    toast({
      title: "Takeaway Selected",
      description: "Order will be for takeaway.",
      status: "info",
      duration: 1500,
      isClosable: true,
      position: "top-right",
    });
    // Do NOT close the modal here, let "Confirm Selection" button handle it
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay />
      <ModalContent
        rounded="lg"
        bg="var(--background-color-light)"
        color="var(--dark-gray-text)"
      >
        <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>
          Select Table or Takeaway
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
            {tables.length === 0 && !allowTakeaway ? (
              <Text
                textAlign="center"
                py={10}
                color="var(--medium-gray-text)"
                gridColumn="span / span 4"
              >
                No tables available.
              </Text>
            ) : (
              <>
                {/* Filter out any null or undefined tables before mapping */}
                {tables.filter(Boolean).map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    onClick={() => handleTableClick(table)}
                    isSelected={currentSelectedTableId === table.id}
                    isOccupied={
                      table.status === "occupied" &&
                      table.id !== currentSelectedTableId
                    }
                  />
                ))}
                {allowTakeaway && (
                  <Box
                    p={4}
                    borderWidth="2px"
                    borderColor={
                      currentSelectedTableId === null
                        ? "var(--primary-green)"
                        : "var(--border-color)"
                    }
                    rounded="xl"
                    shadow="md"
                    bg={
                      currentSelectedTableId === null
                        ? "var(--primary-green-light)"
                        : "white"
                    }
                    textAlign="center"
                    cursor="pointer"
                    _hover={{ transform: "scale(1.02)", shadow: "lg" }}
                    transition="all 0.2s ease-in-out"
                    position="relative"
                    height="180px"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    onClick={handleTakeawayClick}
                  >
                    <Box
                      width="120px"
                      height="120px"
                      bg={
                        currentSelectedTableId === null
                          ? "var(--primary-green)"
                          : "#aaaaaa"
                      }
                      rounded="full"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      color="white"
                      fontWeight="bold"
                      fontSize="lg"
                      zIndex="1"
                      p={2}
                    >
                      <Icon as={FaWalking} w={10} h={10} mb={1} />
                      <Text fontSize="md" lineHeight="1.2">
                        Takeaway
                      </Text>
                      <Badge
                        colorScheme={
                          currentSelectedTableId === null ? "blue" : "gray"
                        }
                        variant="solid"
                        px={2}
                        py={0.5}
                        rounded="full"
                        fontSize="xx-small"
                      >
                        {currentSelectedTableId === null
                          ? "SELECTED"
                          : "OPTION"}
                      </Badge>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </SimpleGrid>
        </ModalBody>
        <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            bg="var(--primary-green)"
            color="white"
            _hover={{ bg: "darken(var(--primary-green), 10%)" }}
            onClick={() => {
              onClose();
            }}
            ml={3}
            isDisabled={currentSelectedTableId === undefined}
          >
            Confirm Selection
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
