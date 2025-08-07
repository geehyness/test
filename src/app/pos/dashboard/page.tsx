// src/app/pos/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  InputGroup,
  InputLeftElement,
  Input,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  HStack,
  Icon,
  Badge,
  Spacer,
  useToast,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import dynamic from "next/dynamic"; // Import dynamic from next/dynamic

// Dynamically import Chakra UI icons to ensure they are only loaded client-side
const DynamicSearchIcon = dynamic(
  () => import("@chakra-ui/icons").then((mod) => mod.SearchIcon),
  { ssr: false }
);
const DynamicChevronLeftIcon = dynamic(
  () => import("@chakra-ui/icons").then((mod) => mod.ChevronLeftIcon),
  { ssr: false }
);
const DynamicChevronRightIcon = dynamic(
  () => import("@chakra-ui/icons").then((mod) => mod.ChevronRightIcon),
  { ssr: false }
);
const DynamicCheckCircleIcon = dynamic(
  () => import("@chakra-ui/icons").then((mod) => mod.CheckCircleIcon),
  { ssr: false }
);
const DynamicCloseIcon = dynamic(
  () => import("@chakra-ui/icons").then((mod) => mod.CloseIcon),
  { ssr: false }
);

import {
  FaShoppingCart,
  FaClipboardList,
  FaMoneyBillWave,
  FaCreditCard,
  FaUtensils,
  FaBell,
  FaChair,
  FaPlus, // Added for "Add Order" button
} from "react-icons/fa";
import MenuCategoryFilter from "../components/MenuCategoryFilter";
import MenuItemList from "../components/MenuItemList";
import TableSelectionModal from "../components/TableSelectionModal";
import PaymentModal from "../components/PaymentModal";
import { usePOSStore } from "../lib/usePOSStore";
import { Food, Category, Table, Order, OrderItem } from "@/app/config/entities";
import { fetchData } from "@/app/lib/api";

// New components for different views
import OrderManagementView from "../components/OrderManagementView";
import KitchenDisplayView from "../components/KitchenDisplayView";
import ServerView from "../components/ServerView";
import CurrentOrderDetailsModal from "../components/CurrentOrderDetailsModal";
import NewOrderMenuModal from "../components/NewOrderMenuModal"; // New import

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
    addOrderItem,
    removeOrderItem,
    updateOrderItemQuantity,
    clearCurrentOrder,
    addOrder,
    updateOrder: updateOrderInStore,
    setActiveOrders,
    setCurrentOrderTable,
    setOrderNotes,
    applyDiscountToOrder,
    processOrderPayment,
    setCurrentOrder,
  } = usePOSStore();

  // Local state for UI and data fetching status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  // === New Order Creation Flow State ===
  const {
    isOpen: isNewOrderMenuModalOpen,
    onOpen: onNewOrderMenuModalOpen,
    onClose: onNewOrderMenuModalClose,
  } = useDisclosure();
  const {
    isOpen: isNewOrderTableModalOpen,
    onOpen: onNewOrderTableModalOpen,
    onClose: onNewOrderTableModalClose,
  } = useDisclosure();
  const [tempNewOrderItems, setTempNewOrderItems] = useState<OrderItem[]>([]);
  const [tempNewOrderTableId, setTempNewOrderTableId] = useState<string | null>(
    null
  );
  // =====================================

  // Disclosure hooks for modals
  const {
    isOpen: isTableModalOpen, // Existing table modal, might be repurposed or kept for existing order edits
    onOpen: onTableModalOpen,
    onClose: onTableModalClose,
  } = useDisclosure();
  const {
    isOpen: isPaymentModalOpen,
    onOpen: onPaymentModalOpen,
    onClose: onPaymentModalClose,
  } = useDisclosure();
  const {
    isOpen: isTrackOrderModalOpen,
    onOpen: onTrackOrderModalOpen,
    onClose: onTrackOrderModalClose,
  } = useDisclosure();
  const {
    isOpen: isNotesModalOpen,
    onOpen: onNotesModalOpen,
    onClose: onNotesModalClose,
  } = useDisclosure();
  const {
    isOpen: isDiscountModalOpen,
    onOpen: onDiscountModalOpen,
    onClose: onDiscountModalClose,
  } = useDisclosure();
  const {
    isOpen: isCurrentOrderDetailsModalOpen,
    onOpen: onCurrentOrderDetailsModalOpen,
    onClose: onCurrentOrderDetailsModalClose,
  } = useDisclosure();

  // Local state for notes and discount
  const [currentNotes, setCurrentNotes] = useState(currentOrder.notes || "");
  const [discountCode, setDiscountCode] = useState("");

  // useEffect hook to load initial data from the API (sample data)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch all necessary data concurrently using fetchData from api.ts
        const [fetchedFoods, fetchedCategories, fetchedTables, fetchedOrders] =
          await Promise.all([
            fetchData("foods"),
            fetchData("categories"),
            fetchData("tables"),
            fetchData("orders"),
          ]);

        // LOGS: Displaying the fetched data
        console.log("--- Data Fetched from API (sample.ts) ---");
        console.log("Fetched Foods (Menu Items):", fetchedFoods);
        console.log("Fetched Categories:", fetchedCategories);
        console.log("Fetched Tables:", fetchedTables);
        console.log("Fetched Orders:", fetchedOrders);
        console.log("------------------------------------------");

        // Update the POS store with the fetched data
        setMenuItems(fetchedFoods || []);
        setCategories(fetchedCategories || []);
        setTables(fetchedTables || []);

        // Filter active orders (not paid or cancelled) and update state
        const active = (fetchedOrders || []).filter(
          (order: Order) =>
            order.status !== "paid" &&
            order.status !== "cancelled" &&
            order.status !== "served"
        );
        setActiveOrders(active); // Update the active orders in the store
        setActiveOrdersCount(active.length); // Update the local count
      } catch (err: any) {
        // Handle errors during data loading
        setError(err.message || "Failed to load initial data.");
        console.error("Error loading POS data:", err);
      } finally {
        setLoading(false); // Set loading to false regardless of success or failure
      }
    };

    loadData(); // Call the data loading function
  }, [setMenuItems, setCategories, setTables, setActiveOrders]); // Dependencies for useEffect

  // Function to update an order, both in the mock API and the local store
  const updateOrder = async (orderId: string, updatedOrder: Partial<Order>) => {
    try {
      // Call the mock API to update the order
      await fetchData("orders", orderId, updatedOrder, "PUT");
      console.log(
        `LOG: API call to update order #${orderId} with data:`,
        updatedOrder
      );

      // Update the order in the Zustand store
      updateOrderInStore(orderId, updatedOrder);
      console.log(`LOG: Order #${orderId} updated in store.`);

      // Re-filter active orders after an update
      const updatedActiveOrders = activeOrders
        .map((order) =>
          order.id === orderId ? { ...order, ...updatedOrder } : order
        )
        .filter(
          (order) =>
            order.status !== "paid" &&
            order.status !== "cancelled" &&
            order.status !== "served"
        );
      setActiveOrders(updatedActiveOrders);
      setActiveOrdersCount(updatedActiveOrders.length);
      console.log(
        "LOG: Active orders re-filtered. New active orders count:",
        updatedActiveOrders.length
      );

      toast({
        title: "Order Updated",
        description: `Order #${orderId} has been updated.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      console.log(
        `LOG: Order #${orderId} status updated to: ${updatedOrder.status}`
      );
    } catch (error: any) {
      toast({
        title: "Error updating order.",
        description: error.message || "There was an error updating the order.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(`ERROR: Error updating order #${orderId}:`, error);
    }
  };

  // Memoized filtering of menu items based on search term and selected category
  const filteredMenuItems = React.useMemo(() => {
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

  // Handler for adding notes to the current order
  const handleAddNotes = () => {
    setOrderNotes(currentNotes);
    onNotesModalClose();
    toast({
      title: "Notes Added",
      description: "Notes have been added to the current order.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
    console.log("LOG: Notes added to current order:", currentNotes);
  };

  // Handler for applying discount to the current order
  const handleApplyDiscount = async () => {
    if (discountCode === "SAVE10") {
      applyDiscountToOrder(0.1, "percentage");
      toast({
        title: "Discount Applied",
        description: "10% discount applied to the order.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDiscountModalClose();
      console.log('LOG: Discount "SAVE10" applied.');
    } else if (discountCode === "FREEDELIVERY") {
      // Changed "fixed" to "amount"
      applyDiscountToOrder(5.0, "amount");
      toast({
        title: "Discount Applied",
        description: "R5 fixed discount applied.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDiscountModalClose();
      console.log('LOG: Discount "FREEDELIVERY" applied.');
    } else {
      toast({
        title: "Invalid Discount",
        description: "The discount code entered is not valid.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.warn("WARNING: Invalid discount code entered:", discountCode);
    }
  };

  // Handler for processing checkout and payment
  const handleCheckout = async (paymentMethod: "cash" | "card" | "split") => {
    try {
      // Safely access currentOrder.items
      if ((currentOrder.items ?? []).length === 0) {
        toast({
          title: "Order Empty",
          description: "Please add items to the order before checking out.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        console.warn("WARNING: Attempted checkout with empty order.");
        return;
      }

      // Construct the order object for submission
      const orderToSubmit: Order = {
        ...currentOrder,
        id: currentOrder.id || `order-${Date.now()}`, // Ensure ID exists for new orders
        status: "paid", // Mark as paid upon checkout
        employee_id: currentOrder.employee_id || "emp-101", // Ensure employee_id is set
        created_at: currentOrder.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_type: currentOrder.table_id ? "dine-in" : "takeaway",
        items: (currentOrder.items ?? []).map((item) => ({
          // Safely map items
          ...item, // Keep existing properties
          food_id: item.food_id,
          name: item.name,
          price: item.price, // Ensure price is included
          sub_total: item.sub_total,
          notes: item.notes,
          price_at_sale: item.price_at_sale || item.price, // Ensure price_at_sale is set
        })),
      } as Order;

      // Process payment (simulated)
      await processOrderPayment(orderToSubmit, paymentMethod);
      console.log(
        `LOG: Payment processed for order #${orderToSubmit.id} via ${paymentMethod}.`
      );

      // Add or update the order in the mock API
      if (!currentOrder.id) {
        // If it's a new order, add it
        const newOrder = await fetchData(
          "orders",
          undefined,
          orderToSubmit,
          "POST"
        );
        addOrder(newOrder); // Add to store
        console.log("LOG: New order added via API:", newOrder);
      } else {
        // If it's an existing order being modified and paid
        await fetchData("orders", currentOrder.id, orderToSubmit, "PUT");
        updateOrderInStore(currentOrder.id, orderToSubmit); // Update in store
        console.log("LOG: Existing order updated via API:", orderToSubmit);
      }

      clearCurrentOrder(); // Clear the current order after successful checkout
      onPaymentModalClose(); // Close the payment modal
      onCurrentOrderDetailsModalClose(); // Close the current order details modal

      toast({
        title: "Order Placed & Paid",
        description: `Order #${orderToSubmit.id} processed successfully via ${paymentMethod}.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Dispatch a custom event for new order notification (e.g., for kitchen display)
      window.dispatchEvent(
        new CustomEvent("newOrderNotification", {
          detail: {
            id: `notif-${Date.now()}`,
            message: `New order #${orderToSubmit.id} received!`,
            type: "info",
          },
        })
      );
      console.log("LOG: Checkout successful for order:", orderToSubmit.id);
    } catch (err: any) {
      console.error("ERROR: Checkout error:", err);
      toast({
        title: "Checkout Failed",
        description: err.message || "There was an error processing the order.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handler for sending the current order to the kitchen
  const handleSendToKitchen = async () => {
    try {
      // Safely access currentOrder.items
      if ((currentOrder.items ?? []).length === 0) {
        toast({
          title: "Order Empty",
          description:
            "Please add items to the order before sending to kitchen.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        console.warn("WARNING: Attempted to send empty order to kitchen.");
        return;
      }

      if (!currentOrder.table_id && currentOrder.order_type !== "takeaway") {
        toast({
          title: "Table Not Selected",
          description:
            "Please select a table or mark as takeaway before sending to kitchen.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        console.warn(
          "WARNING: Attempted to send order to kitchen without table selection."
        );
        return;
      }

      // Construct the order object for submission
      const orderToSubmit: Order = {
        ...currentOrder,
        id: currentOrder.id || `order-${Date.now()}`, // Generate ID if new order
        status: "preparing", // Set status to 'preparing' for kitchen
        employee_id: currentOrder.employee_id || "emp-101", // Ensure employee_id is set
        created_at: currentOrder.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_type: currentOrder.table_id ? "dine-in" : "takeaway",
        items: (currentOrder.items ?? []).map((item) => ({
          // Safely map items
          ...item, // Keep existing properties
          food_id: item.food_id,
          name: item.name,
          price: item.price, // Ensure price is included
          sub_total: item.sub_total,
          notes: item.notes,
          price_at_sale: item.price_at_sale || item.price, // Ensure price_at_sale is set
        })),
      } as Order;

      // Add or update the order in the mock API
      if (!currentOrder.id) {
        const newOrder = await fetchData(
          "orders",
          undefined,
          orderToSubmit,
          "POST"
        );
        addOrder(newOrder); // Add to store
        console.log("LOG: New order sent to kitchen via API:", newOrder);
      } else {
        await fetchData("orders", currentOrder.id, orderToSubmit, "PUT");
        updateOrderInStore(currentOrder.id, orderToSubmit); // Update in store
        console.log(
          "LOG: Existing order sent to kitchen via API:",
          orderToSubmit
        );
      }

      clearCurrentOrder(); // Clear the current order after sending to kitchen
      onCurrentOrderDetailsModalClose(); // Close the current order details modal
      toast({
        title: "Order Sent to Kitchen",
        description: `Order #${orderToSubmit.id} is now being prepared.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Update active orders count
      setActiveOrdersCount((prev) => prev + 1);
      console.log("LOG: Order sent to kitchen:", orderToSubmit.id);
    } catch (err: any) {
      console.error("ERROR: Send to kitchen error:", err);
      toast({
        title: "Failed to Send Order",
        description:
          err.message || "There was an error sending the order to the kitchen.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handler for opening the track order modal
  const handleTrackOrderClick = () => {
    onTrackOrderModalOpen();
    console.log("LOG: Track Order modal opened.");
  };

  // === New Order Creation Flow Handlers ===
  const handleStartNewOrder = () => {
    setTempNewOrderItems([]); // Reset items for a new order
    setTempNewOrderTableId(null); // Reset table for a new order
    onNewOrderMenuModalOpen(); // Open the menu selection modal
  };

  const handleFinishAddingItems = (items: OrderItem[]) => {
    setTempNewOrderItems(items);
    onNewOrderMenuModalClose(); // Close menu modal
    if (items.length > 0) {
      onNewOrderTableModalOpen(); // Open table selection modal if items exist
    } else {
      toast({
        title: "No Items Added",
        description: "Please add items to the order before selecting a table.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSelectNewOrderTable = (tableId: string | null) => {
    setTempNewOrderTableId(tableId);
    onNewOrderTableModalClose();

    const subtotal_amount = tempNewOrderItems.reduce(
      (sum, item) => sum + (item.sub_total || 0),
      0
    );
    const tax_percentage = 0.15;
    const tax_amount = subtotal_amount * tax_percentage;
    const total_amount = subtotal_amount + tax_amount;

    // Get store ID: current staff's store if available, or table's store if assigned
    let storeId = 'default-store';
    if (currentStaff?.storeId) {
      storeId = currentStaff.storeId;
    } else if (tableId) {
      const table = tables.find(t => t.id === tableId);
      if (table && table.store_id) {
        storeId = table.store_id;
      }
    }

    // Create the new order object
    const newOrder: Order = {
      id: "", // Will be generated by fetchData on POST
      store_id: storeId, // Use determined store ID
      table_id: tableId,
      customer_id: null,
      total_amount: total_amount,
      status: "new",
      notes: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: tempNewOrderItems.map(item => ({
        ...item,
        price: item.price || item.price_at_sale || 0,
        price_at_sale: item.price_at_sale || item.price || 0,
      })),
      subtotal_amount: subtotal_amount,
      tax_amount: tax_amount,
      discount_amount: 0,
      employee_id: currentStaff?.id || "emp-101",
      order_type: tableId ? "dine-in" : "takeaway",
    };

    setCurrentOrder(newOrder);
    onCurrentOrderDetailsModalOpen();
    toast({
      title: "New Order Created",
      description: "Order is ready for review and sending to kitchen.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // =====================================

  // Display loading spinner while data is being fetched
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

  // Display error message if data fetching fails
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
    <Flex
      direction="column"
      h="100vh"
      bg="var(--light-gray-bg)"
      position="relative"
    >
      {" "}
      {/* Added position relative for floating buttons */}
      <Tabs
        variant="enclosed"
        colorScheme="orange"
        flex="1"
        display="flex"
        flexDirection="column"
      >
        <TabList
          borderBottom="2px solid var(--border-color)"
          bg="var(--background-color-light)"
          px={4}
          pt={2}
        >
          <Tab
            _selected={{
              color: "var(--primary-orange)",
              borderColor: "var(--primary-orange)",
              borderBottom: "none",
            }}
            fontSize="lg"
            fontWeight="semibold"
            color="var(--dark-gray-text)"
          >
            <Icon as={FaShoppingCart} mr={2} /> POS
          </Tab>
          <Tab
            _selected={{
              color: "var(--primary-orange)",
              borderColor: "var(--primary-orange)",
              borderBottom: "none",
            }}
            fontSize="lg"
            fontWeight="semibold"
            color="var(--dark-gray-text)"
          >
            <Icon as={FaClipboardList} mr={2} /> Order Management
          </Tab>
          <Tab
            _selected={{
              color: "var(--primary-orange)",
              borderColor: "var(--primary-orange)",
              borderBottom: "none",
            }}
            fontSize="lg"
            fontWeight="semibold"
            color="var(--dark-gray-text)"
          >
            <Icon as={FaUtensils} mr={2} /> Kitchen Display
          </Tab>
          <Tab
            _selected={{
              color: "var(--primary-orange)",
              borderColor: "var(--primary-orange)",
              borderBottom: "none",
            }}
            fontSize="lg"
            fontWeight="semibold"
            color="var(--dark-gray-text)"
          >
            <Icon as={FaBell} mr={2} /> Server View
          </Tab>
          {/* Reports/Analytics Tab */}

          {/* Add Order Button */}
          <Spacer />
          <Button
            leftIcon={<FaPlus />}
            colorScheme="green"
            onClick={handleStartNewOrder}
            ml={4}
            size="md"
            fontSize="md"
            fontWeight="semibold"
          >
            Add Order
          </Button>
        </TabList>

        <TabPanels flex="1" p={4}>
          {/* POS Tab Panel (now contains sub-tabs) */}
          <TabPanel h="100%" p={0}>
            <Flex h="100%" gap={6}>
              {/* Left Column: Contains sub-tabs for Menu and Tables */}
              <Box
                flex="2"
                bg="var(--background-color-light)"
                p={6}
                rounded="lg"
                shadow="md"
                overflowY="auto"
                w="full" // Ensure this box takes full width of its flex parent
              >
                <VStack spacing={6} align="stretch" h="100%">
                  {/* Restaurant Tables Section */}
                  <Box w="full"> {/* Ensure this box takes full width */}
                    <Text
                      fontSize="xl"
                      fontWeight="bold"
                      mb={4}
                      color="var(--dark-gray-text)"
                    >
                      Restaurant Tables
                    </Text>
                    <SimpleGrid
                      columns={{ base: 2, md: 3, lg: 4 }}
                      spacing={6}
                      w="full" // Ensure the grid takes full width
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
                          onClick={() => {
                            if (
                              table.status === "occupied" &&
                              table.current_order_id
                            ) {
                              const orderToLoad = activeOrders.find(
                                (order) =>
                                  order.id === table.current_order_id
                              );
                              if (orderToLoad) {
                                usePOSStore.setState({
                                  currentOrder: orderToLoad,
                                });
                                onCurrentOrderDetailsModalOpen();
                                toast({
                                  title: "Order Loaded",
                                  description: `Order #${orderToLoad.id} loaded for modification.`,
                                  status: "info",
                                  duration: 3000,
                                  isClosable: true,
                                });
                              }
                            } else {
                              // Table selection is now primarily handled by the new order flow
                              toast({
                                title: "Table Selection",
                                description:
                                  "Please use 'Add Order' to select a table for a new order.",
                                status: "info",
                                duration: 3000,
                                isClosable: true,
                              });
                            }
                          }}
                        >
                          {/* Table Center */}
                          <Box
                            width="120px"
                            height="120px"
                            bg={
                              table.status === "occupied"
                                ? "#aaaaaa"
                                : "var(--primary-green)"
                            }
                            rounded="full" // Changed from "lg" to "full" to make it a circle
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
                                table.status === "occupied"
                                  ? "red"
                                  : "green"
                              }
                              variant="solid"
                              px={2}
                              py={0.5}
                              rounded="full"
                              fontSize="xx-small"
                            >
                              {table.status?.toUpperCase()}
                            </Badge>
                            {/* Display number of seats (capacity) */}
                            <Text
                              fontSize="xx-small"
                              lineHeight="1.2"
                              mt={1}
                            >
                              Seats: {table.capacity}
                            </Text>
                            {table.current_order_id && (
                              <Text fontSize="xx-small" lineHeight="1.2">
                                Order: #{table.current_order_id}
                              </Text>
                            )}
                          </Box>

                          {/* Chairs around the table */}
                          {Array.from({ length: table.capacity }).map(
                            (_, i) => {
                              const angle =
                                (i / table.capacity) * 2 * Math.PI;
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
                            }
                          )}
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                  {/* End of Restaurant Tables Section */}

                  {/* Start of Live Orders section */}
                  <Box mt={6} w="full"> {/* Ensure this box takes full width */}
                    <Flex justifyContent="space-between" alignItems="center" mb={4}>
                      <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color="var(--dark-gray-text)"
                      >
                        Live Orders
                      </Text>
                      <Button
                        size="sm"
                        onClick={onTrackOrderModalOpen}
                        colorScheme="teal"
                        variant="outline"
                      >
                        View All ({activeOrdersCount})
                      </Button>
                    </Flex>
                    {activeOrders.length === 0 ? (
                      <Text
                        textAlign="center"
                        py={10}
                        color="var(--medium-gray-text)"
                      >
                        No active orders at the moment.
                      </Text>
                    ) : (
                      <SimpleGrid // Changed from VStack to SimpleGrid
                        columns={{ base: 1, md: 2, lg: 2 }} // Responsive columns for live orders
                        spacing={4}
                        w="full" // Ensure the grid takes full width
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
                              const orderToLoad = activeOrders.find(
                                (ao) => ao.id === order.id
                              );
                              if (orderToLoad) {
                                usePOSStore.setState({ currentOrder: orderToLoad });
                                onCurrentOrderDetailsModalOpen();
                                toast({
                                  title: "Order Loaded",
                                  description: `Order #${orderToLoad.id} loaded for modification.`,
                                  status: "info",
                                  duration: 3000,
                                  isClosable: true,
                                });
                              }
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
                                  order.status === "preparing"
                                    ? "orange"
                                    : order.status === "ready"
                                      ? "green"
                                      : "gray"
                                }
                              >
                                {order.status.toUpperCase()}
                              </Badge>
                            </Flex>
                            <Text fontSize="sm" color="var(--medium-gray-text)">
                              Table:{" "}
                              {tables.find((t) => t.id === order.table_id)?.name ||
                                "N/A"}
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
                            {/* Display created_at time */}
                            {order.created_at && (
                              <Text fontSize="xs" color="var(--medium-gray-text)" mt={1}>
                                Created: {new Date(order.created_at).toLocaleString()}
                              </Text>
                            )}
                            <HStack mt={3} justifyContent="flex-end">
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const fullOrder = activeOrders.find(
                                    (ao) => ao.id === order.id
                                  );
                                  if (fullOrder) {
                                    usePOSStore.setState({
                                      currentOrder: fullOrder,
                                    });
                                    onCurrentOrderDetailsModalOpen();
                                    toast({
                                      title: "Order Loaded",
                                      description: `Order #${order.id} loaded for modification.`,
                                      status: "info",
                                      duration: 3000,
                                      isClosable: true,
                                    });
                                  }
                                }}
                              >
                                Load Order
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="green"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrder(order.id, {
                                    ...order,
                                    status: "served",
                                  });
                                  toast({
                                    title: "Order Updated",
                                    description: `Order #${order.id} marked as served.`,
                                    status: "success",
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                }}
                              >
                                Mark Served
                              </Button>
                            </HStack>
                          </Box>
                        ))}
                        {activeOrders.length > 5 && (
                          <Button
                            size="sm"
                            variant="link"
                            colorScheme="blue"
                            onClick={onTrackOrderModalOpen}
                            mt={2}
                          >
                            Show All {activeOrders.length} Orders
                          </Button>
                        )}
                      </SimpleGrid>
                    )}
                  </Box>
                  {/* End of Live Orders section */}
                </VStack>
              </Box>

              {/* Right Column: Live Orders / Active Orders (1/3 width) - this is the old location */}
              <Box
                flex="1"
                bg="var(--background-color-light)"
                p={6}
                rounded="lg"
                shadow="md"
                overflowY="auto"
                display="none" // Hide the old Live Orders section
              >
                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color="var(--dark-gray-text)"
                  >
                    Live Orders
                  </Text>
                  <Button
                    size="sm"
                    onClick={onTrackOrderModalOpen}
                    colorScheme="teal"
                    variant="outline"
                  >
                    View All ({activeOrdersCount})
                  </Button>
                </Flex>
                {activeOrders.length === 0 ? (
                  <Text
                    textAlign="center"
                    py={10}
                    color="var(--medium-gray-text)"
                  >
                    No active orders at the moment.
                  </Text>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {activeOrders.slice(0, 5).map((order) => (
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
                          // Click handler for the order box itself
                          usePOSStore.setState({ currentOrder: order }); // Load order into currentOrder
                          onCurrentOrderDetailsModalOpen(); // Open the current order details modal
                          toast({
                            title: "Order Loaded",
                            description: `Order #${order.id} loaded for modification.`,
                            status: "info",
                            duration: 3000,
                            isClosable: true,
                          });
                          console.log(
                            "LOG: Order loaded for modification from Live Orders:",
                            order
                          );
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
                              order.status === "preparing"
                                ? "orange"
                                : order.status === "ready"
                                  ? "green"
                                  : "gray"
                            }
                          >
                            {order.status.toUpperCase()}
                          </Badge>
                        </Flex>
                        <Text fontSize="sm" color="var(--medium-gray-text)">
                          Table:{" "}
                          {tables.find((t) => t.id === order.table_id)?.name ||
                            "N/A"}
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
                        {/* Display created_at time */}
                        {order.created_at && (
                          <Text fontSize="xs" color="var(--medium-gray-text)" mt={1}>
                            Created: {new Date(order.created_at).toLocaleString()}
                          </Text>
                        )}
                        <HStack mt={3} justifyContent="flex-end">
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening modal twice from parent Box click
                              const fullOrder = activeOrders.find(
                                (ao) => ao.id === order.id
                              );
                              if (fullOrder) {
                                usePOSStore.setState({
                                  currentOrder: fullOrder,
                                });
                                onCurrentOrderDetailsModalOpen(); // *** MODIFIED HERE ***
                                toast({
                                  title: "Order Loaded",
                                  description: `Order #${order.id} loaded for modification.`,
                                  status: "info",
                                  duration: 3000,
                                  isClosable: true,
                                });
                                console.log(
                                  "LOG: Order loaded for modification from Live Orders:",
                                  fullOrder
                                );
                              }
                            }}
                          >
                            Load Order
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening modal twice
                              updateOrder(order.id, {
                                ...order,
                                status: "served",
                              });
                              toast({
                                title: "Order Updated",
                                description: `Order #${order.id} marked as served.`,
                                status: "success",
                                duration: 3000,
                                isClosable: true,
                              });
                            }}
                          >
                            Mark Served
                          </Button>
                        </HStack>
                      </Box>
                    ))}
                    {activeOrders.length > 5 && (
                      <Button
                        size="sm"
                        variant="link"
                        colorScheme="blue"
                        onClick={onTrackOrderModalOpen}
                        mt={2}
                      >
                        Show All {activeOrders.length} Orders
                      </Button>
                    )}
                  </VStack>
                )}
              </Box>
            </Flex>
          </TabPanel>

          {/* Order Management Tab Panel */}
          <TabPanel h="100%" p={0}>
            <OrderManagementView
              orders={activeOrders}
              tables={tables}
              updateOrder={updateOrder}
              onLoadOrder={(order) => {
                usePOSStore.setState({ currentOrder: order });
                onCurrentOrderDetailsModalOpen(); // Ensure this is called here as well if OrderManagementView has its own load order logic
                toast({
                  title: "Order Loaded",
                  description: `Order #${order.id} loaded for modification.`,
                  status: "info",
                  duration: 3000,
                  isClosable: true,
                });
              }}
            />
          </TabPanel>

          {/* Kitchen Display Tab Panel */}
          <TabPanel h="100%" p={0}>
            <KitchenDisplayView
              orders={activeOrders}
              tables={tables}
              updateOrder={updateOrder}
            />
          </TabPanel>

          {/* Server View Tab Panel */}
          <TabPanel h="100%" p={0}>
            <ServerView
              orders={activeOrders}
              tables={tables}
              updateOrder={updateOrder}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Floating Shopping Cart Button - moved to main Flex */}
      <Button
        onClick={onCurrentOrderDetailsModalOpen}
        colorScheme="green"
        size="lg"
        rounded="full"
        height="60px"
        width="60px"
        shadow="lg"
        _hover={{
          bg: "var(--primary-green)",
          transform: "scale(1.05)",
        }}
        transition="all 0.2s ease-in-out"
        position="absolute"
        bottom="20px"
        right="20px"
        bg="var(--primary-green)"
        color="white"
        zIndex="tooltip"
      >
        <Icon as={FaShoppingCart} w={6} h={6} />
        {(currentOrder.items ?? []).length > 0 && (
          <Badge
            colorScheme="red"
            position="absolute"
            top="-5px"
            right="-5px"
            rounded="full"
            px={2}
            py={1}
            fontSize="xs"
            fontWeight="bold"
          >
            {(currentOrder.items ?? []).reduce(
              (sum, item) => sum + item.quantity,
              0
            )}
          </Badge>
        )}
      </Button>
      {/* Floating Track Orders Button (only if there are active orders) - moved to main Flex */}
      {activeOrdersCount > 0 && (
        <Button
          onClick={handleTrackOrderClick}
          colorScheme="blue"
          size="lg"
          rounded="full"
          height="60px"
          width="60px"
          shadow="lg"
          _hover={{
            bg: "blue.600",
            transform: "scale(1.05)",
          }}
          transition="all 0.2s ease-in-out"
          position="absolute"
          bottom="20px"
          right="90px"
          bg="blue.500"
          color="white"
          zIndex="tooltip"
        >
          <Icon as={FaClipboardList} w={6} h={6} />
          <Badge
            colorScheme="orange"
            position="absolute"
            top="-5px"
            right="-5px"
            rounded="full"
            px={2}
            py={1}
            fontSize="xs"
            fontWeight="bold"
          >
            {activeOrdersCount}
          </Badge>
        </Button>
      )}
      {/* Modals (remain outside TabPanels as they are global) */}
      <TableSelectionModal
        isOpen={isTableModalOpen} // This is the old table modal, might be used for existing order edits
        onClose={onTableModalClose}
        tables={tables}
        onSelectTable={setCurrentOrderTable}
        currentSelectedTableId={currentOrder.table_id}
      />
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={onPaymentModalClose}
        orderTotal={currentOrder.total_amount}
        onProcessPayment={handleCheckout}
      />
      <Modal isOpen={isNotesModalOpen} onClose={onNotesModalClose}>
        <ModalOverlay />
        <ModalContent
          rounded="lg"
          bg="var(--background-color-light)"
          color="var(--dark-gray-text)"
        >
          <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>
            Add Order Notes
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Enter notes for the order..."
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              rounded="md"
              borderColor="var(--border-color)"
              focusBorderColor="var(--primary-green)"
              color="var(--dark-gray-text)"
            />
          </ModalBody>
          <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
            <Button variant="ghost" onClick={onNotesModalClose} mr={3}>
              Cancel
            </Button>
            <Button
              bg="var(--primary-green)"
              color="white"
              _hover={{ bg: "darken(var(--primary-green), 10%)" }}
              onClick={handleAddNotes}
            >
              Save Notes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isDiscountModalOpen} onClose={onDiscountModalClose}>
        <ModalOverlay />
        <ModalContent
          rounded="lg"
          bg="var(--background-color-light)"
          color="var(--dark-gray-text)"
        >
          <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>
            Apply Discount
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              rounded="md"
              borderColor="var(--border-color)"
              focusBorderColor="var(--primary-green)"
              color="var(--dark-gray-text)"
            />
          </ModalBody>
          <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
            <Button variant="ghost" onClick={onDiscountModalClose} mr={3}>
              Cancel
            </Button>
            <Button
              bg="var(--primary-green)"
              color="white"
              _hover={{ bg: "darken(var(--primary-green), 10%)" }}
              onClick={handleApplyDiscount}
            >
              Apply Discount
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Track Order Modal (Full List) - This modal is now less critical as Order Management View serves a similar purpose */}
      <Modal
        isOpen={isTrackOrderModalOpen}
        onClose={onTrackOrderModalClose}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent
          rounded="lg"
          bg="var(--background-color-light)"
          color="var(--dark-gray-text)"
        >
          <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>
            All Active Orders
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {activeOrders.length === 0 ? (
              <Text textAlign="center" py={10} color="var(--medium-gray-text)">
                No active orders at the moment.
              </Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {activeOrders.map((order) => (
                  <Box
                    key={order.id}
                    p={4}
                    borderWidth="1px"
                    rounded="md"
                    shadow="sm"
                    bg="var(--light-gray-bg)"
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
                          order.status === "preparing"
                            ? "orange"
                            : order.status === "ready"
                              ? "green"
                              : "gray"
                        }
                      >
                        {order.status.toUpperCase()}
                      </Badge>
                    </Flex>
                    <Text fontSize="sm" color="var(--medium-gray-text)">
                      Table:{" "}
                      {tables.find((t) => t.id === order.table_id)?.name ||
                        "N/A"}
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
                    {/* Display created_at time */}
                    {order.created_at && (
                      <Text fontSize="xs" color="var(--medium-gray-text)" mt={1}>
                        Created: {new Date(order.created_at).toLocaleString()}
                      </Text>
                    )}
                    <HStack mt={3} justifyContent="flex-end">
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => {
                          const fullOrder = activeOrders.find(
                            (ao) => ao.id === order.id
                          );
                          if (fullOrder) {
                            usePOSStore.setState({ currentOrder: fullOrder });
                            onTrackOrderModalClose();
                            toast({
                              title: "Order Loaded",
                              description: `Order #${order.id} loaded for modification.`,
                              status: "info",
                              duration: 3000,
                              isClosable: true,
                            });
                            console.log(
                              "LOG: Order loaded for modification:",
                              fullOrder
                            );
                          }
                        }}
                      >
                        Load Order
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="green"
                        onClick={() => {
                          updateOrder(order.id, { ...order, status: "served" });
                          toast({
                            title: "Order Updated",
                            description: `Order #${order.id} marked as served.`,
                            status: "success",
                            duration: 3000,
                            isClosable: true,
                          });
                        }}
                      >
                        Mark Served
                      </Button>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
            <Button variant="ghost" onClick={onTrackOrderModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Current Order Details Modal */}
      <CurrentOrderDetailsModal
        isOpen={isCurrentOrderDetailsModalOpen}
        onClose={onCurrentOrderDetailsModalClose}
        currentOrder={currentOrder}
        onRemoveItem={removeOrderItem}
        onUpdateQuantity={updateOrderItemQuantity}
        onAddNotes={onNotesModalOpen}
        onApplyDiscount={onDiscountModalOpen}
        onSelectTable={onTableModalOpen} // This is for editing existing order's table
        onSendToKitchen={handleSendToKitchen}
        onCheckout={handleCheckout}
        onClearOrder={clearCurrentOrder}
        tables={tables}
        updateOrder={updateOrder}
      />
      {/* New Order Menu Selection Modal */}
      <NewOrderMenuModal
        isOpen={isNewOrderMenuModalOpen}
        onClose={onNewOrderMenuModalClose}
        menuItems={menuItems}
        categories={categories}
        onFinishAddingItems={handleFinishAddingItems}
      />
      {/* New Order Table Selection Modal (reusing existing TableSelectionModal) */}
      <TableSelectionModal
        isOpen={isNewOrderTableModalOpen}
        onClose={onNewOrderTableModalClose}
        tables={tables}
        onSelectTable={handleSelectNewOrderTable}
        currentSelectedTableId={tempNewOrderTableId} // Pass the temp table ID
        allowTakeaway={true} // Allow takeaway option
      />
    </Flex>
  );
}