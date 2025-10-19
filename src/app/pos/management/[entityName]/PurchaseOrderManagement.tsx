// src/app/pos/management/[entityName]/PurchaseOrderManagement.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  useDisclosure,
  Flex,
  useToast,
  Badge,
  Text,
  VStack,
  HStack,
  Icon,
  InputGroup,
  InputLeftElement,
  Input,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react";
import {
  FaPlus,
  FaFileInvoice,
  FaBoxOpen,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  getPurchaseOrders,
  getGoodsReceipts,
  getSuppliers,
  getSites,
} from "@/lib/api";
import PurchaseOrderModal from "./PurchaseOrderComponents/PurchaseOrderModal";
import PurchaseOrderTable from "./PurchaseOrderComponents/PurchaseOrderTable";
import GoodsReceiptModal from "./PurchaseOrderComponents/GoodsReceiptModal";

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  site_id: string;
  status: string;
  order_date: string;
  expected_delivery_date: string;
  total_amount: number;
  ordered_by: string;
  notes: string;
  supplier_name?: string;
  site_name?: string;
  items?: any[];
  created_at?: string;
  updated_at?: string;
}

interface GoodsReceipt {
  id: string;
  receipt_number: string;
  purchase_order_id: string;
  receipt_date: string;
  received_by: string;
  receiving_bin_id: string;
  notes: string;
  status: string;
}

export default function PurchaseOrderManagement() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isReceiptOpen,
    onOpen: onReceiptOpen,
    onClose: onReceiptClose,
  } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [orders, receipts, supplierList, siteList] = await Promise.all([
        getPurchaseOrders(),
        getGoodsReceipts(),
        getSuppliers(),
        getSites(),
      ]);

      // Enrich orders with supplier and site names
      const enrichedOrders = orders.map((order) => ({
        ...order,
        supplier_name:
          supplierList.find((s) => s.id === order.supplier_id)?.name ||
          "Unknown",
        site_name:
          siteList.find((s) => s.id === order.site_id)?.name || "Unknown",
      }));

      setPurchaseOrders(enrichedOrders);
      setGoodsReceipts(receipts);
      setSuppliers(supplierList);
      setSites(siteList);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to fetch purchase orders and related data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    onOpen();
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    onOpen();
  };

  const handleCreateReceipt = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    onReceiptOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "gray";
      case "pending-approval":
        return "orange";
      case "approved":
        return "blue";
      case "ordered":
        return "purple";
      case "partially-received":
        return "yellow";
      case "received":
        return "green";
      case "cancelled":
        return "red";
      case "completed":
        return "teal";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return FaFileInvoice;
      case "pending-approval":
        return FaClock;
      case "approved":
        return FaCheckCircle;
      case "ordered":
        return FaFileInvoice;
      case "partially-received":
        return FaExclamationTriangle;
      case "received":
        return FaBoxOpen;
      case "completed":
        return FaCheckCircle;
      case "cancelled":
        return FaExclamationTriangle;
      default:
        return FaFileInvoice;
    }
  };

  const getStatusCount = (status: string) => {
    return purchaseOrders.filter((order) => order.status === status).length;
  };

  const getTotalValue = (status: string) => {
    return purchaseOrders
      .filter((order) => order.status === status)
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
  };

  const filteredOrders = purchaseOrders.filter((order) => {
    // Filter by tab
    let statusMatch = false;
    switch (activeTab) {
      case 0: // All
        statusMatch = true;
        break;
      case 1: // Draft
        statusMatch = order.status === "draft";
        break;
      case 2: // Pending Approval
        statusMatch = order.status === "pending-approval";
        break;
      case 3: // Approved
        statusMatch = order.status === "approved";
        break;
      case 4: // Ordered
        statusMatch = order.status === "ordered";
        break;
      case 5: // Receiving
        statusMatch = ["partially-received", "received"].includes(order.status);
        break;
      case 6: // Completed
        statusMatch = order.status === "completed";
        break;
      case 7: // Cancelled
        statusMatch = order.status === "cancelled";
        break;
      default:
        statusMatch = true;
    }

    // Filter by search term
    const searchMatch =
      searchTerm === "" ||
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.site_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Calculate statistics
  const stats = {
    totalOrders: purchaseOrders.length,
    totalValue: purchaseOrders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    ),
    pendingApproval: getStatusCount("pending-approval"),
    ordered: getStatusCount("ordered"),
    receiving:
      getStatusCount("partially-received") + getStatusCount("received"),
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Text>Loading purchase orders...</Text>
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">
          Purchase Order Management
        </Heading>
        <Button
          leftIcon={<FaPlus />}
          colorScheme="blue"
          onClick={handleCreateOrder}
        >
          New Purchase Order
        </Button>
      </Flex>

      {/* Statistics Overview */}
      <SimpleGrid columns={4} spacing={4} mb={6}>
        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Total Orders</StatLabel>
          <StatNumber>{stats.totalOrders}</StatNumber>
          <StatHelpText>All purchase orders</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Total Value</StatLabel>
          <StatNumber>R{stats.totalValue.toFixed(2)}</StatNumber>
          <StatHelpText>Combined order value</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>Pending Approval</StatLabel>
          <StatNumber color="orange.500">{stats.pendingApproval}</StatNumber>
          <StatHelpText>Awaiting approval</StatHelpText>
        </Stat>

        <Stat bg="white" p={4} borderRadius="md" shadow="sm">
          <StatLabel>In Transit</StatLabel>
          <StatNumber color="purple.500">{stats.ordered}</StatNumber>
          <StatHelpText>Orders in transit</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Card mb={4}>
        <CardBody>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search by PO number, supplier, or site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </CardBody>
      </Card>

      <Tabs variant="enclosed" onChange={setActiveTab}>
        <TabList>
          <Tab>
            <HStack>
              <Icon as={FaFileInvoice} />
              <Text>All Orders</Text>
              <Badge colorScheme="blue">{purchaseOrders.length}</Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={getStatusIcon("draft")} />
              <Text>Draft</Text>
              <Badge colorScheme={getStatusColor("draft")}>
                {getStatusCount("draft")}
              </Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={getStatusIcon("pending-approval")} color="orange.500" />
              <Text>Pending Approval</Text>
              <Badge colorScheme={getStatusColor("pending-approval")}>
                {getStatusCount("pending-approval")}
              </Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={getStatusIcon("approved")} color="blue.500" />
              <Text>Approved</Text>
              <Badge colorScheme={getStatusColor("approved")}>
                {getStatusCount("approved")}
              </Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={getStatusIcon("ordered")} color="purple.500" />
              <Text>Ordered</Text>
              <Badge colorScheme={getStatusColor("ordered")}>
                {getStatusCount("ordered")}
              </Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon
                as={getStatusIcon("partially-received")}
                color="yellow.500"
              />
              <Text>Receiving</Text>
              <Badge colorScheme={getStatusColor("partially-received")}>
                {getStatusCount("partially-received") +
                  getStatusCount("received")}
              </Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={getStatusIcon("completed")} color="teal.500" />
              <Text>Completed</Text>
              <Badge colorScheme={getStatusColor("completed")}>
                {getStatusCount("completed")}
              </Badge>
            </HStack>
          </Tab>
          <Tab>
            <HStack>
              <Icon as={getStatusIcon("cancelled")} color="red.500" />
              <Text>Cancelled</Text>
              <Badge colorScheme={getStatusColor("cancelled")}>
                {getStatusCount("cancelled")}
              </Badge>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((tabIndex) => (
            <TabPanel key={tabIndex} p={0} pt={4}>
              <PurchaseOrderTable
                orders={filteredOrders}
                onEdit={handleEditOrder}
                onCreateReceipt={handleCreateReceipt}
                onRefresh={fetchData}
                isLoading={isLoading}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      <PurchaseOrderModal
        isOpen={isOpen}
        onClose={onClose}
        order={selectedOrder}
        suppliers={suppliers}
        onSave={fetchData}
      />

      <GoodsReceiptModal
        isOpen={isReceiptOpen}
        onClose={onReceiptClose}
        order={selectedOrder}
        onSave={fetchData}
      />
    </Box>
  );
}
