// src/app/pos/management/[entityName]/PurchaseOrderComponents/PurchaseOrderTable.tsx
"use client";

import React from "react";
import {
    Badge,
    Button,
    HStack,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
} from "@chakra-ui/react";
import { FaEllipsisV, FaEye, FaEdit, FaBoxOpen, FaFileDownload } from "react-icons/fa";
import DataTable from "@/components/DataTable";

interface PurchaseOrderTableProps {
    orders: any[];
    onEdit: (order: any) => void;
    onCreateReceipt: (order: any) => void;
    onRefresh: () => void;
    isLoading: boolean;
}

export default function PurchaseOrderTable({
    orders,
    onEdit,
    onCreateReceipt,
    onRefresh,
    isLoading,
}: PurchaseOrderTableProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'gray';
            case 'pending-approval': return 'orange';
            case 'approved': return 'blue';
            case 'ordered': return 'purple';
            case 'partially-received': return 'yellow';
            case 'received': return 'green';
            case 'cancelled': return 'red';
            case 'completed': return 'teal';
            default: return 'gray';
        }
    };

    const canCreateReceipt = (order: any) => {
        return ['approved', 'ordered', 'partially-received'].includes(order.status);
    };

    const columns = [
        {
            accessorKey: "po_number",
            header: "PO Number",
            isSortable: true,
        },
        {
            accessorKey: "supplier_name",
            header: "Supplier",
            isSortable: true,
        },
        {
            accessorKey: "site_name",
            header: "Site",
            isSortable: true,
        },
        {
            accessorKey: "order_date",
            header: "Order Date",
            isSortable: true,
            cell: (row: any) => new Date(row.order_date).toLocaleDateString(),
        },
        {
            accessorKey: "expected_delivery_date",
            header: "Expected Delivery",
            isSortable: true,
            cell: (row: any) =>
                row.expected_delivery_date
                    ? new Date(row.expected_delivery_date).toLocaleDateString()
                    : 'Not set',
        },
        {
            accessorKey: "total_amount",
            header: "Total Amount",
            isSortable: true,
            cell: (row: any) => `R${row.total_amount?.toFixed(2) || '0.00'}`,
        },
        {
            accessorKey: "status",
            header: "Status",
            isSortable: true,
            cell: (row: any) => (
                <Badge colorScheme={getStatusColor(row.status)}>
                    {row.status.replace('-', ' ').toUpperCase()}
                </Badge>
            ),
        },
        {
            accessorKey: "actions",
            header: "Actions",
            cell: (row: any) => (
                <HStack spacing={2}>
                    <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => onEdit(row)}
                        leftIcon={<FaEye />}
                    >
                        View
                    </Button>

                    {canCreateReceipt(row) && (
                        <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => onCreateReceipt(row)}
                            leftIcon={<FaBoxOpen />}
                        >
                            Receive
                        </Button>
                    )}

                    <Menu>
                        <MenuButton
                            as={IconButton}
                            icon={<FaEllipsisV />}
                            size="sm"
                            variant="ghost"
                        />
                        <MenuList>
                            <MenuItem icon={<FaEdit />} onClick={() => onEdit(row)}>
                                Edit
                            </MenuItem>
                            <MenuItem icon={<FaFileDownload />}>
                                Export PDF
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>
            ),
        },
    ];

    return <DataTable columns={columns} data={orders} />;
}