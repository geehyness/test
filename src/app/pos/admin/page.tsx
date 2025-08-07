// src/app/pos/admin/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    Box,
    Heading,
    Text,
    VStack,
    SimpleGrid,
    Spinner,
    Center,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Card,
    CardHeader,
    CardBody,
    HStack,
    Button,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { usePOSStore } from "../lib/usePOSStore";
import { fetchData } from "@/app/lib/api";
import { Order, Food, OrderItem } from "@/app/config/entities";
import Link from 'next/link';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
} from "recharts";

interface Statistics {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    mostPopularItems: { name: string; quantity: number }[];
    salesByDate: { date: string; total: number }[];
}

const StatCard = ({ label, value, helpText }: { label: string; value: string | number; helpText?: string }) => (
    <Card bg="white" rounded="lg" shadow="sm">
        <CardHeader pb={0}>
            <Stat>
                <StatLabel fontSize="md" color="var(--medium-gray-text)">{label}</StatLabel>
                <StatNumber fontSize="3xl" color="var(--dark-gray-text)">{value}</StatNumber>
                {helpText && (
                    <StatHelpText mt={2} color="var(--medium-gray-text)">{helpText}</StatHelpText>
                )}
            </Stat>
        </CardHeader>
    </Card>
);

export default function AdminDashboardPage() {
    const router = useRouter();
    const { currentStaff, _hasHydrated } = usePOSStore();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [foods, setFoods] = useState<Food[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!_hasHydrated) {
            setLoading(true);
            return;
        }

        if (!currentStaff || currentStaff.mainAccessRole?.name.toLowerCase() !== 'admin') {
            const redirectPath = currentStaff?.mainAccessRole?.name
                ? `/pos/${currentStaff.mainAccessRole.name.toLowerCase()}`
                : '/pos/login';
            router.replace(redirectPath);
            return;
        }
        setLoading(false);

        const fetchDashboardData = async () => {
            setLoadingData(true);
            if (currentStaff) {
                try {
                    // Corrected: Use currentStaff.storeId to fetch data
                    const storeId = currentStaff.storeId;
                    if (storeId) {
                        const fetchedOrders = (await fetchData('orders', storeId)) as Order[];
                        const fetchedFoods = (await fetchData('foods', storeId)) as Food[];

                        setOrders(fetchedOrders);
                        setFoods(fetchedFoods);
                    }
                } catch (error) {
                    console.error("Failed to fetch dashboard data:", error);
                } finally {
                    setLoadingData(false);
                }
            }
        };

        fetchDashboardData();
    }, [_hasHydrated, currentStaff, router]);

    const stats: Statistics = useMemo(() => {
        if (!orders || orders.length === 0) {
            return {
                totalRevenue: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                mostPopularItems: [],
                salesByDate: [],
            };
        }

        const paidOrders = orders.filter(order => order.payment_status === 'paid');

        const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0);
        const totalOrders = paidOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const itemQuantities: { [foodId: string]: number } = {};
        paidOrders.forEach(order => {
            order.items.forEach((item: OrderItem) => {
                itemQuantities[item.food_id] = (itemQuantities[item.food_id] || 0) + item.quantity;
            });
        });

        const mostPopularItems = Object.entries(itemQuantities)
            .map(([foodId, quantity]) => {
                const foodItem = foods.find(food => food.id === foodId);
                return {
                    name: foodItem ? foodItem.name : `Unknown Item (${foodId})`,
                    quantity,
                };
            })
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const salesByDate: { [date: string]: number } = {};
        paidOrders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString('en-US');
            salesByDate[date] = (salesByDate[date] || 0) + order.total_amount;
        });

        const salesByDateArray = Object.entries(salesByDate)
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            mostPopularItems,
            salesByDate: salesByDateArray,
        };
    }, [orders, foods]);

    if (loading || loadingData) {
        return (
            <Center minH="100vh" bg="var(--light-gray-bg)">
                <Spinner
                    size="xl"
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="var(--primary-green)"
                />
            </Center>
        );
    }

    return (
        <Box p={6}>
            <Heading as="h1" size="xl" mb={6} color="var(--dark-gray-text)">
                Admin Dashboard
            </Heading>
            <Text fontSize="lg" mb={4} color="var(--medium-gray-text)">
                Welcome, {currentStaff?.first_name || "Admin"}! Here are your tenant&apos;s key metrics.
            </Text>

            <HStack spacing={4} mb={8}>
                <Link href="/pos/dashboard" passHref>
                    <Button colorScheme="teal" variant="outline">
                        POS Dashboard
                    </Button>
                </Link>
                <Link href="/pos/admin/reports" passHref>
                    <Button colorScheme="teal" variant="outline">
                        Unauthorised Access Reports
                    </Button>
                </Link>
                <Link href="/pos/management" passHref>
                    <Button colorScheme="teal" variant="outline">
                        Manage
                    </Button>
                </Link>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
                <StatCard
                    label="Total Revenue"
                    value={`$${stats.totalRevenue.toFixed(2)}`}
                    helpText={`from ${stats.totalOrders} paid orders`}
                />
                <StatCard
                    label="Total Orders"
                    value={stats.totalOrders}
                    helpText="Total number of completed orders"
                />
                <StatCard
                    label="Average Order Value"
                    value={`$${stats.averageOrderValue.toFixed(2)}`}
                    helpText="Average amount spent per order"
                />
                <StatCard
                    label="Top Selling Item"
                    value={stats.mostPopularItems[0]?.name || "N/A"}
                    helpText={`Sold ${stats.mostPopularItems[0]?.quantity || 0} times`}
                />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Card bg="white" rounded="lg" shadow="sm" p={4}>
                    <Heading as="h3" size="md" mb={4} color="var(--dark-gray-text)">
                        Sales Over Time
                    </Heading>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={stats.salesByDate}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="var(--primary-green)" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card bg="white" rounded="lg" shadow="sm" p={4}>
                    <Heading as="h3" size="md" mb={4} color="var(--dark-gray-text)">
                        Most Popular Items
                    </Heading>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={stats.mostPopularItems}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="quantity" fill="var(--primary-green)" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </SimpleGrid>
        </Box>
    );
}