// src/app/pos/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  InputGroup,
  InputLeftElement,
  Input,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  HStack,
  Icon,
  Badge,
  Spacer,
  useToast,
  ModalCloseButton
} from '@chakra-ui/react';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, CloseIcon } from '@chakra-ui/icons';
import { FaShoppingCart, FaClipboardList, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import MenuCategoryFilter from '../components/MenuCategoryFilter';
import MenuItemList from '../components/MenuItemList';
import OrderSummary from '../components/OrderSummary';
import OrderActionButtons from '../components/OrderActionButtons';
import TableSelectionModal from '../components/TableSelectionModal';
import PaymentModal from '../components/PaymentModal';
import { usePOSStore } from '../lib/usePOSStore';
import { MenuItem, Category, Table, Order, OrderItem } from '@/app/config/entities';
import { fetchData } from '@/app/lib/api';

export default function POSDashboardPage() {
  const toast = useToast();

  const {
    menuItems,
    categories,
    tables,
    currentOrder,
    activeOrders,
    setMenuItems,
    setCategories,
    setTables,
    addOrderItem,
    removeOrderItem,
    updateOrderItemQuantity,
    clearCurrentOrder,
    addOrder,
    updateOrder,
    setActiveOrders,
    setCurrentOrderTable,
    setOrderNotes,
    applyDiscountToOrder,
    processOrderPayment,
  } = usePOSStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  const { isOpen: isTableModalOpen, onOpen: onTableModalOpen, onClose: onTableModalClose } = useDisclosure();
  const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure();
  const { isOpen: isTrackOrderModalOpen, onOpen: onTrackOrderModalOpen, onClose: onTrackOrderModalClose } = useDisclosure();
  const { isOpen: isNotesModalOpen, onOpen: onNotesModalOpen, onClose: onNotesModalClose } = useDisclosure();
  const { isOpen: isDiscountModalOpen, onOpen: onDiscountModalOpen, onClose: onDiscountModalClose } = useDisclosure();

  const [currentNotes, setCurrentNotes] = useState(currentOrder.notes || '');
  const [discountCode, setDiscountCode] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedMenuItems, fetchedCategories, fetchedTables, fetchedOrders] = await Promise.all([
          fetchData('menu_items'),
          fetchData('categories'),
          fetchData('tables'),
          fetchData('orders')
        ]);

        console.log('Fetched Menu Items:', fetchedMenuItems);
        console.log('Fetched Categories:', fetchedCategories);
        console.log('Fetched Tables:', fetchedTables);
        console.log('Fetched Orders:', fetchedOrders);

        setMenuItems(fetchedMenuItems || []);
        setCategories(fetchedCategories || []);
        setTables(fetchedTables || []);
        const active = (fetchedOrders || []).filter((order: Order) =>
          order.status !== 'paid' && order.status !== 'cancelled'
        );
        setActiveOrders(active);
        setActiveOrdersCount(active.length);
      } catch (err: any) {
        setError(err.message || 'Failed to load initial data.');
        console.error('Error loading POS data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setMenuItems, setCategories, setTables, setActiveOrders]);

  const filteredMenuItems = React.useMemo(() => {
    let items = menuItems;
    if (selectedCategory) {
      items = items.filter(item => item.category_id === selectedCategory);
    }
    if (searchTerm) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return items;
  }, [menuItems, selectedCategory, searchTerm]);

  const handleAddNotes = () => {
    setOrderNotes(currentNotes);
    onNotesModalClose();
  };

  const handleApplyDiscount = async () => {
    if (discountCode === 'SAVE10') {
      applyDiscountToOrder(0.10, 'percentage');
      toast({
        title: 'Discount Applied',
        description: '10% discount applied to the order.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDiscountModalClose();
    } else if (discountCode === 'FREEDELIVERY') {
      applyDiscountToOrder(5.00, 'fixed');
      toast({
        title: 'Discount Applied',
        description: '$5 fixed discount applied.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDiscountModalClose();
    }
    else {
      toast({
        title: 'Invalid Discount',
        description: 'The discount code entered is not valid.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'split') => {
    try {
      if (currentOrder.items.length === 0) {
        toast({
          title: 'Order Empty',
          description: 'Please add items to the order before checking out.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const orderToSubmit: Order = {
        ...currentOrder,
        id: `order-${Date.now()}`,
        status: 'paid',
        employee_id: 'emp-101',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_type: currentOrder.table_id ? 'dine-in' : 'takeaway',
        items: currentOrder.items.map(item => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
          price_at_sale: item.price_at_sale,
          subtotal: item.subtotal,
          notes: item.notes,
        })),
      };

      await processOrderPayment(orderToSubmit, paymentMethod);

      addOrder(orderToSubmit);
      clearCurrentOrder();
      onPaymentModalClose();

      toast({
        title: 'Order Placed & Paid',
        description: `Order #${orderToSubmit.id} processed successfully via ${paymentMethod}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      window.dispatchEvent(new CustomEvent('newOrderNotification', {
        detail: {
          id: `notif-${Date.now()}`,
          message: `New order #${orderToSubmit.id} received!`,
          type: 'info',
        },
      }));

    } catch (err: any) {
      console.error('Checkout error:', err);
      toast({
        title: 'Checkout Failed',
        description: err.message || 'There was an error processing the order.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSendToKitchen = async () => {
    try {
      if (currentOrder.items.length === 0) {
        toast({
          title: 'Order Empty',
          description: 'Please add items to the order before sending to kitchen.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (!currentOrder.table_id) {
        toast({
          title: 'Table Not Selected',
          description: 'Please select a table or mark as takeaway before sending to kitchen.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const orderToSubmit: Order = {
        ...currentOrder,
        id: currentOrder.id || `order-${Date.now()}`,
        status: 'preparing',
        employee_id: 'emp-101',
        created_at: currentOrder.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_type: currentOrder.table_id ? 'dine-in' : 'takeaway',
        items: currentOrder.items.map(item => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
          price_at_sale: item.price_at_sale,
          subtotal: item.subtotal,
          notes: item.notes,
        })),
      };

      if (!currentOrder.id) {
        await addOrder(orderToSubmit);
      } else {
        await updateOrder(orderToSubmit.id, orderToSubmit);
      }

      clearCurrentOrder();
      toast({
        title: 'Order Sent to Kitchen',
        description: `Order #${orderToSubmit.id} is now being prepared.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setActiveOrdersCount(prev => prev + 1);

    } catch (err: any) {
      console.error('Send to kitchen error:', err);
      toast({
        title: 'Failed to Send Order',
        description: err.message || 'There was an error sending the order to the kitchen.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleTrackOrderClick = () => {
    onTrackOrderModalOpen();
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="calc(100vh - 80px)">
        <Spinner size="xl" color="var(--primary-green)" />
        <Text ml={4} fontSize="xl" color="var(--dark-gray-text)">Loading POS data...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" variant="left-accent" m={4}>
        <AlertIcon />
        <AlertTitle>Error Loading Data!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} p={4} bg="var(--light-gray-bg)" minH="calc(100vh - 80px)">
      <Box flex="2" bg="var(--background-color-light)" p={6} rounded="lg" shadow="md">
        <InputGroup mb={4}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            rounded="md"
            borderColor="var(--border-color)"
            focusBorderColor="var(--primary-green)"
            color="var(--dark-gray-text)"
          />
        </InputGroup>

        <MenuCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <MenuItemList
          menuItems={filteredMenuItems}
          onAddItem={addOrderItem}
        />
      </Box>

      <Box flex="1" bg="var(--background-color-light)" p={6} rounded="lg" shadow="md" position="relative">
        <OrderSummary
          currentOrder={currentOrder}
          onRemoveItem={removeOrderItem}
          onUpdateQuantity={updateOrderItemQuantity}
        />

        <OrderActionButtons
          onAddNotes={onNotesModalOpen}
          onApplyDiscount={onDiscountModalOpen}
          onSelectTable={onTableModalOpen}
          onSendToKitchen={handleSendToKitchen}
          onCheckout={onPaymentModalOpen}
          onClearOrder={clearCurrentOrder}
        />

        <Button
          onClick={onPaymentModalOpen}
          colorScheme="green"
          size="lg"
          rounded="full"
          height="60px"
          width="60px"
          shadow="lg"
          _hover={{
            bg: 'var(--primary-green)',
            transform: 'scale(1.05)',
          }}
          transition="all 0.2s ease-in-out"
          position="absolute"
          bottom="20px"
          right="20px"
          bg="var(--primary-green)"
          color="white"
        >
          <Icon as={FaShoppingCart} w={6} h={6} />
          {currentOrder.items.length > 0 && (
            <Badge
              colorScheme="red"
              position="absolute"
              top="-5px"
              right="-5px"
              rounded="full"
              px={2}
              py={1}
              fontSize="xs"
              fontWeight="bold"
            >
              {currentOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </Button>

        {activeOrdersCount > 0 && (
          <Button
            onClick={handleTrackOrderClick}
            colorScheme="blue"
            size="lg"
            rounded="full"
            height="60px"
            width="60px"
            shadow="lg"
            _hover={{
              bg: 'blue.600',
              transform: 'scale(1.05)',
            }}
            transition="all 0.2s ease-in-out"
            position="absolute"
            bottom="20px"
            right="90px"
            bg="blue.500"
            color="white"
          >
            <Icon as={FaClipboardList} w={6} h={6} />
            <Badge
              colorScheme="orange"
              position="absolute"
              top="-5px"
              right="-5px"
              rounded="full"
              px={2}
              py={1}
              fontSize="xs"
              fontWeight="bold"
            >
              {activeOrdersCount}
            </Badge>
          </Button>
        )}
      </Box>

      <TableSelectionModal
        isOpen={isTableModalOpen}
        onClose={onTableModalClose}
        tables={tables}
        onSelectTable={setCurrentOrderTable}
        currentSelectedTableId={currentOrder.table_id}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={onPaymentModalClose}
        orderTotal={currentOrder.total_amount}
        onProcessPayment={handleCheckout}
      />

      <Modal isOpen={isNotesModalOpen} onClose={onNotesModalClose}>
        <ModalOverlay />
        <ModalContent rounded="lg" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>Add Order Notes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Enter notes for the order..."
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              rounded="md"
              borderColor="var(--border-color)"
              focusBorderColor="var(--primary-green)"
              color="var(--dark-gray-text)"
            />
          </ModalBody>
          <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
            <Button variant="ghost" onClick={onNotesModalClose} mr={3}>Cancel</Button>
            <Button bg="var(--primary-green)" color="white" _hover={{ bg: 'darken(var(--primary-green), 10%)' }} onClick={handleAddNotes}>Save Notes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDiscountModalOpen} onClose={onDiscountModalClose}>
        <ModalOverlay />
        <ModalContent rounded="lg" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>Apply Discount</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              rounded="md"
              borderColor="var(--border-color)"
              focusBorderColor="var(--primary-green)"
              color="var(--dark-gray-text)"
            />
          </ModalBody>
          <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
            <Button variant="ghost" onClick={onDiscountModalClose} mr={3}>Cancel</Button>
            <Button bg="var(--primary-green)" color="white" _hover={{ bg: 'darken(var(--primary-green), 10%)' }} onClick={handleApplyDiscount}>Apply Discount</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isTrackOrderModalOpen} onClose={onTrackOrderModalClose} size="xl">
        <ModalOverlay />
        <ModalContent rounded="lg" bg="var(--background-color-light)" color="var(--dark-gray-text)">
          <ModalHeader borderBottom="1px solid var(--border-color)" pb={3}>Active Orders</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {activeOrders.length === 0 ? (
              <Text textAlign="center" py={10} color="var(--medium-gray-text)">No active orders at the moment.</Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {activeOrders.map(order => (
                  <Box key={order.id} p={4} borderWidth="1px" rounded="md" shadow="sm" bg="var(--light-gray-bg)">
                    <Flex align="center" mb={2}>
                      <Text fontWeight="bold" fontSize="md" color="var(--dark-gray-text)">Order #{order.id}</Text>
                      <Spacer />
                      <Badge colorScheme={order.status === 'preparing' ? 'orange' : order.status === 'ready' ? 'green' : 'gray'}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </Flex>
                    <Text fontSize="sm" color="var(--medium-gray-text)">Table: {tables.find(t => t.id === order.table_id)?.name || 'N/A'}</Text>
                    <Text fontSize="sm" color="var(--medium-gray-text)">Total: R {order.total_amount.toFixed(2)}</Text>
                    <Text fontSize="sm" color="var(--medium-gray-text)">Items: {(order.items || []).map(item => `${item.name} (x${item.quantity})`).join(', ')}</Text>
                    <HStack mt={3} justifyContent="flex-end">
                      <Button size="sm" colorScheme="blue" onClick={() => {
                        const fullOrder = activeOrders.find(ao => ao.id === order.id);
                        if (fullOrder) {
                          usePOSStore.setState({ currentOrder: fullOrder });
                          onTrackOrderModalClose();
                          toast({
                            title: 'Order Loaded',
                            description: `Order #${order.id} loaded for modification.`,
                            status: 'info',
                            duration: 3000,
                            isClosable: true,
                          });
                        }
                      }}>
                        Load Order
                      </Button>
                      <Button size="sm" colorScheme="green" onClick={() => {
                        updateOrder(order.id, { ...order, status: 'served' });
                        setActiveOrdersCount(prev => prev - 1);
                        toast({
                          title: 'Order Updated',
                          description: `Order #${order.id} marked as served.`,
                          status: 'success',
                          duration: 3000,
                          isClosable: true,
                        });
                      }}>
                        Mark Served
                      </Button>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px solid var(--border-color)" pt={3}>
            <Button variant="ghost" onClick={onTrackOrderModalOpen}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}