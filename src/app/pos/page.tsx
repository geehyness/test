"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Flex,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Button,
  VStack,
  Text,
  HStack,
  Badge,
  Spacer,
  useToast,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputLeftElement,
  Input,
  Image,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import {
  FaPlus,
  FaShoppingCart,
  FaClipboardList,
  FaSearch,
  FaPlusCircle,
  FaMinusCircle,
  FaTrash,
  FaUtensils,
  FaChair,
  FaList,
} from "react-icons/fa";
import { usePOSStore } from "@/lib/usePOSStore";
import { Order, Table, Food, Category, OrderItem } from "@/lib/config/entities";
import { fetchData } from "@/lib/api";
import EditOrderModal from "@/components/pos/EditOrderModal";
import TableActionModal from "@/components/pos/TableActionModal";
import MenuCategoryFilter from "@/components/pos/MenuCategoryFilter";

export default function POSDashboardPage() {
  const toast = useToast();

  // Destructure state and actions from the POS store
  const {
    currentStaff,
    menuItems,
    categories,
    tables,
    currentOrder,
    activeOrders,
    setMenuItems,
    setCategories,
    setTables,
    clearCurrentOrder,
    addOrder,
    updateOrder: updateOrderInStore,
    setActiveOrders,
    setCurrentOrder,
  } = usePOSStore();

  // Local state for UI and data fetching status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [tempOrderItems, setTempOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0); // Add this state for controlling tabs

  // Use existing modal state for EditOrderModal
  const {
    isOpen: isCurrentOrderDetailsModalOpen,
    onOpen: onCurrentOrderDetailsModalOpen,
    onClose: onCurrentOrderDetailsModalClose,
  } = useDisclosure();

  // Table Action Modal State
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const {
    isOpen: isTableActionModalOpen,
    onOpen: onTableActionModalOpen,
    onClose: onTableActionModalClose,
  } = useDisclosure();

  // useEffect hook to load initial data from the API (sample data)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedFoods, fetchedCategories, fetchedTables, fetchedOrders] =
          await Promise.all([
            fetchData("foods"),
            fetchData("categories"),
            fetchData("tables"),
            fetchData("orders"),
          ]);

        setMenuItems(fetchedFoods || []);
        setCategories(fetchedCategories || []);
        setTables(fetchedTables || []);

        const active = (fetchedOrders || []).filter(
          (order: Order) =>
            order.status !== "paid" &&
            order.status !== "cancelled" &&
            order.status !== "served"
        );
        setActiveOrders(active);
      } catch (err: any) {
        setError(err.message || "Failed to load initial data.");
        console.error("Error loading POS data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setMenuItems, setCategories, setTables, setActiveOrders]);

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
                sub_total: (item.quantity + 1) * (food.price || 0),
              }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            id: `temp-oi-${Date.now()}-${Math.random()
              .toString(36)
              .substring(7)}`,
            order_id: "",
            food_id: food.id,
            quantity: 1,
            price: food.price || 0,
            sub_total: food.price || 0,
            name: food.name,
            price_at_sale: food.price || 0,
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
          const itemPrice = food?.price || item.price;
          return { ...item, quantity, sub_total: quantity * (itemPrice || 0) };
        }
        return item;
      });
      return updated.filter((item) => item.quantity > 0);
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

  // Calculate total for the temporary order
  const tempOrderTotal = tempOrderItems.reduce(
    (sum, item) => sum + (item.sub_total || 0),
    0
  );

  // Function to update table status
  const updateTable = async (tableId: string, updates: Partial<Table>) => {
    try {
      await fetchData("tables", tableId, updates, "PUT");

      // Update the table in the store
      setTables(
        tables.map((table) =>
          table.id === tableId ? { ...table, ...updates } : table
        )
      );

      return true;
    } catch (error: any) {
      toast({
        title: "Error updating table",
        description: error.message || "There was an error updating the table.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(`ERROR: Error updating table #${tableId}:`, error);
      return false;
    }
  };

  // Modified updateOrder function to handle table status when orders are cancelled
  const updateOrder = async (orderId: string, updatedOrder: Partial<Order>) => {
    try {
      await fetchData("orders", orderId, updatedOrder, "PUT");

      // If order is cancelled, free the table
      if (updatedOrder.status === "cancelled" && updatedOrder.table_id) {
        await updateTable(updatedOrder.table_id, {
          status: "free",
          current_order_id: null,
        });
      }

      // Now, only use the store's action to update state
      updateOrderInStore(orderId, updatedOrder);

      // If order is completed (served, paid, or cancelled), remove it from active orders
      if (
        updatedOrder.status === "served" ||
        updatedOrder.status === "paid" ||
        updatedOrder.status === "cancelled"
      ) {
        setActiveOrders(activeOrders.filter((order) => order.id !== orderId));
      }

      toast({
        title: "Order Updated",
        description: `Order #${orderId} has been updated.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error updating order.",
        description: error.message || "There was an error updating the order.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(`ERROR: Error updating order #${orderId}:`, error);
      return false;
    }
  };

  // Handle loading an order for editing
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    onCurrentOrderDetailsModalOpen();
  };

  // Handle saving changes from EditOrderModal
  const handleSaveOrderChanges = async (data: {
    items: any[];
    tableId: string | null;
    status?: string;
    notes?: string;
  }) => {
    if (!editingOrder) return;

    try {
      const subtotal = data.items.reduce(
        (sum, item) => sum + (item.sub_total || 0),
        0
      );
      const tax = subtotal * 0.15;
      const total = subtotal + tax;

      const updatedOrder: Order = {
        ...editingOrder,
        items: data.items,
        table_id: data.tableId,
        subtotal_amount: subtotal,
        tax_amount: tax,
        total_amount: total,
        order_type: data.tableId ? "dine-in" : "takeaway",
        updated_at: new Date().toISOString(),
        status: data.status || editingOrder.status,
        notes: data.notes || editingOrder.notes,
      };

      // Handle table status changes
      if (editingOrder.table_id !== data.tableId) {
        // Table changed - free the old table if it existed
        if (editingOrder.table_id) {
          await updateTable(editingOrder.table_id, {
            status: "free",
            current_order_id: null,
          });
        }

        // Occupy the new table if one is selected
        if (data.tableId) {
          await updateTable(data.tableId, {
            status: "occupied",
            current_order_id: editingOrder.id,
          });
        }
      }

      await updateOrder(editingOrder.id, updatedOrder);

      toast({
        title: "Order Updated",
        description: `Order #${editingOrder.id} has been updated.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Close the modal after saving
      onCurrentOrderDetailsModalClose();
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message || "There was an error updating the order",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle status changes from the modal
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const orderToUpdate =
        activeOrders.find((order) => order.id === orderId) || editingOrder;
      if (!orderToUpdate) return;

      const updatedOrder = { ...orderToUpdate, status: newStatus };
      await updateOrder(orderId, updatedOrder);

      // Update the editingOrder state if we're currently editing this order
      if (editingOrder && editingOrder.id === orderId) {
        setEditingOrder(updatedOrder);
      }
    } catch (error: any) {
      toast({
        title: "Error updating order status",
        description:
          error.message || "There was an error updating the order status",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // NEW: Simplified function to start new order
  const handleStartNewOrder = () => {
    setTempOrderItems([]); // Clear any existing items
    setActiveTabIndex(0); // Switch to the first tab (Menu tab)
  };

  // Handle table click to show action modal
  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    onTableActionModalOpen();
  };

  // Handle marking table as free
  const handleMarkTableFree = async (tableId: string) => {
    const success = await updateTable(tableId, {
      status: "free",
      current_order_id: null,
    });

    if (success) {
      toast({
        title: "Table Freed",
        description: `Table has been marked as free.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onTableActionModalClose();
    }
  };

  // Handle viewing order from table
  const handleViewOrder = (orderId: string) => {
    const orderToLoad = activeOrders.find((order) => order.id === orderId);
    if (orderToLoad) {
      handleEditOrder(orderToLoad);
    }
  };

  // Handle order status change from the order list
  const handleOrderStatusChange = async (order: Order, newStatus: string) => {
    const updatedOrder = { ...order, status: newStatus };
    await updateOrder(order.id, updatedOrder);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="calc(100vh - 80px)">
        <Spinner size="xl" color="var(--primary-green)" />
        <Text ml={4} fontSize="xl" color="var(--dark-gray-text)">
          Loading POS data...
        </Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" variant="left-accent" m={4}>
        <AlertIcon />
        <AlertTitle>Error Loading Data!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Flex h="100%" gap={6}>
        <Box
          flex="2"
          bg="var(--background-color-light)"
          p={6}
          rounded="lg"
          shadow="md"
          overflowY="auto"
          w="full"
        >
          <VStack spacing={6} align="stretch" h="100%">
            <HStack
              textAlign="center"
              position="relative"
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text
                fontSize="xl"
                fontWeight="bold"
                color="var(--dark-gray-text)"
              >
                POS Dashboard
              </Text>
              <Button
                leftIcon={<FaPlus />}
                colorScheme="green"
                onClick={handleStartNewOrder}
                size="md"
                fontSize="md"
                fontWeight="semibold"
              >
                Add Order
              </Button>
            </HStack>

            {/* Updated Tabs component with controlled index */}
            <Tabs
              isFitted
              variant="enclosed"
              colorScheme="green"
              index={activeTabIndex}
              onChange={setActiveTabIndex}
            >
              <TabList mb="1em">
                <Tab fontWeight="semibold" fontSize="lg">
                  <Icon as={FaUtensils} mr={2} />
                  Menu
                </Tab>
                <Tab fontWeight="semibold" fontSize="lg">
                  <Icon as={FaChair} mr={2} />
                  Restaurant Tables
                </Tab>
                <Tab fontWeight="semibold" fontSize="lg">
                  <Icon as={FaList} mr={2} />
                  Live Orders
                </Tab>
              </TabList>
              <TabPanels>
                {/* Menu Tab */}
                <TabPanel p={0}>
                  <Flex
                    direction={{ base: "column", md: "row" }}
                    gap={6}
                    flex="1"
                    minH="0"
                  >
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
                          <Icon as={FaSearch} color="gray.300" />
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

                      <SimpleGrid minChildWidth="150px" spacing={4} mt={4}>
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
                                item.image_urls?.at(0) ||
                                `https://placehold.co/150x100/E0E0E0/333333?text=${
                                  item.name.split(" ")[0]
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
                                e.target.src = `https://placehold.co/150x100/E0E0E0/333333?text=${
                                  item.name.split(" ")[0]
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
                              <Text
                                fontWeight="bold"
                                color="var(--primary-green)"
                              >
                                R {item.price?.toFixed(2)}
                              </Text>
                              <Badge colorScheme="purple" fontSize="xx-small">
                                {categories.find(
                                  (cat) => cat.id === item.category_id
                                )?.name || "Category"}
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
                        {tempOrderItems.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}{" "}
                        items)
                      </Text>

                      <Divider mb={4} />

                      {tempOrderItems.length === 0 ? (
                        <Box
                          textAlign="center"
                          py={10}
                          color="var(--medium-gray-text)"
                          bg="gray.50"
                          rounded="md"
                        >
                          <Text>No items added yet.</Text>
                          <Text fontSize="sm" mt={2}>
                            Add items from the menu on the left.
                          </Text>
                        </Box>
                      ) : (
                        <VStack
                          spacing={3}
                          align="stretch"
                          flex="1"
                          overflowY="auto"
                        >
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
                                  icon={<FaMinusCircle />}
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
                                <Text
                                  fontWeight="bold"
                                  color="var(--dark-gray-text)"
                                  minW="20px"
                                  textAlign="center"
                                >
                                  {item.quantity}
                                </Text>
                                <IconButton
                                  icon={<FaPlusCircle />}
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
                                icon={<FaTrash />}
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
                        <Box
                          mt="auto"
                          pt={4}
                          borderTop="2px solid"
                          borderColor="gray.200"
                        >
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
                          <Button
                            colorScheme="green"
                            onClick={() => {
                              // You'll need to implement the table selection logic here
                              // For now, let's just create the order directly
                              const subtotal_amount = tempOrderItems.reduce(
                                (sum, item) => sum + (item.sub_total || 0),
                                0
                              );
                              const tax_percentage = 0.15;
                              const tax_amount =
                                subtotal_amount * tax_percentage;
                              const total_amount = subtotal_amount + tax_amount;

                              const tempOrderId = `temp-${Date.now()}-${Math.random()
                                .toString(36)
                                .substring(7)}`;

                              const newOrder: Order = {
                                id: tempOrderId,
                                store_id: "default-store",
                                table_id: null, // No table selected
                                customer_id: null,
                                total_amount: total_amount,
                                status: "new",
                                notes: "",
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                                items: tempOrderItems,
                                subtotal_amount: subtotal_amount,
                                tax_amount: tax_amount,
                                discount_amount: 0,
                                employee_id: currentStaff?.id || "emp-101",
                                order_type: "takeaway",
                              };

                              addOrder(newOrder);
                              setActiveOrders([...activeOrders, newOrder]);
                              setCurrentOrder(newOrder);
                              setEditingOrder(newOrder);
                              setTempOrderItems([]);
                              onCurrentOrderDetailsModalOpen();

                              toast({
                                title: "New Order Created",
                                description:
                                  "Order is ready for review and sending to kitchen.",
                                status: "success",
                                duration: 3000,
                                isClosable: true,
                              });
                            }}
                            isDisabled={tempOrderItems.length === 0}
                            size="md"
                            width="full"
                            mt={4}
                            fontWeight="semibold"
                          >
                            Create Order
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Flex>
                </TabPanel>

                {/* Tables Tab */}
                <TabPanel p={0}>
                  <SimpleGrid
                    columns={{ base: 2, md: 3, lg: 4 }}
                    spacing={6}
                    w="full"
                  >
                    {tables.map((table) => (
                      <Box
                        key={table.id}
                        p={4}
                        borderWidth="2px"
                        borderColor={
                          table.status === "occupied"
                            ? "var(--primary-red)"
                            : "var(--primary-green)"
                        }
                        rounded="xl"
                        shadow="md"
                        bg={
                          table.status === "occupied"
                            ? "var(--primary-red-light)"
                            : "var(--primary-green-light)"
                        }
                        textAlign="center"
                        cursor="pointer"
                        _hover={{
                          transform: "scale(1.02)",
                          shadow: "lg",
                        }}
                        transition="all 0.2s ease-in-out"
                        position="relative"
                        height="180px"
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        onClick={() => handleTableClick(table)}
                      >
                        <Box
                          width="120px"
                          height="120px"
                          bg={
                            table.status === "occupied"
                              ? "#aaaaaa"
                              : "var(--primary-green)"
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
                          <Text fontSize="md" lineHeight="1.2">
                            {table.name}
                          </Text>
                          <Badge
                            colorScheme={
                              table.status === "occupied" ? "red" : "green"
                            }
                            variant="solid"
                            px={2}
                            py={0.5}
                            rounded="full"
                            fontSize="xx-small"
                          >
                            {table.status?.toUpperCase()}
                          </Badge>
                          <Text fontSize="xx-small" lineHeight="1.2" mt={1}>
                            Seats: {table.capacity}
                          </Text>
                          {table.current_order_id && (
                            <Text fontSize="xx-small" lineHeight="1.2">
                              Order: #{table.current_order_id}
                            </Text>
                          )}
                        </Box>
                        {Array.from({ length: table.capacity }).map((_, i) => {
                          const angle = (i / table.capacity) * 2 * Math.PI;
                          const radius = 60;
                          const translateX = radius * Math.cos(angle);
                          const translateY = radius * Math.sin(angle);
                          return (
                            <Box
                              key={i}
                              w="20px"
                              h="20px"
                              bg="gray.500"
                              rounded="full"
                              position="absolute"
                              style={{
                                transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`,
                                top: "50%",
                                left: "50%",
                              }}
                              zIndex="0"
                            />
                          );
                        })}
                      </Box>
                    ))}
                  </SimpleGrid>
                </TabPanel>

                {/* Live Orders Tab */}
                <TabPanel p={0}>
                  {activeOrders.length === 0 ? (
                    <Text
                      textAlign="center"
                      py={10}
                      color="var(--medium-gray-text)"
                    >
                      No active orders at the moment.
                    </Text>
                  ) : (
                    <SimpleGrid
                      columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                      spacing={4}
                      w="full"
                    >
                      {activeOrders.map((order) => (
                        <Box
                          key={order.id}
                          p={4}
                          borderWidth="1px"
                          rounded="md"
                          shadow="sm"
                          bg="var(--light-gray-bg)"
                          cursor="pointer"
                          _hover={{ transform: "scale(1.02)", shadow: "md" }}
                          transition="all 0.2s ease-in-out"
                          onClick={() => {
                            handleEditOrder(order);
                          }}
                        >
                          <Flex align="center" mb={2}>
                            <Text
                              fontWeight="bold"
                              fontSize="md"
                              color="var(--dark-gray-text)"
                            >
                              Order #{order.id}
                            </Text>
                            <Spacer />
                            <Badge
                              colorScheme={
                                order.status === "new"
                                  ? "purple"
                                  : order.status === "preparing"
                                  ? "orange"
                                  : order.status === "ready"
                                  ? "green"
                                  : order.status === "served"
                                  ? "blue"
                                  : "gray"
                              }
                            >
                              {order.status.toUpperCase()}
                            </Badge>
                          </Flex>
                          <Text fontSize="sm" color="var(--medium-gray-text)">
                            Table:{" "}
                            {tables.find((t) => t.id === order.table_id)
                              ?.name || "Takeaway"}
                          </Text>
                          <Text fontSize="sm" color="var(--medium-gray-text)">
                            Total: R {order.total_amount?.toFixed(2)}
                          </Text>
                          <Text fontSize="sm" color="var(--medium-gray-text)">
                            Items:{" "}
                            {(order.items ?? [])
                              .map((item) => `${item.name} (x${item.quantity})`)
                              .join(", ")}
                          </Text>
                          {order.created_at && (
                            <Text
                              fontSize="xs"
                              color="var(--medium-gray-text)"
                              mt={1}
                            >
                              Created:{" "}
                              {new Date(order.created_at).toLocaleString()}
                            </Text>
                          )}
                          <HStack mt={3} justifyContent="flex-end">
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditOrder(order);
                              }}
                            >
                              Load Order
                            </Button>
                            {order.status === "new" && (
                              <Button
                                size="sm"
                                colorScheme="orange"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderStatusChange(order, "preparing");
                                }}
                              >
                                Mark Preparing
                              </Button>
                            )}
                            {order.status === "preparing" && (
                              <Button
                                size="sm"
                                colorScheme="green"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderStatusChange(order, "ready");
                                }}
                              >
                                Mark Ready
                              </Button>
                            )}
                            {order.status === "ready" && (
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderStatusChange(order, "served");
                                }}
                              >
                                Mark Served
                              </Button>
                            )}
                            {(order.status === "new" ||
                              order.status === "preparing") && (
                              <Button
                                size="sm"
                                colorScheme="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderStatusChange(order, "cancelled");
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </HStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Box>
      </Flex>

      {/* Modals */}
      <EditOrderModal
        isOpen={isCurrentOrderDetailsModalOpen}
        onClose={onCurrentOrderDetailsModalClose}
        menuItems={menuItems}
        categories={categories}
        tables={tables}
        currentTableId={editingOrder?.table_id || null}
        orderItems={editingOrder?.items || []}
        currentOrder={editingOrder || undefined}
        onUpdateOrder={(items, tableId) => {
          // Update the UI in real-time
          if (editingOrder) {
            const updatedOrder = {
              ...editingOrder,
              items,
              table_id: tableId,
            };
            setEditingOrder(updatedOrder);
            updateOrderInStore(editingOrder.id, updatedOrder);
          }
        }}
        onSaveChanges={handleSaveOrderChanges}
        onStatusChange={handleStatusChange}
      />

      <TableActionModal
        isOpen={isTableActionModalOpen}
        onClose={onTableActionModalClose}
        table={selectedTable}
        onMarkTableFree={handleMarkTableFree}
        onViewOrder={handleViewOrder}
      />
    </>
  );
}
