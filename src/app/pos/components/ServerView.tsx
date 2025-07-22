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

  // Filter orders relevant for servers: only 'ready' orders
  const readyOrders = orders.filter((order) => order.status === "ready");

  // getTableNumber function now explicitly accepts string, null, or undefined
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark order as served.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error(
        `ERROR: Server failed to mark order #${order.id} as served.`,
        error
      );
    }
  };

  const ServerOrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <Box
      p={4}
      borderWidth="1px"
      rounded="lg"
      shadow="md"
      bg="var(--background-color-light)"
      height="100%"
    >
      <Flex align="center" mb={2}>
        <Text fontWeight="bold" fontSize="xl" color="var(--dark-gray-text)">
          Order #{order.id}
        </Text>
        <Spacer />
        <Badge colorScheme="green" fontSize="md">
          READY
        </Badge>
      </Flex>
      {/* Pass order.table_id directly, now that getTableNumber handles null */}
      <Text fontSize="md" color="var(--medium-gray-text)" mb={2}>
        Table: {getTableNumber(order.table_id)}
      </Text>

      <VStack align="stretch" spacing={1} mb={4}>
        {(order.items ?? []).map((item, index) => (
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

      <Flex justifyContent="center" mt="auto">
        {" "}
        {/* Use mt="auto" to push button to bottom */}
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
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} flex="1">
          {readyOrders.map((order) => (
            <ServerOrderCard key={order.id} order={order} />
          ))}
        </SimpleGrid>
      )}
    </Flex>
  );
};

export default ServerView;
