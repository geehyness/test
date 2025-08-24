// src/app/pos/components/NewOrderMenuModal.tsx
"use client";

import React, { useState, useMemo } from "react";
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
  InputGroup,
  InputLeftElement,
  Input,
  useToast,
  SimpleGrid,
  Box,
  Image,
  Badge,
  IconButton,
  Flex,
  Spacer,
  Divider,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";

// Dynamically import Chakra UI icons
const DynamicSearchIcon = dynamic(
  () => import("@chakra-ui/icons").then((mod) => mod.SearchIcon),
  { ssr: false }
);
const DynamicAddIcon = dynamic(
  () => import("@chakra-ui/icons").then((mod) => mod.AddIcon),
  { ssr: false }
);
const DynamicMinusIcon = dynamic(
  () => import("@chakra-ui/icons").then((mod) => mod.MinusIcon),
  { ssr: false }
);
const DynamicDeleteIcon = dynamic(
  () => import("@chakra-ui/icons").then((mod) => mod.DeleteIcon),
  { ssr: false }
);

import { Food, Category, OrderItem } from "@/app/config/entities";
import MenuCategoryFilter from "./MenuCategoryFilter"; // Reusing existing filter

interface NewOrderMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: Food[];
  categories: Category[];
  onFinishAddingItems: (items: OrderItem[]) => void;
}

const NewOrderMenuModal: React.FC<NewOrderMenuModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  categories,
  onFinishAddingItems,
}) => {
  const toast = useToast();
  const [tempOrderItems, setTempOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Memoized filtering of menu items based on search term and selected category
  const filteredMenuItems = useMemo(() => {
    let items = menuItems;
    if (selectedCategory) {
      items = items.filter((item) => item.category_id === selectedCategory);
    }
    if (searchTerm) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return items;
  }, [menuItems, selectedCategory, searchTerm]);

  // Add item to temporary order
  const handleAddItem = (food: Food) => {
    setTempOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.food_id === food.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.food_id === food.id
            ? {
              ...item,
              quantity: item.quantity + 1,
              sub_total: (item.quantity + 1) * (food.price || 0), // Use food.price
            }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            id: `temp-oi-${Date.now()}-${Math.random()
              .toString(36)
              .substring(7)}`, // Temporary ID
            order_id: "", // Will be set when order is created
            food_id: food.id,
            quantity: 1,
            price: food.price || 0, // Changed from food.sale_price to food.price
            sub_total: food.price || 0, // Changed from food.sale_price to food.price
            name: food.name, // Add name for display
            price_at_sale: food.price || 0, // Changed from food.sale_price to food.price
            notes: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }
    });
    toast({
      title: `${food.name} added.`,
      status: "success",
      duration: 1000,
      isClosable: true,
      position: "bottom-right",
    });
  };

  // Update quantity of item in temporary order
  const handleUpdateQuantity = (foodId: string, quantity: number) => {
    setTempOrderItems((prevItems) => {
      const updated = prevItems.map((item) => {
        if (item.food_id === foodId) {
          const food = menuItems.find((f) => f.id === foodId);
          const itemPrice = food?.price || item.price; // Changed from food?.sale_price to food?.price
          return { ...item, quantity, sub_total: quantity * (itemPrice || 0) };
        }
        return item;
      });
      return updated.filter((item) => item.quantity > 0); // Remove if quantity drops to 0
    });
  };

  // Remove item from temporary order
  const handleRemoveItem = (foodId: string) => {
    setTempOrderItems((prevItems) =>
      prevItems.filter((item) => item.food_id !== foodId)
    );
    toast({
      title: "Item removed.",
      status: "info",
      duration: 1000,
      isClosable: true,
      position: "bottom-right",
    });
  };

  // Handle finishing the item selection
  const handleFinish = () => {
    onFinishAddingItems(tempOrderItems);
    setTempOrderItems([]); // Clear temporary items after finishing
    setSearchTerm("");
    setSelectedCategory(null);
  };

  // Calculate total for the temporary order
  const tempOrderTotal = tempOrderItems.reduce(
    (sum, item) => sum + (item.sub_total || 0),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
      <ModalContent
        rounded="xl"
        bg="var(--background-color-light)"
        color="var(--dark-gray-text)"
        m={4}
        maxH="95vh"
        boxShadow="0 10px 30px rgba(0, 0, 0, 0.2)"
        border="1px solid"
        borderColor="gray.200"
      >
        <ModalHeader
          borderBottom="1px solid var(--border-color)"
          pb={3}
          fontSize="xl"
          fontWeight="bold"
          bg="white"
          roundedTop="xl"
          py={4}
        >
          Add Items to New Order
        </ModalHeader>
        <ModalCloseButton
          top={4}
          right={4}
          size="md"
          borderRadius="full"
          bg="gray.100"
          _hover={{ bg: "gray.200" }}
        />
        <ModalBody p={6} bg="gray.50" roundedBottom="xl" display="flex" flexDirection="column">
          <Flex direction={{ base: "column", md: "row" }} gap={6} flex="1" minH="0">
            {/* Left side: Menu Selection */}
            <Box
              flex="2"
              bg="white"
              p={4}
              rounded="lg"
              shadow="sm"
              overflowY="auto"
              h="100%"
              minH="0"
            >
              <InputGroup mb={4}>
                <InputLeftElement pointerEvents="none">
                  <DynamicSearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  rounded="md"
                  borderColor="var(--border-color)"
                  focusBorderColor="var(--primary-green)"
                  color="var(--dark-gray-text)"
                />
              </InputGroup>

              <MenuCategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              <SimpleGrid
                minChildWidth="150px"
                spacing={4}
                mt={4}
              >
                {filteredMenuItems.map((item) => (
                  <Box
                    key={item.id}
                    p={3}
                    borderWidth="1px"
                    rounded="md"
                    shadow="sm"
                    bg="white"
                    cursor="pointer"
                    _hover={{ shadow: "md", transform: "scale(1.02)" }}
                    transition="all 0.2s ease-in-out"
                    onClick={() => handleAddItem(item)}
                  >
                    <Image
                      src={
                        item.image_url ||
                        `https://placehold.co/150x100/E0E0E0/333333?text=${item.name.split(" ")[0]
                        }`
                      }
                      alt={item.name}
                      rounded="md"
                      mb={2}
                      objectFit="cover"
                      height="100px"
                      width="full"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/150x100/E0E0E0/333333?text=${item.name.split(" ")[0]
                          }`;
                      }}
                    />
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      noOfLines={1}
                      color="var(--dark-gray-text)"
                    >
                      {item.name}
                    </Text>
                    <Text
                      fontSize="xs"
                      color="var(--medium-gray-text)"
                      noOfLines={2}
                    >
                      {item.description}
                    </Text>
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                      mt={2}
                    >
                      <Text fontWeight="bold" color="var(--primary-green)">
                        R {item.price?.toFixed(2)}
                      </Text>
                      <Badge colorScheme="purple" fontSize="xx-small">
                        {categories.find((cat) => cat.id === item.category_id)
                          ?.name || "Category"}
                      </Badge>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            {/* Right side: Temporary Order Summary */}
            <Box
              flex="1"
              bg="white"
              p={5}
              rounded="lg"
              shadow="md"
              display="flex"
              flexDirection="column"
              overflowY="auto"
              h="100%"
              minH="0"
            >
              <Text
                fontSize="lg"
                fontWeight="bold"
                mb={4}
                color="var(--primary-orange)"
                borderBottom="2px solid"
                borderColor="orange.200"
                pb={2}
              >
                New Order Summary (
                {tempOrderItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                items)
              </Text>

              <Divider mb={4} />

              {tempOrderItems.length === 0 ? (
                <Box textAlign="center" py={10} color="var(--medium-gray-text)" bg="gray.50" rounded="md">
                  <Text>No items added yet.</Text>
                  <Text fontSize="sm" mt={2}>Add items from the menu on the left.</Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch" flex="1" overflowY="auto">
                  {tempOrderItems.map((item) => (
                    <HStack
                      key={item.food_id}
                      p={3}
                      bg="gray.50"
                      rounded="md"
                      shadow="sm"
                      _hover={{ bg: "gray.100" }}
                      transition="background-color 0.2s"
                    >
                      <Text
                        flex="3"
                        fontWeight="medium"
                        color="var(--dark-gray-text)"
                        fontSize="sm"
                      >
                        {item.name}
                      </Text>
                      <HStack flex="2" justifyContent="center">
                        <IconButton
                          icon={<DynamicMinusIcon />}
                          size="xs"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.food_id,
                              item.quantity - 1
                            )
                          }
                          isDisabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                          bg="white"
                          color="var(--dark-gray-text)"
                          _hover={{ bg: "gray.200" }}
                          border="1px solid"
                          borderColor="gray.300"
                        />
                        <Text fontWeight="bold" color="var(--dark-gray-text)" minW="20px" textAlign="center">
                          {item.quantity}
                        </Text>
                        <IconButton
                          icon={<DynamicAddIcon />}
                          size="xs"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.food_id,
                              item.quantity + 1
                            )
                          }
                          aria-label="Increase quantity"
                          bg="white"
                          color="var(--dark-gray-text)"
                          _hover={{ bg: "gray.200" }}
                          border="1px solid"
                          borderColor="gray.300"
                        />
                      </HStack>
                      <Text
                        flex="1"
                        textAlign="right"
                        fontWeight="semibold"
                        color="var(--primary-green)"
                        fontSize="sm"
                      >
                        R {item.sub_total?.toFixed(2)}
                      </Text>
                      <IconButton
                        icon={<DynamicDeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleRemoveItem(item.food_id)}
                        aria-label="Remove item"
                      />
                    </HStack>
                  ))}
                </VStack>
              )}

              {tempOrderItems.length > 0 && (
                <Box mt="auto" pt={4} borderTop="2px solid" borderColor="gray.200">
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color="var(--primary-green)"
                    >
                      Total:
                    </Text>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color="var(--primary-green)"
                    >
                      R {tempOrderTotal.toFixed(2)}
                    </Text>
                  </Flex>
                </Box>
              )}
            </Box>
          </Flex>
        </ModalBody>

        <ModalFooter
          borderTop="1px solid var(--border-color)"
          pt={4}
          pb={4}
          bg="white"
          roundedBottom="xl"
        >
          <Button
            variant="outline"
            onClick={onClose}
            mr={3}
            size="md"
            borderRadius="md"
          >
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={handleFinish}
            isDisabled={tempOrderItems.length === 0}
            size="md"
            borderRadius="md"
            px={6}
            fontWeight="semibold"
          >
            Finish Adding Items
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NewOrderMenuModal;