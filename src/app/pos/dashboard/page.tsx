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
import dynamic from "next/dynamic";

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
  FaPlus,
} from "react-icons/fa";
import MenuCategoryFilter from "../components/MenuCategoryFilter";
import MenuItemList from "../components/MenuItemList";
import TableSelectionModal from "../components/TableSelectionModal";
import PaymentModal from "../components/PaymentModal";
import { usePOSStore } from "../lib/usePOSStore";
import { Food, Category, Table, Order, OrderItem } from "@/app/config/entities";
import { fetchData } from "@/app/lib/api";

import OrderManagementView from "../components/OrderManagementView";
import KitchenDisplayView from "../components/KitchenDisplayView";
import ServerView from "../components/ServerView";
import CurrentOrderDetailsModal from "../components/CurrentOrderDetailsModal";
import NewOrderMenuModal from "../components/NewOrderMenuModal";

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
    updateOrder: updateOrderInStore, // Renamed to avoid collision with local function
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
    isOpen: isTableModalOpen,
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
        const [fetchedFoods, fetchedCategories, fetchedTables, fetchedOrders] =
          await Promise.all([
            fetchData("foods"),
            fetchData("categories"),
            fetchData("tables"),
            fetchData("orders"),
          ]);

        console.log("--- Data Fetched from API (sample.ts) ---");
        console.log("Fetched Foods (Menu Items):", fetchedFoods);
        console.log("Fetched Categories:", fetchedCategories);
        console.log("Fetched Tables:", fetchedTables);
        console.log("Fetched Orders:", fetchedOrders);
        console.log("------------------------------------------");

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

  // Modified updateOrder function to only use the store's action
  const updateOrder = async (orderId: string, updatedOrder: Partial<Order>) => {
    try {
      await fetchData("orders", orderId, updatedOrder, "PUT");
      console.log(
        `LOG: API call to update order #${orderId} with data:`,
        updatedOrder
      );

      // Now, only use the store's action to update state
      updateOrderInStore(orderId, updatedOrder);
      console.log(`LOG: Order #${orderId} updated in store.`);

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

  const handleCheckout = async (paymentMethod: "cash" | "card" | "split") => {
    try {
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

      const orderToSubmit: Order = {
        ...currentOrder,
        id: currentOrder.id || `order-${Date.now()}`,
        status: "paid",
        employee_id: currentOrder.employee_id || "emp-101",
        created_at: currentOrder.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_type: currentOrder.table_id ? "dine-in" : "takeaway",
        items: (currentOrder.items ?? []).map((item) => ({
          ...item,
          food_id: item.food_id,
          name: item.name,
          price: item.price,
          sub_total: item.sub_total,
          notes: item.notes,
          price_at_sale: item.price_at_sale || item.price,
        })),
      } as Order;

      await processOrderPayment(orderToSubmit, paymentMethod);
      console.log(
        `LOG: Payment processed for order #${orderToSubmit.id} via ${paymentMethod}.`
      );

      if (!currentOrder.id) {
        const newOrder = await fetchData(
          "orders",
          undefined,
          orderToSubmit,
          "POST"
        );
        addOrder(newOrder);
        console.log("LOG: New order added via API:", newOrder);
      } else {
        await fetchData("orders", currentOrder.id, orderToSubmit, "PUT");
        updateOrderInStore(currentOrder.id, orderToSubmit);
        console.log("LOG: Existing order updated via API:", orderToSubmit);
      }

      clearCurrentOrder();
      onPaymentModalClose();
      onCurrentOrderDetailsModalClose();

      toast({
        title: "Order Placed & Paid",
        description: `Order #${orderToSubmit.id} processed successfully via ${paymentMethod}.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

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

  const handleSendToKitchen = async () => {
    try {
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

      const orderToSubmit: Order = {
        ...currentOrder,
        id: currentOrder.id || `order-${Date.now()}`,
        status: "preparing",
        employee_id: currentOrder.employee_id || "emp-101",
        created_at: currentOrder.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_type: currentOrder.table_id ? "dine-in" : "takeaway",
        items: (currentOrder.items ?? []).map((item) => ({
          ...item,
          food_id: item.food_id,
          name: item.name,
          price: item.price,
          sub_total: item.sub_total,
          notes: item.notes,
          price_at_sale: item.price_at_sale || item.price,
        })),
      } as Order;

      if (!currentOrder.id) {
        const newOrder = await fetchData(
          "orders",
          undefined,
          orderToSubmit,
          "POST"
        );
        addOrder(newOrder);
        console.log("LOG: New order sent to kitchen via API:", newOrder);
      } else {
        await fetchData("orders", currentOrder.id, orderToSubmit, "PUT");
        updateOrderInStore(currentOrder.id, orderToSubmit);
        console.log(
          "LOG: Existing order sent to kitchen via API:",
          orderToSubmit
        );
      }

      clearCurrentOrder();
      onCurrentOrderDetailsModalClose();
      toast({
        title: "Order Sent to Kitchen",
        description: `Order #${orderToSubmit.id} is now being prepared.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

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

  const handleTrackOrderClick = () => {
    onTrackOrderModalOpen();
    console.log("LOG: Track Order modal opened.");
  };

  const handleStartNewOrder = () => {
    setTempNewOrderItems([]);
    setTempNewOrderTableId(null);
    onNewOrderMenuModalOpen();
  };

  const handleFinishAddingItems = (items: OrderItem[]) => {
    setTempNewOrderItems(items);
    onNewOrderMenuModalClose();
    if (items.length > 0) {
      onNewOrderTableModalOpen();
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

    let storeId = 'default-store';
    if (currentStaff?.storeId) {
      storeId = currentStaff.storeId;
    } else if (tableId) {
      const table = tables.find(t => t.id === tableId);
      if (table && table.store_id) {
        storeId = table.store_id;
      }
    }

    const newOrder: Order = {
      id: "",
      store_id: storeId,
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
    <Flex
      direction="column"
      h="100vh"
      bg="var(--light-gray-bg)"
      position="relative"
    >
      <Tabs
        variant="enclosed"
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
              color: "var(--primary-green)",
              borderColor: "var(--primary-green)",
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
              color: "var(--primary-green)",
              borderColor: "var(--primary-green)",
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
              color: "var(--primary-green)",
              borderColor: "var(--primary-green)",
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
              color: "var(--primary-green)",
              borderColor: "var(--primary-green)",
              borderBottom: "none",
            }}
            fontSize="lg"
            fontWeight="semibold"
            color="var(--dark-gray-text)"
          >
            <Icon as={FaBell} mr={2} /> Server View
          </Tab>
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
          <TabPanel h="100%" p={0}>
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
                  <Box w="full">
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
                          onClick={() => {
                            if (
                              table.status === "occupied" &&
                              table.current_order_id
                            ) {
                              const orderToLoad = activeOrders.find(
                                (order) => order.id === table.current_order_id
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
                  </Box>

                  <Box mt={6} w="full">
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
                        View All ({activeOrders.length})
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
                      <SimpleGrid
                        columns={{ base: 1, md: 2, lg: 2 }}
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
                            {order.created_at && (
                              <Text
                                fontSize="xs"
                                color="var(--medium-gray-text)"
                                mt={1}
                              >
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
                </VStack>
              </Box>

              <Box
                flex="1"
                bg="var(--background-color-light)"
                p={6}
                rounded="lg"
                shadow="md"
                overflowY="auto"
                display="none"
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
                    View All ({activeOrders.length})
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
                          usePOSStore.setState({ currentOrder: order });
                          onCurrentOrderDetailsModalOpen();
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
                        {order.created_at && (
                          <Text
                            fontSize="xs"
                            color="var(--medium-gray-text)"
                            mt={1}
                          >
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
                  </VStack>
                )}
              </Box>
            </Flex>
          </TabPanel>

          <TabPanel h="100%" p={0}>
            <OrderManagementView
              orders={activeOrders}
              tables={tables}
              updateOrder={updateOrder}
              onLoadOrder={(order) => {
                usePOSStore.setState({ currentOrder: order });
                onCurrentOrderDetailsModalOpen();
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

          <TabPanel h="100%" p={0}>
            <KitchenDisplayView
              orders={activeOrders}
              tables={tables}
              updateOrder={updateOrder}
            />
          </TabPanel>

          <TabPanel h="100%" p={0}>
            <ServerView
              orders={activeOrders}
              tables={tables}
              updateOrder={updateOrder}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

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
      {activeOrders.length > 0 && (
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
            {activeOrders.length}
          </Badge>
        </Button>
      )}
      <TableSelectionModal
        isOpen={isTableModalOpen}
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
      <CurrentOrderDetailsModal
        isOpen={isCurrentOrderDetailsModalOpen}
        onClose={onCurrentOrderDetailsModalClose}
        currentOrder={currentOrder}
        onRemoveItem={removeOrderItem}
        onUpdateQuantity={updateOrderItemQuantity}
        onAddNotes={onNotesModalOpen}
        onApplyDiscount={onDiscountModalOpen}
        onSelectTable={onTableModalOpen}
        onSendToKitchen={handleSendToKitchen}
        onCheckout={handleCheckout}
        onClearOrder={clearCurrentOrder}
        tables={tables}
        updateOrder={updateOrder}
      />
      <NewOrderMenuModal
        isOpen={isNewOrderMenuModalOpen}
        onClose={onNewOrderMenuModalClose}
        menuItems={menuItems}
        categories={categories}
        onFinishAddingItems={handleFinishAddingItems}
      />
      <TableSelectionModal
        isOpen={isNewOrderTableModalOpen}
        onClose={onNewOrderTableModalClose}
        tables={tables}
        onSelectTable={handleSelectNewOrderTable}
        currentSelectedTableId={tempNewOrderTableId}
        allowTakeaway={true}
      />
    </Flex>
  );
}