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
} from "@chakra-ui/react";
import { FaPlus, FaShoppingCart, FaClipboardList } from "react-icons/fa";
import { usePOSStore } from "../../lib/usePOSStore";
import { Order, Table } from "@/lib/config/entities";
import { fetchData } from "@/lib/api";
import EditOrderModal from "../../components/pos/EditOrderModal";
import NewOrderMenuModal from "../../components/pos/NewOrderMenuModal";
import TableSelectionModal from "../../components/pos/TableSelectionModal";
import TableActionModal from "../../components/pos/TableActionModal";

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
        removeOrder,
    } = usePOSStore();

    // Local state for UI and data fetching status
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);

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
    const [tempNewOrderItems, setTempNewOrderItems] = useState<any[]>([]);
    const [tempNewOrderTableId, setTempNewOrderTableId] = useState<string | null>(
        null
    );

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

    // Function to update table status
    const updateTable = async (tableId: string, updates: Partial<Table>) => {
        try {
            await fetchData("tables", tableId, updates, "PUT");

            // Update the table in the store
            setTables(tables.map(table =>
                table.id === tableId ? { ...table, ...updates } : table
            ));

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
                    current_order_id: null
                });
            }

            // Now, only use the store's action to update state
            updateOrderInStore(orderId, updatedOrder);

            // If order is completed (served, paid, or cancelled), remove it from active orders
            if (updatedOrder.status === "served" ||
                updatedOrder.status === "paid" ||
                updatedOrder.status === "cancelled") {
                setActiveOrders(activeOrders.filter(order => order.id !== orderId));
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
            const subtotal = data.items.reduce((sum, item) => sum + (item.sub_total || 0), 0);
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
                        current_order_id: null
                    });
                }

                // Occupy the new table if one is selected
                if (data.tableId) {
                    await updateTable(data.tableId, {
                        status: "occupied",
                        current_order_id: editingOrder.id
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
            const orderToUpdate = activeOrders.find(order => order.id === orderId) || editingOrder;
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
                description: error.message || "There was an error updating the order status",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleStartNewOrder = () => {
        setTempNewOrderItems([]);
        setTempNewOrderTableId(null);
        onNewOrderMenuModalOpen();
    };

    const handleFinishAddingItems = (items: any[]) => {
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

    const handleSelectNewOrderTable = async (tableId: string | null) => {
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

        // Generate a temporary order ID (will be replaced by server)
        const tempOrderId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const newOrder: Order = {
            id: tempOrderId,
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

        // If a table is selected, mark it as occupied
        if (tableId) {
            try {
                await updateTable(tableId, {
                    status: "occupied",
                    current_order_id: tempOrderId
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to update table status. Order was not created.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                return; // Don't proceed with order creation
            }
        }

        // Add the order to the store
        addOrder(newOrder);
        setActiveOrders([...activeOrders, newOrder]);
        setCurrentOrder(newOrder);
        setEditingOrder(newOrder);
        onCurrentOrderDetailsModalOpen();
        toast({
            title: "New Order Created",
            description: "Order is ready for review and sending to kitchen.",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
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
            current_order_id: null
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
        const orderToLoad = activeOrders.find(order => order.id === orderId);
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

                        <Tabs isFitted variant="enclosed" colorScheme="green">
                            <TabList mb="1em">
                                <Tab fontWeight="semibold">Restaurant Tables</Tab>
                                <Tab fontWeight="semibold">Live Orders</Tab>
                            </TabList>
                            <TabPanels>
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
                                                        {tables.find((t) => t.id === order.table_id)?.name ||
                                                            "Takeaway"}
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
                                                        {(order.status === "new" || order.status === "preparing") && (
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

            {/* Floating action buttons 
            <Button
                onClick={() => {
                    if (currentOrder.id) {
                        handleEditOrder(currentOrder);
                    } else {
                        toast({
                            title: "No Active Order",
                            description: "Please create an order first.",
                            status: "info",
                            duration: 3000,
                            isClosable: true,
                        });
                    }
                }}
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
                position="fixed"
                bottom="20px"
                right="20px"
                bg="var(--primary-green)"
                color="white"
                zIndex={10}
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
                    onClick={() => {
                        toast({
                            title: "View All Orders",
                            description: "This feature is coming soon!",
                            status: "info",
                            duration: 3000,
                            isClosable: true,
                        });
                    }}
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
                    position="fixed"
                    bottom="20px"
                    right="90px"
                    bg="blue.500"
                    color="white"
                    zIndex={10}
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
                */}

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