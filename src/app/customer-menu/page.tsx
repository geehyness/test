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
  Drawer, // This will be removed
  DrawerBody, // This will be removed
  DrawerFooter, // This will be removed
  DrawerHeader, // This will be removed
  DrawerOverlay, // This will be removed
  DrawerContent, // This will be removed
  DrawerCloseButton, // This will be removed
  IconButton,
  Badge,
  Icon,
  Spacer,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Link as ChakraLink,
  Image,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter // Added ModalFooter for cart
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

// Define the FoodItem interface based on your data structure
interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // Keep this as 'category'
  image?: string; // Optional image URL
}

interface FoodCategoryData {
  id: string;
  name: string;
  code: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

interface FoodCategory {
  id: string;
  name: string;
  icon: React.ElementType; // Icon component for the category
}

interface CartItem extends FoodItem {
  quantity: number;
}

interface NavItemProps {
  icon: React.ElementType;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void; // Optional click handler for category filtering
}

const NavItem: React.FC<NavItemProps> = ({ icon, children, isActive, onClick }) => {
  const activeBg = useColorModeValue('var(--navbar-main-item-active-bg)', 'var(--navbar-main-item-active-bg)');
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
        fontWeight="medium"
        transition="all 0.2s ease-in-out"
      >
        <Icon
          mr="4"
          fontSize="16"
          _groupHover={{
            color: activeColor,
          }}
          as={icon}
        />
        {children}
      </Flex>
    </ChakraLink>
  );
};


const CustomerMenuPage: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { isOpen: isCartOpen, onOpen: onCartOpen, onClose: onCartClose } = useDisclosure(); // Changed to be used with Modal

  const { isOpen: isDetailsModalOpen, onOpen: onDetailsModalOpen, onClose: onDetailsModalClose } = useDisclosure();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dynamicCategories, setDynamicCategories] = useState<FoodCategory[]>([]); // This state holds the categories derived from your data


  const primaryGreen = useColorModeValue('var(--primary-green)', 'var(--primary-green)');
  const textColor = useColorModeValue('var(--dark-gray-text)', 'white');
  const cardBg = useColorModeValue('var(--background-color-light)', 'gray.800');
  const borderColor = useColorModeValue('var(--border-color)', 'gray.700');
  // const drawerContentBg = useColorModeValue('var(--background-color-light)', 'gray.900'); // No longer needed
  const modalContentBg = useColorModeValue('var(--background-color-light)', 'gray.900'); // Re-using for both modals

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
      default: return FaUtensils; // A generic icon for categories without a specific mapping
    }
  };


  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch both foods and food_categories
      const [foodsData, categoriesData] = await Promise.all([
        fetchData('foods'),
        fetchData('food_categories'),
      ]);

      // Create a map for category IDs to names
      const categoryMap = new Map<string, string>();
      categoriesData.forEach((cat: FoodCategoryData) => {
        categoryMap.set(cat.id, cat.name);
      });

      // Map food items to include the actual category name
      const processedFoods: FoodItem[] = foodsData.map((food: any) => ({
        ...food,
        category: categoryMap.get(food.food_category_id) || 'Uncategorized', // Use category name from map
        description: food.description || 'No description available.', // Ensure description exists
      }));

      setFoods(processedFoods);

      // Extract unique categories from the fetched food items
      const uniqueCategories = new Set<string>();
      processedFoods.forEach((food: FoodItem) => {
        if (food.category) {
          uniqueCategories.add(food.category);
        }
      });

      // Construct the list of categories for navigation
      const generatedCategories: FoodCategory[] = [{ id: 'All', name: 'All', icon: FaUtensils }]; // Always include 'All'
      Array.from(uniqueCategories)
        .sort((a, b) => a.localeCompare(b)) // Sort categories alphabetically
        .forEach(cat => {
          generatedCategories.push({
            id: cat,
            name: cat,
            icon: getCategoryIcon(cat)
          });
        });
      setDynamicCategories(generatedCategories); // Update the state with dynamic categories

    } catch (err) {
      setError('Failed to load menu items.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const openDetailsModal = (food: FoodItem) => {
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

    const matchesCategory = selectedCategory === 'All' || (food.category && food.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Group filtered foods to display only the selected category or all
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
        items: filteredFoods.filter(food => food.category && food.category.toLowerCase() === selectedCategory.toLowerCase())
      });
    }
  }

  const addToCart = (item: FoodItem) => {
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
  const totalCartPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" color={primaryGreen} />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error:</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'center' }} justify="space-between" mb={8} wrap="wrap">
        <Box mb={{ base: 4, md: 0 }}>
          <Heading as="h1" size="xl" color={textColor} mb={2} fontFamily="var(--font-lexend-deca)">
            Our Delicious Menu
          </Heading>
          <Text fontSize="lg" color="var(--medium-gray-text)" fontFamily="var(--font-lexend-deca)">
            Discover a wide variety of culinary delights.
          </Text>
        </Box>

        <HStack spacing={4}>
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              rounded="md"
              focusBorderColor={primaryGreen}
              fontFamily="var(--font-lexend-deca)"
            />
          </InputGroup>
        </HStack>
      </Flex>

      {/* Category Navigation - Now using SimpleGrid */}
      <SimpleGrid
        columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} // Adjust columns as needed
        spacing={{ base: 2, md: 4 }}
        mb={8}
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
      </SimpleGrid>

      {groupedFoods.map((group) => (
        <Box key={group.id} mb={10}>
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
                  // Removed maxW="250px" to allow stretching
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
                        R {item.price.toFixed(2)}
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
                R {selectedFood?.price.toFixed(2)}
              </Text>

              {/* Add to Cart / Quantity Controls in Modal */}
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

      {/* Cart Modal - Replaced Drawer with Modal */}
      <Modal
        isOpen={isCartOpen}
        onClose={onCartClose}
        size={{ base: 'full', sm: 'md' }} // Similar sizing to the previous drawer
        isCentered // Centers the modal on the screen
      >
        <ModalOverlay />
        <ModalContent bg={modalContentBg} rounded="xl">
          <ModalCloseButton color={textColor} />
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor} color={textColor} fontFamily="var(--font-lexend-deca)">
            Your Order ({totalCartItems} items)
          </ModalHeader>

          <ModalBody>
            {cartItems.length === 0 ? (
              <Flex direction="column" align="center" justify="center" height="full" minH="200px"> {/* Added minH for empty cart */}
                <Icon as={FaShoppingCart} w={12} h={12} color="gray.400" mb={4} />
                <Text fontSize="lg" color="gray.500" fontFamily="var(--font-lexend-deca)">
                  Your cart is empty.
                </Text>
                <Text fontSize="md" color="gray.500" mt={2} fontFamily="var(--font-lexend-deca)">
                  Add some delicious items from the menu!
                </Text>
              </Flex>
            ) : (
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
                        R {item.price.toFixed(2)} x {item.quantity}
                      </Text>
                      <Text fontWeight="bold" color={primaryGreen} fontFamily="var(--font-lexend-deca)}">
                        R {(item.price * item.quantity).toFixed(2)}
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
            )}
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
            <VStack width="full" spacing={4}>
              <Flex width="full" justify="space-between" align="center">
                <Text fontSize="xl" fontWeight="bold" color={textColor} fontFamily="var(--font-lexend-deca)}">Total:</Text>
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
                onClick={() => {
                  alert('Proceeding to checkout! (This is a demo action)');
                  onCartClose();
                  setCartItems([]);
                }}
                isDisabled={cartItems.length === 0}
                fontWeight="semibold"
                fontFamily="var(--font-lexend-deca)}"
              >
                Place Order
              </Button>
            </VStack>
          </ModalFooter>
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
          onClick={onCartOpen} // This will now open the Modal
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
    </Container>
  );
};

export default CustomerMenuPage;