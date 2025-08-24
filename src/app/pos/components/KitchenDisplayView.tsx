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

  const kitchenOrders = orders.filter(
    (order) => order.status === "new" || order.status === "preparing"
  );

  const getTableNumber = (tableId: string | null | undefined) => {
    if (tableId === null || tableId === undefined) {
      return "Takeaway";
    }
    return tables.find((t) => t.id === tableId)?.name || "Unknown Table";
  };

  const handleMarkReady = async (order: Order) => {
    try {
      await updateOrder(order.id, { status: "ready" });
      toast({
        title: "Order Ready",
        description: `Order #${order.id} is now ready for serving.`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      console.log(`LOG: Kitchen marked order #${order.id} as READY.`);
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
      console.error(
        `ERROR: Error updating order #${order.id} status:`,
        error
      );
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
        <Badge
          colorScheme={
            order.status === "preparing"
              ? "orange"
              : order.status === "new"
                ? "blue"
                : "gray"
          }
        >
          {order.status.toUpperCase()}
        </Badge>
        <Spacer />
        <Text fontSize="lg" fontWeight="medium">
          {getTableNumber(order.table_id)}
        </Text>
      </Flex>

      <Text fontSize="md" color="gray.600" mb={4}>
        Time: {new Date(order.created_at).toLocaleTimeString()}
      </Text>

      <VStack align="stretch" spacing={2} mb={4}>
        {order.items.map((item, index) => (
          <Text
            key={index}
            fontSize="lg"
            fontWeight="semibold"
            color="var(--dark-gray-text)"
          >
            {item.quantity}x {item.name}
            {item.notes && (
              <Text as="span" fontSize="sm" color="gray.600" ml={2}>
                ({item.notes})
              </Text>
            )}
          </Text>
        ))}
      </VStack>

      <Flex justifyContent="center" mt={4}>
        <Button
          colorScheme="green"
          size="lg"
          width="80%"
          onClick={() => handleMarkReady(order)}
          isDisabled={order.status === "ready"}
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
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {kitchenOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </SimpleGrid>
      )}
    </Flex>
  );
};

export default KitchenDisplayView;