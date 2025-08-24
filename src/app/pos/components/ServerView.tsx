// src/app/pos/components/ServerView.tsx
import React from "react";
import {
  Box,
  Flex,
  VStack,
  Text,
  Button,
  Spacer,
  Badge,
  SimpleGrid,
  useToast,
  HStack,
} from "@chakra-ui/react";
import { Order, Table } from "@/app/config/entities";

interface ServerViewProps {
  orders: Order[];
  tables: Table[];
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => Promise<void>;
}

const ServerView: React.FC<ServerViewProps> = ({
  orders,
  tables,
  updateOrder,
}) => {
  const toast = useToast();

  const readyOrders = orders.filter((order) => order.status === "ready");

  const getTableNumber = (tableId: string | null | undefined) => {
    return tables.find((t) => t.id === tableId)?.name || "Takeaway";
  };

  const handleMarkServed = async (order: Order) => {
    try {
      await updateOrder(order.id, { status: "served" });
      toast({
        title: "Order Served",
        description: `Order #${order.id} has been marked as served.`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      console.log(`LOG: Server marked order #${order.id} as SERVED.`);
    } catch (error: any) {
      toast({
        title: "Error updating order.",
        description:
          error.message ||
          `There was an error updating order #${order.id} status.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(`ERROR: Server update failed for order #${order.id}:`, error);
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Box
      p={6}
      bg="white"
      rounded="lg"
      shadow="lg"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Flex align="center" mb={4}>
        <Text
          fontSize="xl"
          fontWeight="bold"
          color="var(--dark-gray-text)"
          mr={2}
        >
          Order #{order.id}
        </Text>
        <Badge colorScheme="green">{order.status.toUpperCase()}</Badge>
        <Spacer />
        <Text fontSize="lg" fontWeight="medium">
          {getTableNumber(order.table_id)}
        </Text>
      </Flex>
      <VStack align="stretch" spacing={2} mb={4}>
        {order.items.map((item, index) => (
          <Text
            key={index}
            fontSize="lg"
            fontWeight="semibold"
            color="var(--dark-gray-text)"
          >
            {item.quantity}x {item.name}
          </Text>
        ))}
      </VStack>
      <Flex justifyContent="center" mt={4}>
        <Button
          colorScheme="blue"
          size="lg"
          width="80%"
          onClick={() => handleMarkServed(order)}
          bg="blue.500"
          color="white"
          _hover={{ bg: "blue.600" }}
          shadow="md"
        >
          Mark Served
        </Button>
      </Flex>
    </Box>
  );

  return (
    <Flex
      direction="column"
      h="100%"
      p={4}
      bg="var(--light-gray-bg)"
      rounded="lg"
      shadow="md"
    >
      <Text
        fontSize="2xl"
        fontWeight="bold"
        mb={6}
        color="var(--dark-gray-text)"
        textAlign="center"
      >
        Orders Ready for Serving
      </Text>
      {readyOrders.length === 0 ? (
        <Text textAlign="center" py={10} color="var(--medium-gray-text)">
          No orders are ready for serving at the moment.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {readyOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </SimpleGrid>
      )}
    </Flex>
  );
};

export default ServerView;