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
  Icon,
  Spacer,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Link as ChakraLink,
  Image
} from '@chakra-ui/react';
import { AddIcon, MinusIcon, DeleteIcon, SearchIcon, BellIcon, ChevronRightIcon } from '@chakra-ui/icons';
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
  FaTachometerAlt,
  FaBoxes,
  FaChartLine,
  FaUsers,
  FaReceipt
} from 'react-icons/fa';
import { fetchData } from '../lib/api';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isSubItem?: boolean;
  onClick?: () => void;
  href?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, isSubItem, onClick, href }) => {
  const inactiveBg = isSubItem ? 'var(--navbar-submenu-hover-bg)' : 'var(--navbar-main-item-hover-bg)';
  const activeBg = isSubItem ? 'var(--navbar-submenu-active-bg)' : 'var(--navbar-main-item-active-bg)';
  const inactiveText = isSubItem ? 'var(--navbar-submenu-inactive-text)' : 'var(--navbar-main-item-inactive-text)';
  const activeText = isSubItem ? 'var(--navbar-submenu-active-bg)' : 'var(--navbar-main-item-active-text)';

  return (
    <Button
      as={href ? ChakraLink : Button}
      {...(href && { href })}
      width="full"
      justifyContent="flex-start"
      variant="ghost"
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeText : inactiveText}
      _hover={{
        bg: isActive ? activeBg : inactiveBg,
        color: isActive ? activeText : 'var(--navbar-main-item-active-text)',
      }}
      _active={{
        bg: activeBg,
        color: activeText,
      }}
      px={isSubItem ? 8 : 4}
      py={3}
      rounded="md"
      fontSize="md"
      fontWeight={isActive ? 'semibold' : 'normal'}
      leftIcon={<Icon as={icon} mr={isSubItem ? 2 : 3} />}
      onClick={onClick}
      fontFamily="var(--font-lexend-deca)"
      position="relative"
    >
      {label}
      {isActive && (
        <Icon
          as={ChevronRightIcon}
          position="absolute"
          right={4}
          color={activeText}
          w={5} h={5}
        />
      )}
    </Button>
  );
};

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
  icon?: React.ElementType;
}

interface CartItem extends FoodItem {
  quantity: number;
}

interface GroupedFoodCategory {
  id: number;
  name: string;
  image?: string;
  icon?: React.ElementType;
  items: FoodItem[];
}

export default function CustomerMenuPage() {
  const [foodCategories, setFoodCategories] = useState<FoodCategoryItem[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true); // Corrected this line
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [activeMenuItem, setActiveMenuItem] = useState<string>('Menu');
  const { isOpen: isDashboardOpen, onToggle: onToggleDashboard } = useDisclosure();


  const bgColor = useColorModeValue('var(--light-gray-bg)', 'gray.900');
  const cardBg = useColorModeValue('var(--background-color-light)', 'gray.800');
  const textColor = useColorModeValue('var(--dark-gray-text)', 'whiteAlpha.900');
  const headingColor = useColorModeValue('var(--text-color-dark)', 'whiteAlpha.900');
  const primaryGreen = 'var(--primary-green)';
  const categoryInactiveBg = useColorModeValue('var(--background-color-light)', 'gray.700');
  const categoryInactiveText = useColorModeValue('var(--medium-gray-text)', 'gray.300');
  const cartDrawerBg = useColorModeValue('var(--background-color-light)', 'gray.800');
  const borderColor = useColorModeValue('var(--border-color)', 'gray.700');

  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const categoriesData: FoodCategoryItem[] = await fetchData('food_categories');
      const foodsData: FoodItem[] = await fetchData('foods');

      // Process foodsData to ensure price and cost are numbers
      const processedFoodsData = foodsData.map(food => ({
        ...food,
        price: Number(food.price),
        cost: Number(food.cost)
      }));

      const categoriesWithIcons = categoriesData.map(cat => {
        let iconComponent: React.ElementType | undefined;
        if (cat.name.toLowerCase().includes('breakfast')) iconComponent = FaBreadSlice;
        else if (cat.name.toLowerCase().includes('pizza') || cat.name.toLowerCase().includes('pasta')) iconComponent = FaPizzaSlice;
        else if (cat.name.toLowerCase().includes('burger')) iconComponent = FaHamburger;
        else if (cat.name.toLowerCase().includes('drink') || cat.name.toLowerCase().includes('beverage')) iconComponent = FaCocktail;
        else if (cat.name.toLowerCase().includes('bbq') || cat.name.toLowerCase().includes('chicken')) iconComponent = FaDrumstickBite;
        else if (cat.name.toLowerCase().includes('soup')) iconComponent = FaUtensils;
        else iconComponent = FaUtensils;
        return { ...cat, icon: iconComponent };
      });

      setFoodCategories(categoriesWithIcons);
      setFoods(processedFoodsData);

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

  const groupedFoods = React.useMemo(() => {
    const groups: { [key: number]: GroupedFoodCategory } = {};

    foodCategories.forEach((category) => {
      groups[category.id] = {
        id: category.id,
        name: category.name,
        image: category.image,
        icon: category.icon,
        items: [],
      };
    });

    const filteredFoods = foods.filter(food =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredFoods.forEach((food) => {
      if (groups[food.food_category_id]) {
        groups[food.food_category_id].items.push(food);
      }
    });

    return Object.values(groups).filter(group =>
      group.items.length > 0 &&
      (activeCategoryId === null || group.id === activeCategoryId)
    );
  }, [foods, foodCategories, activeCategoryId, searchTerm]);

  const getCartItemQuantity = (foodItemId: number) => {
    const item = cartItems.find(cartItem => cartItem.id === foodItemId);
    return item ? (Number.isFinite(item.quantity) ? item.quantity : 0) : 0;
  };

  const addToCart = (foodItem: FoodItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === foodItem.id);
      if (existingItem) {
        const currentNumericalQuantity = Number.isFinite(existingItem.quantity) ? existingItem.quantity : 0;
        const updatedQuantity = currentNumericalQuantity + 1;
        return prevItems.map(item =>
          item.id === foodItem.id ? { ...item, quantity: updatedQuantity } : item
        );
      } else {
        return [...prevItems, { ...foodItem, quantity: 1 }];
      }
    });
    setIsCartOpen(true);
  };

  const updateCartItemQuantity = (itemId: number, newQuantity: number) => {
    setCartItems(prevItems => {
      const validatedNewQuantity = Number.isFinite(newQuantity) ? newQuantity : 0;

      if (validatedNewQuantity < 1) {
        return prevItems.filter(item => item.id !== itemId);
      }
      return prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: validatedNewQuantity } : item
      );
    });
  };

  const removeFromCart = (itemId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const calculateCartTotal = React.useMemo(() => {
    return cartItems.reduce((total, item) => {
      const itemPrice = Number.isFinite(item.price) ? item.price : 0;
      const itemQuantity = Number.isFinite(item.quantity) ? item.quantity : 0;
      return total + itemPrice * itemQuantity;
    }, 0);
  }, [cartItems]);

  const totalCartItems = React.useMemo(() => {
    return cartItems.reduce((total, item) => {
      const itemQuantity = Number.isFinite(item.quantity) ? item.quantity : 0;
      return total + itemQuantity;
    }, 0);
  }, [cartItems]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="70vh" bg={bgColor}>
        <Spinner size="xl" color={primaryGreen} />
        <Text ml={4} fontSize="xl" color={textColor}>Loading menu...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={10} bg={bgColor}>
        <Alert status="error" variant="left-accent" rounded="md">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  const getFoodCountForCategory = (categoryId: number | null) => {
    if (categoryId === null) {
      return foods.filter(food => food.name.toLowerCase().includes(searchTerm.toLowerCase())).length;
    }
    return foods.filter(food => food.food_category_id === categoryId && food.name.toLowerCase().includes(searchTerm.toLowerCase())).length;
  };

  return (
    <Flex minH="100vh" bg={bgColor}>
      {/* Main Content Area - Centered with margins */}
      <Box
        flex="1"
        maxW="1200px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        pt={{ base: '100px', md: '100px' }}
        pb={{ base: 4, md: 8 }}
      >
        {/* Top Bar for Search and Notifications - Now aligns with main content width */}
        <Flex
          position="fixed"
          top="0"
          left="50%"
          transform="translateX(-50%)"
          zIndex="10"
          bg={cardBg}
          rounded="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
          maxW="1200px"
          width="full"
          px={{ base: 4, md: 8 }}
        >
          {/* Inner Box for content, simplified as parent Flex handles maxW and px */}
          <Box width="full" py={4}>
            <Flex justifyContent="space-between" alignItems="center">
              {/* Logo added here */}
              <HStack spacing={4} alignItems="center">
                <Image
                  src="/c2.png"
                  alt="Company Logo"
                  boxSize="40px"
                  objectFit="contain"
                />
                <InputGroup maxW="400px">
                  <InputLeftElement
                    pointerEvents="none"
                  >
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search product here..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    rounded="md"
                    bg={bgColor}
                    borderColor={borderColor}
                    _focus={{ borderColor: primaryGreen, boxShadow: 'none' }}
                    color={textColor}
                    fontFamily="var(--font-lexend-deca)"
                  />
                </InputGroup>
              </HStack>
              <HStack spacing={4}>
                <IconButton
                  aria-label="Notifications"
                  icon={<BellIcon w={5} h={5} />}
                  variant="ghost"
                  color={textColor}
                  _hover={{ bg: 'gray.100' }}
                  rounded="full"
                />
                {/* Cart button in top bar - now visible on all screen sizes */}
                <Button
                  onClick={() => setIsCartOpen(true)}
                  colorScheme="green"
                  size="md"
                  rounded="md"
                  leftIcon={<Icon as={FaShoppingCart} />}
                  fontFamily="var(--font-lexend-deca)"
                  bg={primaryGreen}
                >
                  Cart ({totalCartItems})
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Flex>

        {/* Category Navigation */}
        <HStack spacing={4} wrap="wrap" justify="flex-start" mb={8} mt={{ base: 0, md: 0 }}>
          <VStack
            onClick={() => setActiveCategoryId(null)}
            cursor="pointer"
            p={3}
            rounded="lg"
            bg={activeCategoryId === null ? primaryGreen : categoryInactiveBg}
            color={activeCategoryId === null ? 'white' : categoryInactiveText}
            _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            transition="all 0.2s ease-in-out"
            minW="120px"
            align="center"
            borderWidth="1px"
            borderColor={activeCategoryId === null ? primaryGreen : borderColor}
          >
            <Icon as={FaUtensils} w={6} h={6} mb={1} />
            <Text fontWeight="medium" fontSize="sm" fontFamily="var(--font-lexend-deca)">All</Text>
            <Text fontSize="xs" opacity={0.8} fontFamily="var(--font-lexend-deca)}">{getFoodCountForCategory(null)} items</Text>
          </VStack>

          {foodCategories.map((category) => {
            const itemCount = getFoodCountForCategory(category.id);
            return (
              <VStack
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                cursor="pointer"
                p={3}
                rounded="lg"
                bg={activeCategoryId === category.id ? primaryGreen : categoryInactiveBg}
                color={activeCategoryId === category.id ? 'white' : categoryInactiveText}
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s ease-in-out"
                minW="120px"
                align="center"
                borderWidth="1px"
                borderColor={activeCategoryId === category.id ? primaryGreen : borderColor}
              >
                <Icon as={category.icon || FaUtensils} w={6} h={6} mb={1} />
                <Text fontWeight="medium" fontSize="sm" fontFamily="var(--font-lexend-deca)}">{category.name}</Text>
                <Text fontSize="xs" opacity={0.8} fontFamily="var(--font-lexend-deca)}">{itemCount} items</Text>
              </VStack>
            );
          })}
        </HStack>

        {groupedFoods.length === 0 && (
          <Text textAlign="center" fontSize="xl" color={textColor} py={10} fontFamily="var(--font-lexend-deca)">
            No items found in this category or matching your search.
          </Text>
        )}

        {/* Food Items Display */}
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
          spacing={6}
        >
          {groupedFoods.flatMap((group) =>
            group.items.map((item) => {
              const currentQuantity = getCartItemQuantity(item.id);
              return (
                <Card
                  key={item.id}
                  maxW="200px"
                  bg={cardBg}
                  rounded="lg"
                  shadow="sm"
                  overflow="hidden"
                  _hover={{
                    shadow: 'md',
                    transform: 'translateY(-4px)',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  transition="all 0.1s ease-in-out"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  {item.image && (
                    <ChakraImage
                      src={item.image}
                      alt={item.name}
                      height="120px"
                      objectFit="cover"
                      width="100%"
                      roundedTop="lg"
                    />
                  )}
                  <CardBody p={3}>
                    <VStack spacing={1} align="stretch">
                      <Text fontWeight="semibold" fontSize="sm" color={textColor} noOfLines={1} fontFamily="var(--font-lexend-deca)">
                        {item.name}
                      </Text>
                      <Text color={primaryGreen} fontSize="md" fontWeight="bold" fontFamily="var(--font-lexend-deca)">
                        R {item.price.toFixed(2)}
                      </Text>
                    </VStack>
                  </CardBody>
                  <Divider borderColor={borderColor} />
                  <CardFooter p={2}>
                    <Flex width="full" justify="space-between" align="center">
                      {currentQuantity === 0 ? (
                        <Button
                          variant="solid"
                          colorScheme="green"
                          size="sm"
                          width="full"
                          rounded="md"
                          onClick={() => addToCart(item)}
                          fontWeight="normal"
                          fontSize="sm"
                          bg={primaryGreen}
                          fontFamily="var(--font-lexend-deca)"
                        >
                          Add
                        </Button>
                      ) : (
                        <HStack width="full" justify="center">
                          <IconButton
                            aria-label="Decrease quantity"
                            icon={<MinusIcon />}
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.id, currentQuantity - 1)}
                            isDisabled={currentQuantity <= 0}
                            rounded="md"
                          />
                          <Text fontWeight="bold" color={textColor} fontSize="md" fontFamily="var(--font-lexend-deca)">{currentQuantity}</Text>
                          <IconButton
                            aria-label="Increase quantity"
                            icon={<AddIcon />}
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.id, currentQuantity + 1)}
                            rounded="md"
                          />
                        </HStack>
                      )}
                    </Flex>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </SimpleGrid>
      </Box>

      {/* Right Sidebar (Cart) */}
      <Drawer
        isOpen={isCartOpen}
        placement="right"
        onClose={() => setIsCartOpen(false)}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent
          bg={cartDrawerBg}
          rounded="none"
          shadow="lg"
        >
          <DrawerCloseButton color={headingColor} />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} color={headingColor} fontFamily="var(--font-lexend-deca)" py={4} px={4}>
            Your Cart ({totalCartItems} items)
          </DrawerHeader>

          <DrawerBody p={4}>
            {cartItems.length === 0 ? (
              <Flex direction="column" align="center" justify="center" height="full" py={10}>
                <Icon as={FaShoppingCart} w={12} h={12} color="gray.300" mb={4} />
                <Text fontSize="lg" color={textColor} fontFamily="var(--font-lexend-deca)">Your cart is empty.</Text>
              </Flex>
            ) : (
              <VStack spacing={3} align="stretch">
                {cartItems.map((item) => (
                  <HStack key={item.id} p={2} borderWidth="1px" borderColor={borderColor} rounded="md" shadow="xs" bg={cardBg}>
                    {item.image && (
                      <ChakraImage
                        src={item.image}
                        alt={item.name}
                        boxSize="60px"
                        objectFit="cover"
                        rounded="sm"
                        mr={2}
                      />
                    )}
                    <Box flex="1">
                      <Text fontWeight="medium" color={textColor} noOfLines={1} fontSize="sm" fontFamily="var(--font-lexend-deca)}">{item.name}</Text>
                      <Text fontSize="xs" color="gray.500" fontFamily="var(--font-lexend-deca)}">R {item.price.toFixed(2)} each</Text>
                      <HStack mt={1} spacing={1}>
                        <IconButton
                          aria-label="Decrease quantity"
                          icon={<MinusIcon />}
                          size="xs"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          isDisabled={item.quantity <= 0}
                          rounded="sm"
                        />
                        <Text fontWeight="bold" color={textColor} fontSize="sm" fontFamily="var(--font-lexend-deca)}">{item.quantity}</Text>
                        <IconButton
                          aria-label="Increase quantity"
                          icon={<AddIcon />}
                          size="xs"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          rounded="sm"
                        />
                        <Spacer />
                        <IconButton
                          aria-label="Remove item"
                          icon={<DeleteIcon />}
                          size="xs"
                          colorScheme="red"
                          onClick={() => removeFromCart(item.id)}
                          rounded="sm"
                        />
                      </HStack>
                    </Box>
                    <Text fontWeight="bold" color={primaryGreen} fontSize="sm" fontFamily="var(--font-lexend-deca)}">R {(item.price * item.quantity).toFixed(2)}</Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" borderColor={borderColor} p={4}>
            <VStack width="full" spacing={3}>
              <Flex width="full" justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold" color={headingColor} fontFamily="var(--font-lexend-deca)">Total Amount:</Text>
                <Text fontSize="lg" fontWeight="bold" color={primaryGreen} fontFamily="var(--font-lexend-deca)">R {calculateCartTotal.toFixed(2)}</Text>
              </Flex>
              <Button
                colorScheme="green"
                bg={primaryGreen}
                size="lg"
                width="full"
                rounded="md"
                onClick={() => {
                  alert('Proceeding to checkout! (This is a demo action)');
                  setIsCartOpen(false);
                  setCartItems([]);
                }}
                isDisabled={cartItems.length === 0}
                fontWeight="semibold"
                fontFamily="var(--font-lexend-deca)"
              >
                Place Order
              </Button>
            </VStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Floating Cart Button */}
      <Box
        position="fixed"
        bottom={4}
        right={4}
        zIndex={100}
      >
        <Button
          onClick={() => setIsCartOpen(true)}
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
      </Box>
    </Flex>
  );
}