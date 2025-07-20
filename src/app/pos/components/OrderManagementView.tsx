// src/app/pos/components/OrderManagementView.tsx
import React from 'react';
import { Box, Flex, VStack, Text, Button, Spacer, Badge, HStack, useToast, SimpleGrid } from '@chakra-ui/react';
import { Order, Table } from '@/app/config/entities';

interface OrderManagementViewProps {
  orders: Order[];
  tables: Table[];
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => Promise<void>;
  onLoadOrder: (order: Order) => void;
}

const OrderManagementView: React.FC<OrderManagementViewProps> = ({ orders, tables, updateOrder, onLoadOrder }) => {
  const toast = useToast();

  // Filter orders into different status bins
  const newOrders = orders.filter(order => order.status === 'new');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');
  const servedOrders = orders.filter(order => order.status === 'served'); // Include served for management overview

  const getTableNumber = (tableId?: string) => {
    return tables.find(t => t.id === tableId)?.name || 'Takeaway';
  };

  const handleStatusChange = async (order: Order, newStatus: 'preparing' | 'ready' | 'served' | 'cancelled') => {
    try {
      await updateOrder(order.id, { status: newStatus });
      toast({
        title: 'Order Status Updated',
        description: `Order #${order.id} moved to ${newStatus.toUpperCase()}.`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      console.log(`LOG: Order #${order.id} status changed to ${newStatus} in Order Management.`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error(`ERROR: Failed to update order #${order.id} status to ${newStatus}.`, error);
    }
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <Box p={4} borderWidth="1px" rounded="md" shadow="sm" bg="var(--background-color-light)" mb={3}>
      <Flex align="center" mb={2}>
        <Text fontWeight="bold" fontSize="md" color="var(--dark-gray-text)">Order #{order.id}</Text>
        <Spacer />
        <Badge colorScheme={
          order.status === 'new' ? 'purple' :
          order.status === 'preparing' ? 'orange' :
          order.status === 'ready' ? 'green' :
          order.status === 'served' ? 'blue' : 'gray'
        }>
          {order.status.toUpperCase()}
        </Badge>
      </Flex>
      <Text fontSize="sm" color="var(--medium-gray-text)">Table: {getTableNumber(order.table_id)}</Text>
      <Text fontSize="sm" color="var(--medium-gray-text)">Total: R {order.total_amount?.toFixed(2)}</Text>
      <Text fontSize="sm" color="var(--medium-gray-text)">Items: {(order.items ?? []).map(item => `${item.name} (x${item.quantity})`).join(', ')}</Text>
      {order.notes && <Text fontSize="xs" color="var(--medium-gray-text)" mt={1}>Notes: {order.notes}</Text>}

      <HStack mt={3} spacing={2} justifyContent="flex-end">
        <Button size="xs" colorScheme="blue" onClick={() => onLoadOrder(order)}>Load</Button>
        {order.status === 'new' && (
          <Button size="xs" colorScheme="orange" onClick={() => handleStatusChange(order, 'preparing')}>To Prep</Button>
        )}
        {order.status === 'preparing' && (
          <Button size="xs" colorScheme="green" onClick={() => handleStatusChange(order, 'ready')}>To Ready</Button>
        )}
        {order.status === 'ready' && (
          <Button size="xs" colorScheme="blue" onClick={() => handleStatusChange(order, 'served')}>To Served</Button>
        )}
        {(order.status === 'new' || order.status === 'preparing') && (
          <Button size="xs" colorScheme="red" onClick={() => handleStatusChange(order, 'cancelled')}>Cancel</Button>
        )}
      </HStack>
    </Box>
  );

  return (
    <Flex h="100%" p={4} bg="var(--light-gray-bg)" rounded="lg" shadow="md">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} width="100%">
        {/* New Orders Column */}
        <VStack align="stretch" spacing={4} bg="var(--background-color-light)" p={4} rounded="md" shadow="sm">
          <Text fontSize="lg" fontWeight="bold" color="var(--dark-gray-text)" borderBottom="2px solid var(--primary-orange)" pb={2}>
            New Orders ({newOrders.length})
          </Text>
          {newOrders.length === 0 ? (
            <Text color="var(--medium-gray-text)">No new orders.</Text>
          ) : (
            newOrders.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </VStack>

        {/* Preparing Orders Column */}
        <VStack align="stretch" spacing={4} bg="var(--background-color-light)" p={4} rounded="md" shadow="sm">
          <Text fontSize="lg" fontWeight="bold" color="var(--dark-gray-text)" borderBottom="2px solid var(--primary-orange)" pb={2}>
            Preparing ({preparingOrders.length})
          </Text>
          {preparingOrders.length === 0 ? (
            <Text color="var(--medium-gray-text)">No orders preparing.</Text>
          ) : (
            preparingOrders.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </VStack>

        {/* Ready Orders Column */}
        <VStack align="stretch" spacing={4} bg="var(--background-color-light)" p={4} rounded="md" shadow="sm">
          <Text fontSize="lg" fontWeight="bold" color="var(--dark-gray-text)" borderBottom="2px solid var(--primary-orange)" pb={2}>
            Ready ({readyOrders.length})
          </Text>
          {readyOrders.length === 0 ? (
            <Text color="var(--medium-gray-text)">No orders ready.</Text>
          ) : (
            readyOrders.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </VStack>

        {/* Served Orders Column */}
        <VStack align="stretch" spacing={4} bg="var(--background-color-light)" p={4} rounded="md" shadow="sm">
          <Text fontSize="lg" fontWeight="bold" color="var(--dark-gray-text)" borderBottom="2px solid var(--primary-orange)" pb={2}>
            Served ({servedOrders.length})
          </Text>
          {servedOrders.length === 0 ? (
            <Text color="var(--medium-gray-text)">No served orders.</Text>
          ) : (
            servedOrders.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </VStack>
      </SimpleGrid>
    </Flex>
  );
};

export default OrderManagementView;
