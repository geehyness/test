// src/app/pos/kitchen/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    Flex,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Text,
} from "@chakra-ui/react";
import KitchenDisplayView from "../components/KitchenDisplayView";
import { usePOSStore } from "../lib/usePOSStore";
import { fetchData } from "@/app/lib/api";
import { Order } from "@/app/config/entities";

export default function KitchenPage() {
    const {
        activeOrders,
        tables,
        setActiveOrders,
        setTables,
        setMenuItems,
        setCategories,
    } = usePOSStore();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to update an order, now correctly placed in the page component
    const updateOrder = async (orderId: string, updatedOrder: Partial<Order>) => {
        try {
            await fetchData("orders", orderId, updatedOrder, "PUT");
            console.log(
                `LOG: API call to update order #${orderId} with data:`,
                updatedOrder
            );

            // Update the order in the Zustand store
            usePOSStore.setState((state) => ({
                activeOrders: state.activeOrders.map((o) =>
                    o.id === orderId ? { ...o, ...updatedOrder } : o
                ),
            }));
            console.log(`LOG: Order #${orderId} updated in store.`);
        } catch (error: any) {
            console.error(`ERROR: Error updating order #${orderId}:`, error);
            // You might want to add a toast message here as well
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [fetchedOrders, fetchedTables, fetchedFoods, fetchedCategories] =
                    await Promise.all([
                        fetchData("orders"),
                        fetchData("tables"),
                        fetchData("foods"),
                        fetchData("categories"),
                    ]);

                const active = (fetchedOrders || []).filter(
                    (order: Order) =>
                        order.status !== "paid" &&
                        order.status !== "cancelled" &&
                        order.status !== "served"
                );
                setActiveOrders(active);
                setTables(fetchedTables || []);
                setMenuItems(fetchedFoods || []);
                setCategories(fetchedCategories || []);
            } catch (err: any) {
                setError(err.message || "Failed to load kitchen data.");
                console.error("Error loading kitchen data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [setActiveOrders, setTables, setMenuItems, setCategories]);

    if (loading) {
        return (
            <Flex justify="center" align="center" minH="calc(100vh - 80px)">
                <Spinner size="xl" color="var(--primary-green)" />
                <Text ml={4} fontSize="xl" color="var(--dark-gray-text)">
                    Loading kitchen view...
                </Text>
            </Flex>
        );
    }

    if (error) {
        return (
            <Alert status="error" variant="left-accent" m={4}>
                <AlertIcon />
                <AlertTitle>Error Loading Kitchen Data!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <Flex direction="column" h="100vh" p={4} bg="var(--light-gray-bg)">
            <KitchenDisplayView
                orders={activeOrders}
                tables={tables}
                updateOrder={updateOrder}
            />
        </Flex>
    );
}