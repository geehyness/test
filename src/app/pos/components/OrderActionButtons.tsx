// src/app/pos/components/OrderActionButtons.tsx
"use client";

import React from "react";
import {
  VStack,
  Button,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  HStack,
  Icon,
  Box,
  Badge, // Added Badge for selected payment method
} from "@chakra-ui/react";
import {
  FaStickyNote,
  FaTag,
  FaChair,
  FaPaperPlane,
  FaCashRegister,
  FaTrash,
  FaMoneyBillWave,
  FaCreditCard,
  FaCheckCircle,
} from "react-icons/fa";
import { Order } from "@/app/config/entities"; // Import Order type if needed

interface OrderActionButtonsProps {
  onAddNotes: () => void;
  onApplyDiscount: () => void;
  onSelectTable: () => void;
  onSendToKitchen: () => void;
  // Changed onCheckout to accept paymentMethod. This matches CurrentOrderDetailsModal.tsx
  onCheckout: (paymentMethod: "cash" | "card" | "split") => void;
  onClearOrder: () => void;
  currentOrder: Order; // Added to enable/disable buttons based on order state
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => Promise<void>; // Added for potential future use
}

export default function OrderActionButtons({
  onAddNotes,
  onApplyDiscount,
  onSelectTable,
  onSendToKitchen,
  onCheckout,
  onClearOrder,
  currentOrder, // Destructure currentOrder
}: OrderActionButtonsProps) {
  const {
    isOpen: isPaymentModalOpen,
    onOpen: onPaymentModalOpen,
    onClose: onPaymentModalClose,
  } = useDisclosure();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<
    "cash" | "card" | "split"
  >("cash");

  // Determine if the "Send to Kitchen" or "Checkout" buttons should be disabled
  const isOrderEmpty = currentOrder.items.length === 0;
  const isOrderSent =
    currentOrder.status !== "new" && currentOrder.status !== "pending"; // Already sent or paid

  return (
    <VStack spacing={3} mt={6} width="full">
      <Flex width="full" gap={3}>
        <Button
          leftIcon={<FaStickyNote />}
          onClick={onAddNotes}
          colorScheme="gray"
          variant="outline"
          width="full"
          rounded="md"
          borderColor="var(--border-color)"
          color="var(--dark-gray-text)"
          _hover={{ bg: "var(--light-gray-bg)" }}
          isDisabled={isOrderEmpty || isOrderSent} // Disable if order is empty or already sent/paid
        >
          Add Notes
        </Button>
        <Button
          leftIcon={<FaTag />}
          onClick={onApplyDiscount}
          colorScheme="gray"
          variant="outline"
          width="full"
          rounded="md"
          borderColor="var(--border-color)"
          color="var(--dark-gray-text)"
          _hover={{ bg: "var(--light-gray-bg)" }}
          isDisabled={isOrderEmpty || isOrderSent} // Disable if order is empty or already sent/paid
        >
          Discount
        </Button>
      </Flex>
      <Button
        leftIcon={<FaChair />}
        onClick={onSelectTable}
        colorScheme="blue"
        width="full"
        rounded="md"
        bg="blue.500"
        color="white"
        _hover={{ bg: "blue.600" }}
        isDisabled={isOrderSent} // Disable if order is already sent/paid
      >
        Select Table
      </Button>
      <Button
        leftIcon={<FaPaperPlane />}
        onClick={onSendToKitchen}
        colorScheme="orange"
        width="full"
        rounded="md"
        bg="orange.400"
        color="white"
        _hover={{ bg: "orange.500" }}
        isDisabled={
          isOrderEmpty ||
          isOrderSent ||
          (!currentOrder.table_id && currentOrder.order_type !== "takeaway")
        } // Disable if empty, sent, or no table/takeaway
      >
        Send to Kitchen
      </Button>

      {/* Checkout Button - now opens a modal */}
      <Button
        leftIcon={<FaCashRegister />}
        onClick={onPaymentModalOpen} // Open payment modal
        colorScheme="green"
        width="full"
        size="lg"
        rounded="md"
        bg="var(--primary-green)"
        color="white"
        _hover={{ bg: "darken(var(--primary-green), 10%)" }}
        isDisabled={isOrderEmpty || isOrderSent} // Disable if order is empty or already sent/paid
      >
        Checkout
      </Button>

      <Button
        leftIcon={<FaTrash />}
        onClick={onClearOrder}
        colorScheme="red"
        variant="outline"
        width="full"
        rounded="md"
        borderColor="red.300"
        color="red.500"
        _hover={{ bg: "red.50" }}
        isDisabled={isOrderEmpty} // Disable if order is already empty
      >
        Clear Order
      </Button>

      {/* Payment Method Selection Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={onPaymentModalClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          rounded="lg"
          bg="var(--background-color-light)"
          color="var(--dark-gray-text)"
        >
          <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>
            Select Payment Method
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text
                fontSize="lg"
                fontWeight="semibold"
                color="var(--dark-gray-text)"
              >
                Total Amount: R {currentOrder.total_amount?.toFixed(2)}
              </Text>
              <HStack spacing={4} justify="center" flexWrap="wrap" width="full">
                <Button
                  variant="outline"
                  borderWidth="2px"
                  borderColor={
                    selectedPaymentMethod === "cash"
                      ? "var(--primary-green)"
                      : "gray.200"
                  }
                  rounded="lg"
                  p={3}
                  onClick={() => setSelectedPaymentMethod("cash")}
                  bg={
                    selectedPaymentMethod === "cash"
                      ? "green.50"
                      : "transparent"
                  }
                  _hover={{ bg: "green.50" }}
                  flexDir="column"
                  height="auto"
                  width="100px"
                  position="relative"
                >
                  <Icon
                    as={FaMoneyBillWave}
                    w={6}
                    h={6}
                    color="gray.500"
                    mb={1}
                  />
                  <Text fontSize="sm" color="var(--medium-gray-text)">
                    Cash
                  </Text>
                  {selectedPaymentMethod === "cash" && (
                    <Box
                      position="absolute"
                      top={1}
                      right={1}
                      color="var(--primary-green)"
                    >
                      <Icon as={FaCheckCircle} />
                    </Box>
                  )}
                </Button>

                <Button
                  variant="outline"
                  borderWidth="2px"
                  borderColor={
                    selectedPaymentMethod === "card"
                      ? "var(--primary-green)"
                      : "gray.200"
                  }
                  rounded="lg"
                  p={3}
                  onClick={() => setSelectedPaymentMethod("card")}
                  bg={
                    selectedPaymentMethod === "card"
                      ? "green.50"
                      : "transparent"
                  }
                  _hover={{ bg: "green.50" }}
                  flexDir="column"
                  height="auto"
                  width="100px"
                  position="relative"
                >
                  <Icon as={FaCreditCard} w={6} h={6} color="gray.500" mb={1} />
                  <Text fontSize="sm" color="var(--medium-gray-text)">
                    Card
                  </Text>
                  {selectedPaymentMethod === "card" && (
                    <Box
                      position="absolute"
                      top={1}
                      right={1}
                      color="var(--primary-green)"
                    >
                      <Icon as={FaCheckCircle} />
                    </Box>
                  )}
                </Button>
                {/* Add Split Payment option if desired */}
                {/* <Button
                  variant="outline"
                  borderWidth="2px"
                  borderColor={selectedPaymentMethod === 'split' ? 'var(--primary-green)' : 'gray.200'}
                  rounded="lg"
                  p={3}
                  onClick={() => setSelectedPaymentMethod('split')}
                  bg={selectedPaymentMethod === 'split' ? 'green.50' : 'transparent'}
                  _hover={{ bg: 'green.50' }}
                  flexDir="column"
                  height="auto"
                  width="100px"
                  position="relative"
                >
                  <Icon as={FaMoneyBillWave} w={6} h={6} color="gray.500" mb={1} />
                  <Text fontSize="sm" color="var(--medium-gray-text)">
                    Split
                  </Text>
                  {selectedPaymentMethod === 'split' && (
                    <Box position="absolute" top={1} right={1} color="var(--primary-green)">
                      <Icon as={FaCheckCircle} />
                    </Box>
                  )}
                </Button> */}
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
            <Button variant="ghost" onClick={onPaymentModalClose} mr={3}>
              Cancel
            </Button>
            <Button
              bg="var(--primary-green)"
              color="white"
              _hover={{ bg: "darken(var(--primary-green), 10%)" }}
              onClick={() => {
                onCheckout(selectedPaymentMethod); // Call onCheckout with the selected method
                onPaymentModalClose(); // Close the modal
              }}
              isDisabled={currentOrder.total_amount <= 0} // Disable if total is zero
            >
              Confirm Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
