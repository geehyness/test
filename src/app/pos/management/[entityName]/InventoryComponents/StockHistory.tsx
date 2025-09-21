// src/app/pos/management/[entityName]/InventoryComponents/StockHistory.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Heading,
    Text,
    useToast,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    HStack,
    Badge,
} from "@chakra-ui/react";
import { SearchIcon, CalendarIcon } from "@chakra-ui/icons";
import { fetchData } from "@/lib/api";
import DataTable from "@/components/DataTable";

interface StockHistoryEntry {
    id: string;
    product_id: string;
    product_name: string;
    change: number;
    previous_stock: number;
    new_stock: number;
    reason: string;
    adjusted_by: string;
    adjusted_at: string;
}

export default function StockHistory() {
    const [history, setHistory] = useState<StockHistoryEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const toast = useToast();

    useEffect(() => {
        fetchStockHistory();
    }, []);

    const fetchStockHistory = async () => {
        try {
            // In a real app, you would fetch from a dedicated stock history endpoint
            // For now, we'll simulate with mock data
            const mockHistory: StockHistoryEntry[] = [
                {
                    id: "1",
                    product_id: "prod1",
                    product_name: "Tomato Sauce",
                    change: 50,
                    previous_stock: 20,
                    new_stock: 70,
                    reason: "Restock",
                    adjusted_by: "Manager",
                    adjusted_at: "2023-10-15T10:30:00Z"
                },
                {
                    id: "2",
                    product_id: "prod2",
                    product_name: "Pasta",
                    change: -10,
                    previous_stock: 100,
                    new_stock: 90,
                    reason: "Order #1234",
                    adjusted_by: "System",
                    adjusted_at: "2023-10-14T15:45:00Z"
                },
            ];

            setHistory(mockHistory);
        } catch (error) {
            toast({
                title: "Error loading stock history",
                description: "Failed to fetch stock history data",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const columns = [
        {
            accessorKey: "product_name",
            header: "Product",
            isSortable: true,
        },
        {
            accessorKey: "change",
            header: "Change",
            isSortable: true,
            cell: (row: StockHistoryEntry) => (
                <Badge colorScheme={row.change > 0 ? "green" : "red"}>
                    {row.change > 0 ? "+" : ""}{row.change}
                </Badge>
            ),
        },
        {
            accessorKey: "previous_stock",
            header: "Previous Stock",
            isSortable: true,
        },
        {
            accessorKey: "new_stock",
            header: "New Stock",
            isSortable: true,
        },
        {
            accessorKey: "reason",
            header: "Reason",
            isSortable: true,
        },
        {
            accessorKey: "adjusted_by",
            header: "Adjusted By",
            isSortable: true,
        },
        {
            accessorKey: "adjusted_at",
            header: "Date",
            isSortable: true,
            cell: (row: StockHistoryEntry) => new Date(row.adjusted_at).toLocaleDateString(),
        },
    ];

    return (
        <Box>
            <Heading size="md" mb={4}>Stock Adjustment History</Heading>

            <Flex mb={4} direction={{ base: "column", md: "row" }} gap={4}>
                <InputGroup maxW="300px">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </InputGroup>

                <Select
                    placeholder="Filter by date"
                    maxW="200px"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                </Select>
            </Flex>

            <DataTable columns={columns} data={history} />
        </Box>
    );
}