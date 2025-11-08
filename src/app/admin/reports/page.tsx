// src/app/admin/reports/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Spinner,
  Center,
  // FIX: Import Card
  Card,
  CardHeader,
  CardBody,
  HStack,
  // FIX: Import Select
  Select,
  // FIX: Import Stat and its parts
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex
} from '@chakra-ui/react';
import { fetchData } from '@/lib/api';
import { Order, Tenant } from '@/lib/config/entities';

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
} from 'recharts';

interface AggregatedStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByDate: { date: string; total: number }[];
}

export default function GlobalReportsPage() {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Assuming your API can fetch all orders and tenants for an admin
        // This might require specific admin-level API endpoints
        const [orders, tenants] = await Promise.all([
          fetchData('orders', undefined, undefined, 'GET', { all: 'true' }), // Custom param for admin
          fetchData('tenants')
        ]);

        setAllOrders(orders || []);
        setAllTenants(tenants || []);
      } catch (error) {
        console.error("Failed to fetch global reports data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const stats: AggregatedStats = useMemo(() => {
    const ordersToProcess = selectedTenantId === 'all'
      ? allOrders
      : allOrders.filter(order => {
          // This assumes tenants have multiple stores and orders are linked to stores.
          const tenant = allTenants.find(t => t.id === selectedTenantId);
          // This logic might need adjustment based on your exact DB schema.
          // For now, let's assume a direct tenant_id on orders if possible, or we filter by store_id.
          // @ts-ignore
          return tenant && order.store_id && tenant.stores?.includes(order.store_id);
        });

    if (!ordersToProcess || ordersToProcess.length === 0) {
      return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, salesByDate: [] };
    }

    const paidOrders = ordersToProcess.filter(order => order.payment_status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = paidOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const salesByDate: { [date: string]: number } = {};
    paidOrders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('en-US');
      salesByDate[date] = (salesByDate[date] || 0) + order.total_amount;
    });
    const salesByDateArray = Object.entries(salesByDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { totalRevenue, totalOrders, averageOrderValue, salesByDate: salesByDateArray };
  }, [allOrders, allTenants, selectedTenantId]);

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Flex direction={{ base: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={6} gap={4}>
        <Heading as="h1" size="xl">
          Global Reports
        </Heading>
        <Select
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          maxW={{ base: '100%', md: '300px' }}
        >
          <option value="all">All Tenants</option>
          {allTenants.map(tenant => (
            <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
          ))}
        </Select>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
        <Card p={6} rounded="lg" shadow="md" bg="white">
          <CardBody>
            <Stat>
              <StatLabel>Total Revenue</StatLabel>
              <StatNumber>R {stats.totalRevenue.toFixed(2)}</StatNumber>
              <StatHelpText>from {stats.totalOrders} paid orders</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card p={6} rounded="lg" shadow="md" bg="white">
          <CardBody>
            <Stat>
              <StatLabel>Total Orders</StatLabel>
              <StatNumber>{stats.totalOrders}</StatNumber>
              <StatHelpText>Completed orders</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card p={6} rounded="lg" shadow="md" bg="white">
          <CardBody>
            <Stat>
              <StatLabel>Average Order Value</StatLabel>
              <StatNumber>R {stats.averageOrderValue.toFixed(2)}</StatNumber>
              <StatHelpText>Average per order</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg="white" rounded="lg" shadow="md" p={4}>
        <CardHeader>
          <Heading as="h3" size="md" color="var(--dark-gray-text)">
            Sales Over Time ({selectedTenantId === 'all' ? 'All Tenants' : allTenants.find(t=>t.id === selectedTenantId)?.name})
          </Heading>
        </CardHeader>
        <CardBody>
          <Box h="400px">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.salesByDate} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Revenue" stroke="var(--primary-green)" activeDot={{ r: 8 }} />
                  </LineChart>
              </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
}