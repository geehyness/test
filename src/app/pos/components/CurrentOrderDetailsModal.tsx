// src/app/pos/components/CurrentOrderDetailsModal.tsx
'use client'; // Ensure this is a client component

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  HStack,
  Spacer,
  Box,
  Flex,
  Badge,
  IconButton,
  Input,
  useToast,
} from '@chakra-ui/react';
import dynamic from 'next/dynamic'; // Import dynamic from next/dynamic

// Dynamically import Chakra UI icons to ensure they are only loaded client-side
const DynamicAddIcon = dynamic(() => import('@chakra-ui/icons').then(mod => mod.AddIcon), { ssr: false });
const DynamicMinusIcon = dynamic(() => import('@chakra-ui/icons').then(mod => mod.MinusIcon), { ssr: false });
const DynamicDeleteIcon = dynamic(() => import('@chakra-ui/icons').then(mod => mod.DeleteIcon), { ssr: false });
const DynamicEditIcon = dynamic(() => import('@chakra-ui/icons').then(mod => mod.EditIcon), { ssr: false });

import { Order, OrderItem, Table } from '@/app/config/entities';
import OrderActionButtons from './OrderActionButtons'; // Re-using existing action buttons

interface CurrentOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrder: Order;
  onRemoveItem: (foodId: string) => void;
  onUpdateQuantity: (foodId: string, quantity: number) => void;
  onAddNotes: () => void;
  onApplyDiscount: () => void;
  onSelectTable: () => void;
  onSendToKitchen: () => void;
  onCheckout: (paymentMethod: 'cash' | 'card' | 'split') => void;
  onClearOrder: () => void;
  tables: Table[]; // Pass tables to display table name
}

const CurrentOrderDetailsModal: React.FC<CurrentOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  currentOrder,
  onRemoveItem,
  onUpdateQuantity,
  onAddNotes,
  onApplyDiscount,
  onSelectTable,
  onSendToKitchen,
  onCheckout,
  onClearOrder,
  tables,
}) => {
  const toast = useToast();

  // Find the selected table's name
  const selectedTableName = currentOrder.table_id
    ? tables.find((t) => t.id === currentOrder.table_id)?.name || 'N/A'
    : 'Takeaway';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent rounded="lg" bg="var(--background-color-light)" color="var(--dark-gray-text)">
        <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>
          Current Order Details
          {currentOrder.id && (
            <Badge ml={3} colorScheme="blue" fontSize="md">
              Order #{currentOrder.id}
            </Badge>
          )}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {currentOrder.items.length === 0 ? (
            <Text textAlign="center" py={10} color="var(--medium-gray-text)">
              No items in the current order. Add items from the menu.
            </Text>
          ) : (
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={2} color="var(--primary-orange)">Order Items</Text>
                {currentOrder.items.map((item: OrderItem) => (
                  <HStack key={item.food_id} py={2} borderBottom="1px solid var(--border-color-light)">
                    <Text flex="3" color="var(--dark-gray-text)">{item.name}</Text>
                    <Text flex="1" textAlign="right" color="var(--dark-gray-text)">R {item.price_at_sale?.toFixed(2)}</Text>
                    <HStack flex="2" justifyContent="center">
                      <IconButton
                        icon={<DynamicMinusIcon />} // Use dynamic import
                        size="xs"
                        onClick={() => onUpdateQuantity(item.food_id, item.quantity - 1)}
                        isDisabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                        bg="var(--button-bg-light)"
                        color="var(--dark-gray-text)"
                        _hover={{ bg: 'var(--button-hover-light)' }}
                      />
                      <Text fontWeight="bold" color="var(--dark-gray-text)">{item.quantity}</Text>
                      <IconButton
                        icon={<DynamicAddIcon />} // Use dynamic import
                        size="xs"
                        onClick={() => onUpdateQuantity(item.food_id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        bg="var(--button-bg-light)"
                        color="var(--dark-gray-text)"
                        _hover={{ bg: 'var(--button-hover-light)' }}
                      />
                    </HStack>
                    <Text flex="1" textAlign="right" fontWeight="semibold" color="var(--primary-green)">R {item.sub_total?.toFixed(2)}</Text>
                    <IconButton
                      icon={<DynamicDeleteIcon />} // Use dynamic import
                      size="sm"
                      colorScheme="red"
                      onClick={() => onRemoveItem(item.food_id)}
                      aria-label="Remove item"
                    />
                  </HStack>
                ))}
              </Box>

              <VStack align="stretch" spacing={1} mt={4} p={3} bg="var(--light-gray-bg)" rounded="md">
                <Flex justifyContent="space-between">
                  <Text color="var(--medium-gray-text)">Subtotal:</Text>
                  <Text fontWeight="semibold" color="var(--dark-gray-text)">R {currentOrder.subtotal_amount?.toFixed(2)}</Text>
                </Flex>
                <Flex justifyContent="space-between">
                  <Text color="var(--medium-gray-text)">Discount:</Text>
                  <Text fontWeight="semibold" color="var(--primary-red)">- R {currentOrder.discount_amount?.toFixed(2)}</Text>
                </Flex>
                <Flex justifyContent="space-between">
                  <Text color="var(--medium-gray-text)">Tax ({((currentOrder.tax_amount / (currentOrder.subtotal_amount - currentOrder.discount_amount)) * 100 || 0).toFixed(0)}%):</Text>
                  <Text fontWeight="semibold" color="var(--dark-gray-text)">R {currentOrder.tax_amount?.toFixed(2)}</Text>
                </Flex>
                <Flex justifyContent="space-between" pt={2} borderTop="1px solid var(--border-color)">
                  <Text fontSize="xl" fontWeight="bold" color="var(--primary-green)">Total:</Text>
                  <Text fontSize="xl" fontWeight="bold" color="var(--primary-green)">R {currentOrder.total_amount?.toFixed(2)}</Text>
                </Flex>
              </VStack>

              <Box mt={4}>
                <Text fontSize="lg" fontWeight="bold" mb={2} color="var(--primary-orange)">Order Details</Text>
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <Text color="var(--medium-gray-text)">Table:</Text>
                  <HStack>
                    <Text fontWeight="semibold" color="var(--dark-gray-text)">{selectedTableName}</Text>
                    <IconButton
                      icon={<DynamicEditIcon />} // Use dynamic import
                      size="sm"
                      variant="ghost"
                      onClick={onSelectTable}
                      aria-label="Select table"
                      color="var(--primary-green)"
                      _hover={{ bg: 'var(--button-hover-light)' }}
                    />
                  </HStack>
                </Flex>
                <Flex justifyContent="space-between" alignItems="center">
                  <Text color="var(--medium-gray-text)">Notes:</Text>
                  <HStack>
                    <Text fontWeight="semibold" color="var(--dark-gray-text)">{currentOrder.notes || 'None'}</Text>
                    <IconButton
                      icon={<DynamicEditIcon />} // Use dynamic import
                      size="sm"
                      variant="ghost"
                      onClick={onAddNotes}
                      aria-label="Add notes"
                      color="var(--primary-green)"
                      _hover={{ bg: 'var(--button-hover-light)' }}
                    />
                  </HStack>
                </Flex>
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
          <OrderActionButtons
            onAddNotes={onAddNotes}
            onApplyDiscount={onApplyDiscount}
            onSelectTable={onSelectTable}
            onSendToKitchen={onSendToKitchen}
            onCheckout={onCheckout}
            onClearOrder={onClearOrder}
            // Pass currentOrder to enable/disable buttons based on order state
            currentOrder={currentOrder}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CurrentOrderDetailsModal;
