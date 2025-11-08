// src/app/pos/server/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    Flex,
    Spinner,
    Alert,
    // FIX: Import Alert sub-components
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Text,
    Center
} from "@chakra-ui/react";
import ServerView from "../../../components/pos/ServerView";
import { usePOSStore } from "../../../lib/usePOSStore";
import { fetchData } from "@/lib/api";
import { Order, Table } from "@/lib/config/entities";
import { useRouter } from "next/navigation";

export default function ServerPage() {
    const {
        activeOrders,
        tables,
        setActiveOrders,
        setTables,
        setMenuItems,
        setCategories,
        currentStaff,
        _hasHydrated,
    } = usePOSStore();

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!_hasHydrated) return;

        const userRole = currentStaff?.mainAccessRole?.name?.toLowerCase();
        const allowedRoles = ['admin', 'manager', 'server', 'waiter'];

        if (!userRole || !allowedRoles.some(role => userRole.includes(role))) {
            router.replace(currentStaff?.mainAccessRole?.landing_page || '/pos/login');
            return;
        }

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

                const readyForServer = (fetchedOrders || []).filter(
                    (order: Order) =>
                        order.status === "ready"
                );
                setActiveOrders(readyForServer);
                setTables(fetchedTables || []);
                setMenuItems(fetchedFoods || []);
                setCategories(fetchedCategories || []);
            } catch (err: any) {
                setError(err.message || "Failed to load server data.");
                console.error("Error loading server data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [_hasHydrated, currentStaff, router, setActiveOrders, setTables, setMenuItems, setCategories]);

    const updateOrder = async (orderId: string, updatedOrder: Partial<Order>) => {
        try {
            await fetchData("orders", orderId, updatedOrder, "PUT");
            usePOSStore.setState((state) => ({
                activeOrders: state.activeOrders.map((o) =>
                    o.id === orderId ? { ...o, ...updatedOrder } : o
                ),
            }));
        } catch (error: any) {
            console.error(`ERROR: Error updating order #${orderId}:`, error);
        }
    };

    if (loading) {
        return (
            <Center minH="calc(100vh - 80px)">
                <Spinner size="xl" color="var(--primary-green)" />
                <Text ml={4} fontSize="xl" color="var(--dark-gray-text)">
                    Loading server view...
                </Text>
            </Center>
        );
    }

    if (error) {
        return (
            <Alert status="error" variant="left-accent" m={4}>
                <AlertIcon />
                <AlertTitle>Error Loading Server Data!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <Flex direction="column" h="100vh" p={4} bg="var(--light-gray-bg)">
            <ServerView orders={activeOrders} tables={tables} updateOrder={updateOrder} />
        </Flex>
    );
}
