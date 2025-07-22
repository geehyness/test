// src/app/pos/components/KitchenDisplayView.tsx
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
} from "@chakra-ui/react";
import { Order, Table } from "@/app/config/entities";

interface KitchenDisplayViewProps {
  orders: Order[];
  tables: Table[];
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => Promise<void>;
}

const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({
  orders,
  tables,
  updateOrder,
}) => {
  const toast = useToast();

  // Filter orders relevant for the kitchen: new and preparing
  const kitchenOrders = orders.filter(
    (order) => order.status === "new" || order.status === "preparing"
  );

  // Modified getTableNumber to correctly handle string | null | undefined
  const getTableNumber = (tableId: string | null | undefined) => {
    // If tableId is null or undefined, it's a takeaway order
    if (tableId === null || tableId === undefined) {
      return "Takeaway";
    }
    // Otherwise, try to find the table name
    return tables.find((t) => t.id === tableId)?.name || "Unknown Table";
  };

  const handleMarkReady = async (order: Order) => {
    try {
      await updateOrder(order.id, { status: "ready" });
      toast({
        title: "Order Ready",
        description: `Order #${order.id} is now ready for serving!`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      console.log(`LOG: Kitchen marked order #${order.id} as READY.`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark order as ready.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error(
        `ERROR: Kitchen failed to mark order #${order.id} as ready.`,
        error
      );
    }
  };

  const KitchenOrderCard: React.FC<{ order: Order }> = ({ order }) => (
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
        <Badge
          colorScheme={order.status === "new" ? "purple" : "orange"}
          fontSize="md"
        >
          {order.status.toUpperCase()}
        </Badge>
      </Flex>
      {/* Pass order.table_id to getTableNumber, which now handles null */}
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
            {item.notes && (
              <Text as="span" fontSize="sm" color="red.500" ml={2}>
                ({item.notes})
              </Text>
            )}
          </Text>
        ))}
      </VStack>

      <Flex justifyContent="center" mt="auto">
        {" "}
        {/* Use mt="auto" to push button to bottom */}
        <Button
          colorScheme="green"
          size="lg"
          width="80%"
          onClick={() => handleMarkReady(order)}
          isDisabled={order.status === "ready"} // Disable if already ready
          bg="var(--primary-green)"
          color="white"
          _hover={{ bg: "darken(var(--primary-green), 10%)" }}
          shadow="md"
        >
          Mark Ready
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
        Kitchen Display System
      </Text>
      {kitchenOrders.length === 0 ? (
        <Text textAlign="center" py={10} color="var(--medium-gray-text)">
          No new or preparing orders for the kitchen.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} flex="1">
          {kitchenOrders.map((order) => (
            <KitchenOrderCard key={order.id} order={order} />
          ))}
        </SimpleGrid>
      )}
    </Flex>
  );
};

export default KitchenDisplayView;
