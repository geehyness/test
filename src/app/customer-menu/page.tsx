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
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  Badge,
  Icon, // Import Icon component from Chakra UI
  Spacer, // Import Spacer component from Chakra UI
} from '@chakra-ui/react';
import { AddIcon, MinusIcon, DeleteIcon } from '@chakra-ui/icons'; // Removed ShoppingCartIcon
import { FaShoppingCart } from 'react-icons/fa'; // New: Import FaShoppingCart from react-icons/fa
import { fetchData } from '../lib/api';

// Define interfaces for your data structure, now reflecting 'foods' and 'food_categories'
interface FoodItem {
  id: number;
  name: string;
  code: string;
  hsn: string;
  cost: number;
  price: number;
  price_include_gst?: boolean;
  image?: string;
  cost_include_gst?: boolean;
  sale_price?: number;
  gst_percentage?: number;
  food_category_id: number;
  food_brand_id?: number;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  kitchen_id?: number;
}

interface FoodCategoryItem {
  id: number;
  name: string;
  code: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

// New: Interface for an item in the shopping cart
interface CartItem extends FoodItem {
  quantity: number;
}

interface GroupedFoodCategory {
  id: number;
  name: string;
  image?: string;
  items: FoodItem[];
}

export default function CustomerMenuPage() {
  const [foodCategories, setFoodCategories] = useState<FoodCategoryItem[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null); // null means "All Categories"

  // New: Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Chakra UI color mode values for dynamic styling
  const cardBg = useColorModeValue('var(--background-color-light)', 'gray.700');
  const textColor = useColorModeValue('var(--dark-gray-text)', 'white');
  const headingColor = useColorModeValue('var(--text-color-dark)', 'white');
  const categoryButtonInactiveBg = useColorModeValue('gray.100', 'gray.800');
  const categoryButtonInactiveText = useColorModeValue('var(--medium-gray-text)', 'gray.300');
  const cartDrawerBg = useColorModeValue('var(--background-color-light)', 'gray.800');
  const cartHeaderColor = useColorModeValue('var(--text-color-dark)', 'white');
  const cartItemBorderColor = useColorModeValue('var(--border-color)', 'gray.600');

  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const categoriesData: FoodCategoryItem[] = await fetchData('food_categories');
      const foodsData: FoodItem[] = await fetchData('foods');

      setFoodCategories(categoriesData);
      setFoods(foodsData);

      // Initially, show "All Categories" by setting activeCategoryId to null
      setActiveCategoryId(null);
    } catch (err) {
      console.error('Failed to fetch menu data:', err);
      setError('Failed to load menu. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  // Group foods by category and filter based on activeCategoryId
  const groupedFoods = React.useMemo(() => {
    const groups: { [key: number]: GroupedFoodCategory } = {};

    foodCategories.forEach((category) => {
      groups[category.id] = {
        id: category.id,
        name: category.name,
        image: category.image,
        items: [],
      };
    });

    foods.forEach((food) => {
      if (groups[food.food_category_id]) {
        groups[food.food_category_id].items.push(food);
      }
    });

    // If 'activeCategoryId' is null, show all categories with items.
    // Otherwise, show only the active category if it has items.
    return Object.values(groups).filter(group =>
      group.items.length > 0 &&
      (activeCategoryId === null || group.id === activeCategoryId)
    );
  }, [foods, foodCategories, activeCategoryId]);

  // Cart Functions
  const addToCart = (foodItem: FoodItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === foodItem.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === foodItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { ...foodItem, quantity: 1 }];
      }
    });
  };

  const updateCartItemQuantity = (itemId: number, newQuantity: number) => {
    setCartItems(prevItems => {
      if (newQuantity <= 0) {
        return prevItems.filter(item => item.id !== itemId);
      }
      return prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const removeFromCart = (itemId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const calculateCartTotal = React.useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const totalCartItems = React.useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);


  if (loading) {
    return (
      <Flex justify="center" align="center" minH="70vh">
        <Spinner size="xl" color="var(--primary-green)" />
        <Text ml={4} fontSize="xl" color="var(--medium-gray-text)">Loading menu...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={10}>
        <Alert status="error" variant="left-accent" rounded="md">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={10} px={{ base: 4, md: 8 }}>
      <VStack spacing={10} align="stretch">
        <Heading as="h1" size="2xl" textAlign="center" color={headingColor} fontFamily="var(--font-lexend-deca)" mb={6}>
          Our Delicious Menu
        </Heading>

        {/* Category Navigation */}
        <HStack spacing={4} wrap="wrap" justify="center" mb={8}>
          {/* "All Categories" Button */}
          <Button
            onClick={() => setActiveCategoryId(null)} // Set to null to show all
            size="lg"
            px={6}
            py={3}
            rounded="full"
            fontWeight="medium"
            fontSize="md"
            bg={activeCategoryId === null ? 'var(--primary-green)' : categoryButtonInactiveBg}
            color={activeCategoryId === null ? 'var(--background-color-light)' : categoryButtonInactiveText}
            _hover={{
              bg: activeCategoryId === null ? 'var(--primary-green)' : 'gray.200',
              color: activeCategoryId === null ? 'var(--background-color-light)' : 'var(--text-color-dark)',
            }}
            shadow={activeCategoryId === null ? 'md' : 'sm'}
            transition="all 0.2s ease-in-out"
          >
            All Categories
          </Button>

          {/* Other Category Buttons */}
          {foodCategories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              size="lg"
              px={6}
              py={3}
              rounded="full"
              fontWeight="medium"
              fontSize="md"
              bg={activeCategoryId === category.id ? 'var(--primary-green)' : categoryButtonInactiveBg}
              color={activeCategoryId === category.id ? 'var(--background-color-light)' : categoryButtonInactiveText}
              _hover={{
                bg: activeCategoryId === category.id ? 'var(--primary-green)' : 'gray.200',
                color: activeCategoryId === category.id ? 'var(--background-color-light)' : 'var(--text-color-dark)',
              }}
              shadow={activeCategoryId === category.id ? 'md' : 'sm'}
              transition="all 0.2s ease-in-out"
            >
              {category.name}
            </Button>
          ))}
        </HStack>

        {groupedFoods.length === 0 && (
          <Text textAlign="center" fontSize="xl" color="var(--medium-gray-text)" py={10}>
            No items found in this category.
          </Text>
        )}

        {/* Food Items Display */}
        {groupedFoods.map((group) => (
          <Box key={group.id} pt={6}>
            {activeCategoryId === null && ( // Only show category heading if "All Categories" is active
              <Flex align="center" mb={6}>
                {group.image && (
                  <ChakraImage
                    src={group.image}
                    alt={group.name}
                    boxSize="50px"
                    objectFit="cover"
                    rounded="lg"
                    mr={4}
                  />
                )}
                <Heading as="h2" size="xl" color={headingColor} fontFamily="var(--font-lexend-deca)">
                  {group.name}
                </Heading>
              </Flex>
            )}
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
              spacing={8}
            >
              {group.items.map((item) => (
                <Card
                  key={item.id}
                  maxW="sm"
                  bg={cardBg}
                  rounded="xl"
                  shadow="lg"
                  overflow="hidden"
                  _hover={{
                    shadow: '2xl',
                    transform: 'translateY(-8px)',
                    transition: 'all 0.3s ease-in-out',
                  }}
                  transition="all 0.2s ease-in-out"
                  borderWidth="1px"
                  borderColor="var(--border-color)"
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
                  <CardBody>
                    <Stack spacing={3}>
                      <Heading size="md" color={textColor} fontFamily="var(--font-lexend-deca)" noOfLines={1}>
                        {item.name}
                      </Heading>
                      <Text color="var(--primary-green)" fontSize="3xl" fontWeight="bold">
                        R {item.price.toFixed(2)}
                      </Text>
                    </Stack>
                  </CardBody>
                  <Divider borderColor="var(--border-color)" />
                  <CardFooter>
                    <Button
                      variant="solid"
                      colorScheme="green"
                      width="full"
                      size="lg"
                      rounded="lg"
                      _hover={{
                        bg: 'green.600',
                      }}
                      fontFamily="var(--font-lexend-deca)"
                      fontWeight="semibold"
                      onClick={() => addToCart(item)}
                    >
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </VStack>

      {/* Floating Cart Button */}
      <Box
        position="fixed"
        bottom={8}
        right={8}
        zIndex={100}
      >
        <Button
          onClick={() => setIsCartOpen(true)}
          colorScheme="green"
          size="lg"
          rounded="full"
          height="60px"
          width="60px"
          shadow="2xl"
          _hover={{
            bg: 'green.600',
            transform: 'scale(1.05)',
          }}
          transition="all 0.2s ease-in-out"
          position="relative"
        >
          {/* Using Icon component with FaShoppingCart */}
          <Icon as={FaShoppingCart} w={6} h={6} />
          {totalCartItems > 0 && (
            <Badge
              colorScheme="red"
              position="absolute"
              top="-5px"
              right="-5px"
              rounded="full"
              px={2}
              py={1}
              fontSize="sm"
              fontWeight="bold"
            >
              {totalCartItems}
            </Badge>
          )}
        </Button>
      </Box>

      {/* Shopping Cart Drawer */}
      <Drawer
        isOpen={isCartOpen}
        placement="right"
        onClose={() => setIsCartOpen(false)}
        size={{ base: 'full', md: 'md' }}
      >
        <DrawerOverlay />
        <DrawerContent bg={cartDrawerBg}>
          <DrawerCloseButton color={cartHeaderColor} />
          <DrawerHeader borderBottomWidth="1px" borderColor={cartItemBorderColor} color={cartHeaderColor} fontFamily="var(--font-lexend-deca)">
            Your Cart ({totalCartItems} items)
          </DrawerHeader>

          <DrawerBody>
            {cartItems.length === 0 ? (
              <Flex direction="column" align="center" justify="center" height="full">
                <Icon as={FaShoppingCart} w={16} h={16} color="gray.400" mb={4} /> {/* Using Icon with FaShoppingCart here too */}
                <Text fontSize="xl" color="var(--medium-gray-text)">Your cart is empty.</Text>
              </Flex>
            ) : (
              <VStack spacing={4} align="stretch">
                {cartItems.map((item) => (
                  <HStack key={item.id} p={3} borderWidth="1px" borderColor={cartItemBorderColor} rounded="lg" shadow="sm">
                    {item.image && (
                      <ChakraImage
                        src={item.image}
                        alt={item.name}
                        boxSize="70px"
                        objectFit="cover"
                        rounded="md"
                        mr={3}
                      />
                    )}
                    <Box flex="1">
                      <Text fontWeight="semibold" color={textColor} noOfLines={1}>{item.name}</Text>
                      <Text fontSize="sm" color="var(--medium-gray-text)">R {item.price.toFixed(2)} each</Text>
                      <HStack mt={2}>
                        <IconButton
                          aria-label="Decrease quantity"
                          icon={<MinusIcon />}
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          isDisabled={item.quantity <= 1}
                        />
                        <Text fontWeight="bold" color={textColor}>{item.quantity}</Text>
                        <IconButton
                          aria-label="Increase quantity"
                          icon={<AddIcon />}
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        />
                        <Spacer /> {/* Spacer needs to be imported */}
                        <IconButton
                          aria-label="Remove item"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => removeFromCart(item.id)}
                        />
                      </HStack>
                    </Box>
                    <Text fontWeight="bold" color="var(--primary-green)">R {(item.price * item.quantity).toFixed(2)}</Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" borderColor={cartItemBorderColor}>
            <VStack width="full" spacing={4}>
              <Flex width="full" justify="space-between" align="center">
                <Text fontSize="xl" fontWeight="bold" color={headingColor}>Total:</Text>
                <Text fontSize="xl" fontWeight="bold" color="var(--primary-green)">R {calculateCartTotal.toFixed(2)}</Text>
              </Flex>
              <Button
                colorScheme="green"
                size="lg"
                width="full"
                rounded="lg"
                onClick={() => {
                  alert('Proceeding to checkout! (This is a demo action)');
                  setIsCartOpen(false);
                  setCartItems([]); // Clear cart after "checkout"
                }}
                isDisabled={cartItems.length === 0}
                fontFamily="var(--font-lexend-deca)"
                fontWeight="semibold"
              >
                Proceed to Checkout
              </Button>
            </VStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Container>
  );
}