// src/app/pos/components/TableSelectionModal.tsx
'use client';

import React from 'react';
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
  useToast
} from '@chakra-ui/react';
import TableCard from './TableCard';
import { Table as TableType } from '@/app/config/entities'; // Alias Table

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableType[];
  onSelectTable: (tableId: string | null) => void;
  currentSelectedTableId: string | null;
}

export default function TableSelectionModal({
  isOpen,
  onClose,
  tables,
  onSelectTable,
  currentSelectedTableId,
}: TableSelectionModalProps) {
  const toast = useToast();

  const handleTableClick = (table: TableType) => {
    if (table.status === 'occupied' && table.id !== currentSelectedTableId) {
      toast({
        title: 'Table Occupied',
        description: `${table.name} is currently occupied. Please select an available table.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onSelectTable(table.id);
    toast({
      title: 'Table Selected',
      description: `${table.name} has been assigned to the order.`,
      status: 'info',
      duration: 1500,
      isClosable: true,
      position: 'top-right',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay />
      <ModalContent rounded="lg" bg="var(--background-color-light)" color="var(--dark-gray-text)">
        <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>Select Table</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {tables.length === 0 ? (
            <Text textAlign="center" py={10} color="var(--medium-gray-text)">No tables available.</Text>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
              {tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onClick={() => handleTableClick(table)}
                  isSelected={currentSelectedTableId === table.id}
                />
              ))}
            </SimpleGrid>
          )}
        </ModalBody>
        <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {currentSelectedTableId && (
            <Button
              bg="var(--primary-green)"
              color="white"
              _hover={{ bg: 'darken(var(--primary-green), 10%)' }}
              onClick={() => {
                onSelectTable(currentSelectedTableId);
                onClose();
              }}
              ml={3}
            >
              Confirm Selection
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}