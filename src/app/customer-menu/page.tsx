// src/app/customer-menu/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Image as ChakraImage,
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  Stack,
  Divider,
  CardFooter,
  Button,
  Container,
  Flex,
  useColorModeValue,
  IconButton,
  Badge,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Link as ChakraLink,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import {
  FaShoppingCart,
  FaPizzaSlice,
  FaCoffee,
  FaHamburger,
  FaDrumstickBite,
  FaHotdog,
  FaWineGlass,
  FaUtensils,
  FaCocktail,
  FaBreadSlice,
  FaCreditCard,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClipboardList
} from 'react-icons/fa';
import { fetchData } from '../lib/api';
import { Table, Food, Category } from '../config/entities'; // Import Table, Food, and Category from entities.ts

// Define a new interface for displaying food items, extending the base Food entity
interface DisplayFoodItem extends Food {
  categoryName: string; // The human-readable category name
  displayPrice: number; // The price to display (e.g., sale_price)
}

interface FoodCategoryData extends Category {} // Alias for clarity, if needed, otherwise directly use Category

interface FoodCategory {
  id: string;
  name: string;
  icon: React.ElementType;
}

// CartItem now extends DisplayFoodItem to include display-specific properties
interface CartItem extends DisplayFoodItem {
  quantity: number;
}

interface OrderedMeal extends CartItem {
  status: 'Preparing' | 'Ready' | 'Served';
  orderTime: string;
}

interface NavItemProps {
  icon: React.ElementType;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, children, isActive, onClick }) => {
  const activeBg = useColorModeValue('#333', '#333'); // Changed to #333 for both light and dark modes
  const hoverBg = useColorModeValue('var(--navbar-main-item-hover-bg)', 'var(--navbar-main-item-hover-bg)');
  const activeColor = 'var(--primary-green)';
  const inactiveColor = useColorModeValue('var(--dark-gray-text)', 'var(--navbar-main-item-inactive-text)');

  return (
    <ChakraLink
      href="#"
      _hover={{ textDecoration: 'none' }}
      onClick={onClick}
    >
      <Flex
        align="center"
        p="3"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : inactiveColor}
        _hover={{
          bg: hoverBg,
          color: activeColor,
        }}
        fontWeight="bold"
        transition="all 0.2s ease-in-out"
        flexShrink={0}
      >
        {children}
      </Flex>
    </ChakraLink>
  );
};

const CustomerMenuPage: React.FC = () => {
  // --- ALL Hooks MUST be declared at the top level and unconditionally ---
  const [foods, setFoods] = useState<DisplayFoodItem[]>([]);
  const [randomlySelectedTable, setRandomlySelectedTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderedMeals, setOrderedMeals] = useState<OrderedMeal[]>([]);
  const { isOpen: isCartOpen, onOpen: onCartOpen, onClose: onCartClose } = useDisclosure();

  const { isOpen: isDetailsModalOpen, onOpen: onDetailsModalOpen, onClose: onDetailsModalClose } = useDisclosure();
  const [selectedFood, setSelectedFood] = useState<DisplayFoodItem | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dynamicCategories, setDynamicCategories] = useState<FoodCategory[]>([]);

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');

  // Move ALL useColorModeValue hooks to the top level
  const primaryGreen = useColorModeValue('var(--primary-green)', 'var(--primary-green)');
  const textColor = useColorModeValue('var(--dark-gray-text)', 'var(--dark-gray-text)');
  const cardBg = useColorModeValue('var(--background-color-light)', 'var(--background-color-light)');
  const borderColor = useColorModeValue('var(--border-color)', 'var(--border-color)');
  const modalContentBg = useColorModeValue('var(--background-color-light)', 'var(--background-color-light)');
  const topBarBg = useColorModeValue('var(--background-color-light)', 'var(--background-color-light)');

  // IMPORTANT: If you have any `useContext`, `useRef`, or `useId` calls in your
  // full file, they also need to be declared here at the top, unconditionally.
  // Example (uncomment and replace with your actual context/ref/id if applicable):
  // import { MyContext } from './MyContext'; // Make sure to import your context
  // const myContextValue = useContext(MyContext);
  // const myRef = useRef(null);
  // const myId = useId();


  // Helper function to map category names to icons
  const getCategoryIcon = (categoryName: string): React.ElementType => {
    switch (categoryName.toLowerCase()) {
      case 'pizza': return FaPizzaSlice;
      case 'burgers': return FaHamburger;
      case 'drinks': return FaCoffee;
      case 'desserts': return FaWineGlass;
      case 'chicken': return FaDrumstickBite;
      case 'hotdogs': return FaHotdog;
      case 'cocktails': return FaCocktail;
      case 'breads': return FaBreadSlice;
      default: return FaUtensils;
    }
  };

  const fetchFoodsAndCategories = useCallback(async () => {
    try {
      setLoading(true);
      const [foodsData, categoriesData] = await Promise.all([
        fetchData('foods'),
        fetchData('categories'),
      ]);

      const categoryMap = new Map<string, string>();
      categoriesData.forEach((cat: Category) => { // Use imported Category interface
        categoryMap.set(cat.id, cat.name);
      });

      const processedFoods: DisplayFoodItem[] = foodsData.map((food: Food) => ({ // Use imported Food interface
        ...food,
        categoryName: categoryMap.get(food.category_id) || 'Uncategorized', // Map category_id to name
        displayPrice: food.sale_price, // Use sale_price for display
        description: food.description || 'No description available.',
      }));

      setFoods(processedFoods);

      const uniqueCategories = new Set<string>();
      processedFoods.forEach((food: DisplayFoodItem) => {
        if (food.categoryName) {
          uniqueCategories.add(food.categoryName);
        }
      });

      const generatedCategories: FoodCategory[] = [{ id: 'All', name: 'All', icon: FaUtensils }];
      Array.from(uniqueCategories)
        .sort((a, b) => a.localeCompare(b))
        .forEach(cat => {
          generatedCategories.push({
            id: cat,
            name: cat,
            icon: getCategoryIcon(cat)
          });
        });
      setDynamicCategories(generatedCategories);

    } catch (err) {
      setError('Failed to load menu items.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTablesData = useCallback(async () => {
    try {
      const tableData: Table[] = await fetchData('tables'); // Use imported Table interface
      if (tableData.length > 0) {
        const randomIndex = Math.floor(Math.random() * tableData.length);
        setRandomlySelectedTable(tableData[randomIndex]);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  }, []);

  useEffect(() => {
    fetchFoodsAndCategories();
    fetchTablesData();
  }, [fetchFoodsAndCategories, fetchTablesData]);

  const openDetailsModal = (food: DisplayFoodItem) => {
    setSelectedFood(food);
    onDetailsModalOpen();
  };

  const closeDetailsModal = () => {
    setSelectedFood(null);
    onDetailsModalClose();
  };

  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (food.description && food.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || (food.categoryName && food.categoryName.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const groupedFoods = [];

  if (selectedCategory === 'All') {
    groupedFoods.push({
      id: 'All',
      name: 'All',
      icon: FaUtensils,
      items: filteredFoods,
    });
  } else {
    const selectedCat = dynamicCategories.find(cat => cat.id === selectedCategory);
    if (selectedCat) {
      groupedFoods.push({
        ...selectedCat,
        items: filteredFoods.filter(food => food.categoryName && food.categoryName.toLowerCase() === selectedCategory.toLowerCase())
      });
    }
  }

  const addToCart = (item: DisplayFoodItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      } else {
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    setCartItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((item) => item.id !== itemId);
      }
      return prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: quantity } : item
      );
    });
  };

  const removeCartItem = (itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const getCartItemQuantity = (itemId: string) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const totalCartItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalCartPrice = cartItems.reduce((total, item) => total + item.displayPrice * item.quantity, 0); // Use displayPrice
  const activeOrdersCount = orderedMeals.filter(meal => meal.status !== 'Served').length; // Calculate active orders

  const handlePlaceOrder = () => {
    if (cartItems.length > 0) {
      const newOrderedMeals: OrderedMeal[] = cartItems.map(item => ({
        ...item,
        status: 'Preparing',
        orderTime: new Date().toLocaleString(),
      }));
      setOrderedMeals(prev => [...prev, ...newOrderedMeals]);
      setCartItems([]);
      // Use a custom message box instead of alert()
      // You would replace this with a Chakra UI Modal or Toast
      console.log(`Order placed for Table ${randomlySelectedTable?.name || 'N/A'}! Total: R ${totalCartPrice.toFixed(2)}`);
      onCartClose();
    }
  };

  // Function to open cart modal and switch to "Order Progress" tab
  const handleTrackOrderClick = () => {
    setActiveTabIndex(1); // Set the active tab to the "Order Progress" tab (index 1)
    onCartOpen(); // Open the cart modal
  };

  // Function to open cart modal and switch to "Your Order" tab
  const handleCartButtonClick = () => {
    setActiveTabIndex(0); // Set the active tab to the "Your Order" tab (index 0)
    onCartOpen(); // Open the cart modal
  };

  // --- Conditional return AFTER all Hooks are called ---
  if (loading && foods.length === 0) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" color={primaryGreen} />
      </Flex>
    );
  }

  return (
    // Changed Container to Flex
    <Flex maxW="container.xl" mx="auto" px={4} direction="column">
      <Box
        position="sticky"
        top="0"
        zIndex={10}
        bg={topBarBg}
        pb={4}
        py={4}
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)"
        transition="background-color 0.3s ease-in-out"
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'flex-start', md: 'center' }}
          justify="space-between"
          mb={4}
          wrap="wrap"
          px={{ base: 4, md: 8 }}
        >
          <Box mb={{ base: 4, md: 0 }}>
            <Heading
              as="h1"
              size="xl"
              color={textColor}
              mb={2}
              fontFamily="var(--font-lexend-deca)"
              fontWeight="extrabold"
            >
              Our Delicious Menu
            </Heading>
            <Text
              fontSize="lg"
              color="var(--medium-gray-text)"
              fontFamily="var(--font-lexend-deca)"
              lineHeight="short"
            >
              Discover a wide variety of culinary delights.
            </Text>
          </Box>
        </Flex>

        {/* Search Bar on its own line */}
        <Box px={{ base: 4, md: 8 }} mb={6} mt={4}> {/* Added margin-top for spacing from title, and padding */}
          <InputGroup width="100%">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              rounded="lg"
              borderColor="#333" // Added border color
              focusBorderColor={primaryGreen}
              fontFamily="var(--font-lexend-deca)"
              px={5}
              py={3}
              boxShadow="sm"
              _hover={{ borderColor: primaryGreen, boxShadow: 'md' }}
              transition="all 0.2s ease-in-out"
            />
          </InputGroup>
        </Box>

        <Flex
          overflowX="auto"
          whiteSpace="nowrap"
          gap={{ base: 2, md: 4 }}
          justifyContent="flex-start"
          css={{
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
          py={2}
          px={{ base: 4, md: 8 }}
        >
          {dynamicCategories.map((category) => (
            <NavItem
              key={category.id}
              icon={category.icon}
              isActive={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </NavItem>
          ))}
        </Flex>
      </Box>

      
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        <Box flex={1} overflowY="auto" maxH="calc(100vh - 180px)" pr={{ base: 0, md: 4 }}>
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {groupedFoods.map((group) => (
            <Box key={group.id} mb={10}>
              <br /><br />
              <Heading as="h2" size="lg" mb={6} color={textColor} borderBottom="2px solid" borderColor={primaryGreen} pb={2} display="inline-block" fontFamily="var(--font-lexend-deca)">
                {group.name}
              </Heading>
              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                spacing={6}
              >
                {group.items.map((item) => {
                  const currentQuantity = getCartItemQuantity(item.id);
                  return (
                    <Card
                      key={item.id}
                      bg={cardBg}
                      rounded="xl"
                      shadow="md"
                      overflow="hidden"
                      transition="all 0.2s ease-in-out"
                      borderWidth="1px"
                      borderColor={borderColor}
                      cursor="pointer"
                      onClick={() => openDetailsModal(item)}
                      _hover={{
                        shadow: 'lg',
                        transform: 'translateY(-5px)',
                        borderColor: primaryGreen,
                      }}
                    >
                      {item.image && (
                        <ChakraImage
                          src={item.image}
                          alt={item.name}
                          height="200px"
                          objectFit="cover"
                          width="100%"
                          roundedTop="xl"
                        />
                      )}
                      <CardBody p={4}>
                        <VStack spacing={2} align="stretch">
                          <Text
                            fontWeight="bold"
                            fontSize="lg"
                            color={textColor}
                            noOfLines={2}
                            fontFamily="var(--font-lexend-deca)"
                          >
                            {item.name}
                          </Text>
                          <Text
                            fontSize="sm"
                            color="var(--medium-gray-text)"
                            noOfLines={2}
                            fontFamily="var(--font-lexend-deca)"
                          >
                            {item.description}
                          </Text>
                          <Text
                            color={primaryGreen}
                            fontSize="xl"
                            fontWeight="extrabold"
                            fontFamily="var(--font-lexend-deca)"
                          >
                            R {item.displayPrice.toFixed(2)} {/* Use displayPrice */}
                          </Text>
                        </VStack>
                      </CardBody>

                      <Divider />

                      <CardFooter p={4}>
                        {currentQuantity === 0 ? (
                          <Button
                            variant="solid"
                            colorScheme="green"
                            size="md"
                            width="full"
                            rounded="lg"
                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                            fontWeight="semibold"
                            fontSize="md"
                            bg={primaryGreen}
                            _hover={{ bg: 'green.600', shadow: 'md' }}
                            fontFamily="var(--font-lexend-deca)"
                          >
                            Add to Cart
                          </Button>
                        ) : (
                          <HStack width="full" justify="space-between">
                            <IconButton
                              aria-label="Decrease quantity"
                              icon={<MinusIcon />}
                              size="md"
                              onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(item.id, currentQuantity - 1); }}
                              isDisabled={currentQuantity <= 0}
                              rounded="lg"
                              colorScheme="red"
                              variant="outline"
                            />
                            <Text
                              fontWeight="bold"
                              fontSize="lg"
                              color={textColor}
                              fontFamily="var(--font-lexend-deca)"
                            >
                              {currentQuantity}
                            </Text>
                            <IconButton
                              aria-label="Increase quantity"
                              icon={<AddIcon />}
                              size="md"
                              onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(item.id, currentQuantity + 1); }}
                              rounded="lg"
                              colorScheme="green"
                              variant="outline"
                            />
                          </HStack>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Box>
          ))}
        </Box>
      </Flex>

      {/* Item Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={closeDetailsModal} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent bg={modalContentBg} rounded="xl" overflow="hidden">
          <ModalCloseButton color={textColor} />
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor} color={textColor} fontFamily="var(--font-lexend-deca)" pb={3}>
            {selectedFood?.name}
          </ModalHeader>

          <ModalBody p={0}>
            {selectedFood?.image && (
              <ChakraImage
                src={selectedFood.image}
                alt={selectedFood.name}
                height={{ base: '250px', md: '300px' }}
                objectFit="cover"
                width="100%"
              />
            )}
            <VStack p={6} spacing={4} align="stretch">
              <Text
                fontSize="md"
                color="var(--medium-gray-text)"
                fontFamily="var(--font-lexend-deca)"
              >
                {selectedFood?.description}
              </Text>
              <Text
                color={primaryGreen}
                fontSize="2xl"
                fontWeight="extrabold"
                fontFamily="var(--font-lexend-deca)"
              >
                R {selectedFood?.displayPrice.toFixed(2)} {/* Use displayPrice */}
              </Text>

              {selectedFood && (
                <Box pt={4}>
                  {getCartItemQuantity(selectedFood.id) === 0 ? (
                    <Button
                      variant="solid"
                      colorScheme="green"
                      size="lg"
                      width="full"
                      rounded="lg"
                      onClick={() => { addToCart(selectedFood); closeDetailsModal(); }}
                      fontWeight="semibold"
                      fontSize="lg"
                      bg={primaryGreen}
                      _hover={{ bg: 'green.600', shadow: 'md' }}
                      fontFamily="var(--font-lexend-deca)"
                    >
                      Add to Cart
                    </Button>
                  ) : (
                    <HStack width="full" justify="space-between">
                      <IconButton
                        aria-label="Decrease quantity"
                        icon={<MinusIcon />}
                        size="lg"
                        onClick={() => updateCartItemQuantity(selectedFood.id, getCartItemQuantity(selectedFood.id) - 1)}
                        isDisabled={getCartItemQuantity(selectedFood.id) <= 0}
                        rounded="lg"
                        colorScheme="red"
                        variant="outline"
                      />
                      <Text
                        fontWeight="bold"
                        fontSize="xl"
                        color={textColor}
                        fontFamily="var(--font-lexend-deca)"
                      >
                        {getCartItemQuantity(selectedFood.id)}
                      </Text>
                      <IconButton
                        aria-label="Increase quantity"
                        icon={<AddIcon />}
                        size="lg"
                        onClick={() => updateCartItemQuantity(selectedFood.id, getCartItemQuantity(selectedFood.id) + 1)}
                        rounded="lg"
                        colorScheme="green"
                        variant="outline"
                      />
                    </HStack>
                  )}
                </Box>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Cart Modal */}
      <Modal
        isOpen={isCartOpen}
        onClose={onCartClose}
        size={{ base: 'full', sm: 'md' }}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent
          bg={modalContentBg}
          rounded="xl"
          maxH="80vh"
        >
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor} color={textColor} fontFamily="var(--font-lexend-deca)}" mt={8}>
            <Flex justifyContent="space-between" alignItems="center">
              <Text>Your Order ({totalCartItems} items)</Text>
              <HStack spacing={1}>
                <Text fontSize="md" color="var(--medium-gray-text)">Table:</Text>
                <Text fontWeight="bold" color={primaryGreen}>{randomlySelectedTable?.name || 'N/A'}</Text>
              </HStack>
            </Flex>
          </ModalHeader>
          <ModalCloseButton color={textColor} />

          <ModalBody>
            <Tabs
              isFitted
              variant="enclosed"
              colorScheme="green"
              index={activeTabIndex}
              onChange={(index) => setActiveTabIndex(index)}
            >
              <TabList mb="1em">
                <Tab _selected={{ color: primaryGreen, borderColor: primaryGreen, borderBottomColor: 'transparent' }} fontFamily="var(--font-lexend-deca)">
                  Your Order
                </Tab>
                <Tab _selected={{ color: primaryGreen, borderColor: primaryGreen, borderBottomColor: 'transparent' }} fontFamily="var(--font-lexend-deca)">
                  Order Progress
                  {orderedMeals.length > 0 && (
                    <Badge ml={2} colorScheme="orange" rounded="full" px={2}>
                      {orderedMeals.filter(meal => meal.status !== 'Served').length}
                    </Badge>
                  )}
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  {cartItems.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" height="full" minH="200px">
                      <Icon as={FaShoppingCart} w={12} h={12} color="gray.400" mb={4} />
                      <Text fontSize="lg" color="gray.500" fontFamily="var(--font-lexend-deca)">
                        Your cart is empty.
                      </Text>
                      <Text fontSize="md" color="gray.500" mt={2} fontFamily="var(--font-lexend-deca)">
                        Add some delicious items from the menu!
                      </Text>
                    </Flex>
                  ) : (
                    <VStack>
                      <VStack spacing={4} align="stretch">
                        {cartItems.map((item) => (
                          <Flex
                            key={item.id}
                            p={3}
                            shadow="sm"
                            borderWidth="1px"
                            borderColor={borderColor}
                            rounded="md"
                            align="center"
                            bg={cardBg}
                          >
                            {item.image && (
                              <ChakraImage
                                src={item.image}
                                alt={item.name}
                                boxSize="60px"
                                objectFit="cover"
                                rounded="md"
                                mr={3}
                              />
                            )}
                            <Box flex="1">
                              <Text fontWeight="semibold" color={textColor} noOfLines={1} fontFamily="var(--font-lexend-deca)}">{item.name}</Text>
                              <Text fontSize="sm" color="var(--medium-gray-text)" fontFamily="var(--font-lexend-deca)}">
                                R {item.displayPrice.toFixed(2)} x {item.quantity} {/* Use displayPrice */}
                              </Text>
                              <Text fontWeight="bold" color={primaryGreen} fontFamily="var(--font-lexend-deca)}">
                                R {(item.displayPrice * item.quantity).toFixed(2)} {/* Use displayPrice */}
                              </Text>
                            </Box>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Decrease quantity"
                                icon={<MinusIcon />}
                                size="sm"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                isDisabled={item.quantity <= 1}
                                rounded="md"
                                colorScheme="red"
                                variant="ghost"
                              />
                              <Text fontWeight="bold" color={textColor} fontFamily="var(--font-lexend-deca)}">{item.quantity}</Text>
                              <IconButton
                                aria-label="Increase quantity"
                                icon={<AddIcon />}
                                size="sm"
                                onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                rounded="md"
                                colorScheme="green"
                                variant="ghost"
                              />
                              <IconButton
                                aria-label="Remove item"
                                icon={<DeleteIcon />}
                                size="sm"
                                onClick={() => removeCartItem(item.id)}
                                rounded="md"
                                colorScheme="red"
                                variant="ghost"
                              />
                            </HStack>
                          </Flex>
                        ))}
                      </VStack>
                    </VStack>
                  )}
                </TabPanel>

                <TabPanel>
                  {orderedMeals.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" height="full" minH="200px">
                      <Icon as={FaUtensils} w={12} h={12} color="gray.400" mb={4} />
                      <Text fontSize="lg" color="gray.500" fontFamily="var(--font-lexend-deca)">
                        No active orders. Place an order to see its progress!
                      </Text>
                    </Flex>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {orderedMeals.map((meal, index) => (
                        <Card key={index} p={4} rounded="md" borderWidth="1px" borderColor={borderColor} bg={cardBg}>
                          <HStack justifyContent="space-between" mb={2}>
                            <Text fontWeight="semibold" color={textColor} fontFamily="var(--font-lexend-deca)}">{meal.name} x {meal.quantity}</Text>
                            <Badge
                              colorScheme={meal.status === 'Preparing' ? 'orange' : meal.status === 'Ready' ? 'blue' : 'green'}
                              fontFamily="var(--font-lexend-deca)}"
                            >
                              {meal.status}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="var(--medium-gray-text)" fontFamily="var(--font-lexend-deca)}">Ordered: {meal.orderTime}</Text>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          {activeTabIndex === 0 && (
            <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
              <VStack width="full" spacing={4}>
                <Box width="full">
                  <Heading size="sm" mb={2} color={textColor} fontFamily="var(--font-lexend-deca)">
                    Payment Method
                  </Heading>
                  <HStack spacing={4} justify="center" flexWrap="wrap">
                    <Button
                      variant="outline"
                      borderWidth="2px"
                      borderColor={selectedPaymentMethod === 'cash' ? primaryGreen : 'gray.200'}
                      rounded="lg"
                      p={3}
                      onClick={() => setSelectedPaymentMethod('cash')}
                      bg={selectedPaymentMethod === 'cash' ? 'green.50' : 'transparent'}
                      _hover={{ bg: 'green.50' }}
                      flexDir="column"
                      height="auto"
                      width="100px"
                    >
                      <Icon as={FaMoneyBillWave} w={6} h={6} color="gray.500" mb={1} />
                      <Text fontSize="sm" color="var(--medium-gray-text)">
                        Cash
                      </Text>
                      {selectedPaymentMethod === 'cash' && (
                        <Box position="absolute" top={1} right={1} color={primaryGreen}>
                          <Icon as={FaCheckCircle} />
                        </Box>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      borderWidth="2px"
                      borderColor={selectedPaymentMethod === 'card' ? primaryGreen : 'gray.200'}
                      rounded="lg"
                      p={3}
                      onClick={() => setSelectedPaymentMethod('card')}
                      bg={selectedPaymentMethod === 'card' ? 'green.50' : 'transparent'}
                      _hover={{ bg: 'green.50' }}
                      flexDir="column"
                      height="auto"
                      width="100px"
                    >
                      <Icon as={FaCreditCard} w={6} h={6} color="gray.500" mb={1} />
                      <Text fontSize="sm" color="var(--medium-gray-text)">
                        Card
                      </Text>
                      {selectedPaymentMethod === 'card' && (
                        <Box position="absolute" top={1} right={1} color={primaryGreen}>
                          <Icon as={FaCheckCircle} />
                        </Box>
                      )}
                    </Button>
                  </HStack>
                </Box>

                <Flex width="full" justify="space-between" align="center">
                  <Text fontSize="xl" fontWeight="bold" color={textColor} fontFamily="var(--font-lexend-deca)}">
                    Total:
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color={primaryGreen} fontFamily="var(--font-lexend-deca)}">
                    R {totalCartPrice.toFixed(2)}
                  </Text>
                </Flex>

                <Button
                  size="lg"
                  width="full"
                  colorScheme="green"
                  bg={primaryGreen}
                  _hover={{ bg: 'green.600', shadow: 'md' }}
                  onClick={handlePlaceOrder}
                  isDisabled={cartItems.length === 0}
                  fontWeight="semibold"
                  fontFamily="var(--font-lexend-deca)}"
                >
                  Place Order with {selectedPaymentMethod === 'cash' ? 'Cash' : 'Card'}
                </Button>
              </VStack>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      {/* Floating Cart Button */}
      <Box
        position="fixed"
        bottom={4}
        right={4}
        zIndex={100}
      >
        <Button
          onClick={handleCartButtonClick}
          colorScheme="green"
          size="lg"
          rounded="full"
          height="50px"
          width="50px"
          shadow="lg"
          _hover={{
            bg: 'green.600',
            transform: 'scale(1.05)',
          }}
          transition="all 0.2s ease-in-out"
          position="relative"
          bg={primaryGreen}
          mb={totalCartItems > 0 || activeOrdersCount > 0 ? '60px' : '0'}
        >
          <Icon as={FaShoppingCart} w={5} h={5} />
          {totalCartItems > 0 && (
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
              {totalCartItems}
            </Badge>
          )}
        </Button>

        {/* New "Track Order" Button */}
        {(orderedMeals.length > 0 || activeOrdersCount > 0) && (
          <Button
            onClick={handleTrackOrderClick}
            colorScheme="blue"
            size="lg"
            rounded="full"
            height="50px"
            width="50px"
            shadow="lg"
            _hover={{
              bg: 'blue.600',
              transform: 'scale(1.05)',
            }}
            transition="all 0.2s ease-in-out"
            position="absolute"
            bottom="0px"
            right="0px"
            bg="blue.500"
            mt={2}
          >
            <Icon as={FaClipboardList} w={5} h={5} />
            {activeOrdersCount > 0 && (
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
            )}
          </Button>
        )}
      </Box>
    </Flex>
  );
};

export default CustomerMenuPage;
