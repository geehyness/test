// src/app/customer-menu/[domain]/page.tsx - CORRECTED VERSION
"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback, useMemo } from "react";
// FIX: Added all missing Chakra UI component imports
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
  IconButton,
  Badge,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
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
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  ImageProps,
  StackProps,
  TextProps,
  IconButtonProps,
  SimpleGridProps,
  ButtonProps,
  TabsProps,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon, DeleteIcon, SearchIcon } from "@chakra-ui/icons";
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
  FaClipboardList,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
} from "react-icons/fa";
import { fetchData, getTenantSettings, getTenantByDomain, fetchDataWithContext } from "@/lib/api";
import { Table, Food, Category } from "@/lib/config/entities";
import { PaymentService } from "@/lib/payment-service";
import { payfastService } from "@/lib/payfast";

// Define a new interface for displaying food items, extending the base Food entity
interface DisplayFoodItem extends Food {
  categoryName: string;
  displayPrice: number;
  image?: string;
}

interface FoodCategory {
  id: string;
  name: string;
  icon: React.ElementType;
}

interface CartItem extends DisplayFoodItem {
  quantity: number;
}

interface OrderedMeal extends CartItem {
  status: "Preparing" | "Ready" | "Served";
  orderTime: string;
}

// Extend CSSProperties to include custom CSS variables
interface TenantCSSProperties extends React.CSSProperties {
  '--primary-green'?: string;
  '--secondary-color'?: string;
  '--background-color-light'?: string;
  '--card-background-color'?: string;
  '--dark-gray-text'?: string;
  '--medium-gray-text'?: string;
  '--accent-color'?: string;
  '--border-color'?: string;
  '--font-family'?: string;
  '--navbar-main-item-hover-bg'?: string;
  '--navbar-main-item-inactive-text'?: string;
}

interface TenantSettings {
  customer_page_settings?: {
    banner_image_url?: string;
    banner_overlay_opacity?: number;
    banner_overlay_color?: string;
    banner_overlay_blur?: number;
    banner_height?: number;
    banner_text?: string;
    banner_text_color?: string;
    show_banner?: boolean;
    show_banner_text?: boolean;
    logo_url?: string;
    logo_size?: 'small' | 'medium' | 'large' | 'custom';
    logo_custom_width?: number;
    logo_position?: 'top-left' | 'top-center' | 'top-right' | 'above-banner' | 'side-by-side' | 'center-banner' | 'bottom-banner';
    logo_margin_top?: number;
    logo_margin_bottom?: number;
    logo_margin_left?: number;
    logo_margin_right?: number;
    primary_color?: string;
    secondary_color?: string;
    background_color?: string;
    card_background_color?: string;
    text_color?: string;
    accent_color?: string;
    font_family?: string;
    heading_font_size?: string;
    body_font_size?: string;
    font_weight?: 'normal' | 'medium' | 'bold';
    layout_option?: 'classic' | 'modern' | 'minimal' | 'custom';
    card_style?: 'flat' | 'raised' | 'border' | 'gradient';
    card_shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    card_border_width?: number;
    card_border_color?: string;
    card_border_radius?: number;
    button_style?: 'rounded' | 'square' | 'pill';
    show_search_bar?: boolean;
    show_category_nav?: boolean;
    enable_animations?: boolean;
    social_links?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      website?: string;
    };
  };
}

interface NavItemProps {
  icon: React.ElementType;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  tenantStyles: any;
}

interface PageProps {
  params: Promise<{
    domain: string;
  }>;
  searchParams: Promise<{
    shop_id?: string;
    table_id?: string;
    preview?: string;
  }>;
}

// Helper function to convert tenant styles to Chakra-compatible colors
const getChakraColor = (value: string | number | undefined, fallback: string): string => {
  if (value === undefined || value === null) return fallback;

  // If it's a number, convert to string
  if (typeof value === 'number') {
    return fallback;
  }

  // If it's a CSS variable, ensure it's wrapped in var()
  if (typeof value === 'string' && value.startsWith('--')) {
    return `var(${value})`;
  }

  // If it's already a valid color, return as is
  return value;
};

const NavItem: React.FC<NavItemProps> = ({
  icon,
  children,
  isActive,
  onClick,
  tenantStyles,
}) => {
  const activeBg = tenantStyles['--secondary-color'] || '#333';
  const hoverBg = tenantStyles['--navbar-main-item-hover-bg'] || 'rgba(56, 161, 105, 0.1)';
  const activeColor = tenantStyles['--primary-green'] || '#38A169';
  const inactiveColor = tenantStyles['--navbar-main-item-inactive-text'] || '#2D374880';

  return (
    <Box
      px={3}
      py={2}
      borderRadius="lg"
      cursor="pointer"
      bg={isActive ? activeBg : "transparent"}
      color={isActive ? activeColor : inactiveColor}
      onClick={onClick}
      _hover={{
        bg: hoverBg,
        color: activeColor,
      }}
      fontWeight="bold"
      transition="all 0.2s ease-in-out"
      flexShrink={0}
    >
      {children}
    </Box>
  );
};

const MenuItemCard: React.FC<{
  item: DisplayFoodItem;
  onItemClick: (item: DisplayFoodItem) => void;
  onAddToCart: (item: DisplayFoodItem) => void;
  cartQuantity: number;
  tenantStyles: any;
  tenantSettings: TenantSettings | null;
}> = ({ item, onItemClick, onAddToCart, cartQuantity, tenantStyles, tenantSettings }) => {
  const primaryGreen = tenantStyles['--primary-green'] || '#38A169';
  const textColor = tenantStyles['--dark-gray-text'] || '#2D3748';

  const getCardStyles = () => {
    const settings = tenantSettings?.customer_page_settings;
    if (!settings) return {};

    const baseStyles = {
      bg: settings.card_background_color || '#FFFFFF',
      border: settings.card_style === 'border' ? `${settings.card_border_width || 1}px solid` : 'none',
      borderColor: settings.card_border_color || '#E2E8F0',
      borderRadius: `${settings.card_border_radius || 12}px`,
      shadow: settings.card_shadow || 'md',
    };

    if (settings.card_style === 'gradient') {
      return {
        ...baseStyles,
        bg: `linear-gradient(135deg, ${settings.card_background_color || '#FFFFFF'}, ${settings.primary_color || '#38A169'}20)`,
        border: 'none',
      };
    }

    return baseStyles;
  };

  return (
    <Card
      {...getCardStyles()}
      overflow="hidden"
      transition="all 0.2s ease-in-out"
      cursor="pointer"
      onClick={() => onItemClick(item)}
      _hover={{
        shadow: tenantSettings?.customer_page_settings?.card_style === 'flat' ? "md" : "lg",
        transform: "translateY(-5px)",
        borderColor: primaryGreen,
      }}
      role="article"
      aria-label={`${item.name} - ${item.description}`}
    >
      {item.image && (
        <ChakraImage
          src={item.image}
          alt={item.name}
          height="200px"
          objectFit="cover"
          width="100%"
          roundedTop="xl"
          loading="lazy"
          // FIX: Changed fallbackSrc to fallback
          fallback={
            <Box bg="gray.100" height="200px" />
          }
        />
      )}
      <CardBody p={4}>
        {/* FIX: Removed redundant `as` prop */}
        <VStack spacing={2} align="stretch">
          {/* FIX: Removed redundant `as` prop */}
          <Text
            fontWeight="bold"
            fontSize="lg"
            color={textColor}
            noOfLines={2}
            fontFamily={tenantStyles['--font-family'] || 'Inter, sans-serif'}
          >
            {item.name}
          </Text>
          {/* FIX: Removed redundant `as` prop */}
          <Text
            fontSize="sm"
            color={tenantStyles['--medium-gray-text'] || '#4A556899'}
            noOfLines={2}
            fontFamily={tenantStyles['--font-family'] || 'Inter, sans-serif'}
          >
            {item.description}
          </Text>
          <Text
            color={primaryGreen}
            fontSize="xl"
            fontWeight="extrabold"
            fontFamily={tenantStyles['--font-family'] || 'Inter, sans-serif'}
          >
            R {item.displayPrice.toFixed(2)}
          </Text>
        </VStack>
      </CardBody>

      <Divider />

      <CardFooter p={4}>
        {cartQuantity === 0 ? (
          <Button
            variant="solid"
            colorScheme="green"
            size="md"
            width="full"
            rounded={tenantSettings?.customer_page_settings?.button_style === 'pill' ? 'full' :
              tenantSettings?.customer_page_settings?.button_style === 'square' ? 'none' : 'lg'}
            onClick={(e: { stopPropagation: () => void; }) => {
              e.stopPropagation();
              onAddToCart(item);
            }}
            fontWeight="semibold"
            fontSize="md"
            bg={primaryGreen}
            _hover={{ bg: "green.600", shadow: "md" }}
            fontFamily={tenantStyles['--font-family'] || 'Inter, sans-serif'}
            aria-label={`Add ${item.name} to cart`}
          >
            Add to Cart
          </Button>
        ) : (
          <HStack width="full" justify="space-between">
            {/* FIX: Changed disabled to isDisabled and removed redundant `as` prop */}
            <IconButton
              aria-label={`Decrease quantity of ${item.name}`}
              icon={<MinusIcon />}
              size="md"
              onClick={(e: { stopPropagation: () => void; }) => {
                e.stopPropagation();
                // This will be handled by parent
              }}
              isDisabled={cartQuantity <= 0}
              rounded={tenantSettings?.customer_page_settings?.button_style === 'pill' ? 'full' :
                tenantSettings?.customer_page_settings?.button_style === 'square' ? 'none' : 'lg'}
              colorScheme="red"
              variant="outline"
            />
            <Text
              fontWeight="bold"
              fontSize="lg"
              color={textColor}
              fontFamily={tenantStyles['--font-family'] || 'Inter, sans-serif'}
              aria-live="polite"
            >
              {cartQuantity}
            </Text>
            {/* FIX: Removed redundant `as` prop */}
            <IconButton
              aria-label={`Increase quantity of ${item.name}`}
              icon={<AddIcon />}
              size="md"
              onClick={(e: { stopPropagation: () => void; }) => {
                e.stopPropagation();
                // This will be handled by parent
              }}
              rounded={tenantSettings?.customer_page_settings?.button_style === 'pill' ? 'full' :
                tenantSettings?.customer_page_settings?.button_style === 'square' ? 'none' : 'lg'}
              colorScheme="green"
              variant="outline"
            />
          </HStack>
        )}
      </CardFooter>
    </Card>
  );
};

// FIX: Removed redundant `as` prop
const MenuSkeleton: React.FC = () => (
  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={6}>
    {Array.from({ length: 10 }).map((_, index) => (
      <Card key={index} overflow="hidden">
        <Skeleton height="200px" />
        <CardBody p={4}>
          {/* FIX: Removed redundant `as` prop */}
          <VStack spacing={2} align="stretch">
            <Skeleton height="15px" width="90%" />
            <Skeleton height="15px" width="70%" />
            <Skeleton height="20px" width="80px" />
          </VStack>
        </CardBody>
        <CardFooter p={4}>
          <Skeleton height="40px" width="100%" />
        </CardFooter>
      </Card>
    ))}
  </SimpleGrid>
);

const CustomerMenuPage: React.FC<PageProps> = (props: { params: any; searchParams: any; }) => {
  const router = useRouter();

  // State declarations
  const [isPreview, setIsPreview] = useState(false);
  const [tenantDomain, setTenantDomain] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [foods, setFoods] = useState<DisplayFoodItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderedMeals, setOrderedMeals] = useState<OrderedMeal[]>([]);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [tenantStyles, setTenantStyles] = useState<TenantCSSProperties>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // FIX: Correctly destructure from useDisclosure by changing 'isOpen' to 'open'
  const {
    isOpen: isCartOpen,
    onOpen: onCartOpen,
    onClose: onCartClose,
  } = useDisclosure();

  // FIX: Correctly destructure from useDisclosure by changing 'isOpen' to 'open'
  const {
    isOpen: isDetailsModalOpen,
    onOpen: onDetailsModalOpen,
    onClose: onDetailsModalClose,
  } = useDisclosure();
  const [selectedFood, setSelectedFood] = useState<DisplayFoodItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [dynamicCategories, setDynamicCategories] = useState<FoodCategory[]>([]);

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cash");

  const totalCartPrice = cartItems.reduce(
    (total: number, item: { displayPrice: number; quantity: number; }) => total + item.displayPrice * item.quantity,
    0
  );

  const handlePaystackPayment = async () => {
    if (cartItems.length === 0) {
        setError('Your cart is empty');
        return;
    }

    try {
        setIsProcessing(true);
        setLoading(true);

        // 1. Create an order in our system first
        const tempOrderId = `order-${Date.now()}`;
        const orderData = {
            store_id: shopId || 'default-store',
            table_id: tableId || null,
            total_amount: totalCartPrice,
            status: 'pending',
            notes: 'Order placed via customer menu for Paystack payment',
            items: cartItems.map((item) => ({
                food_id: item.id,
                quantity: item.quantity,
                price: item.displayPrice,
                sub_total: item.displayPrice * item.quantity,
                name: item.name,
                order_id: tempOrderId,
                price_at_sale: item.displayPrice,
            })),
            subtotal_amount: totalCartPrice,
            tax_amount: 0,
            discount_amount: 0,
            order_type: tableId ? 'dine-in' : 'takeaway',
            payment_method: 'paystack',
            payment_status: 'pending',
        };

        const createdOrderResponse = await fetchDataWithContext(
            'orders',
            undefined,
            orderData,
            'POST'
        );

        if (!createdOrderResponse || !createdOrderResponse.id) {
            throw new Error('Failed to create order before payment.');
        }
        const orderId = createdOrderResponse.id;

        // 2. Initialize Paystack transaction by calling our own Next.js API route
        const paystackResponse = await fetch('/api/paystack/initialize-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: totalCartPrice * 100, // Paystack expects amount in kobo/cents
                email: 'customer@example.com', // A placeholder or collect customer email
                currency: 'ZAR', // Assuming South Africa
                orderId: orderId,
                callbackUrl: `${window.location.origin}/payment/success`
            })
        });

        if (!paystackResponse.ok) {
            const errorData = await paystackResponse.json();
            throw new Error(errorData.message || 'Failed to initialize Paystack payment.');
        }

        const { authorization_url } = await paystackResponse.json();

        // 3. Redirect to Paystack
        window.location.href = authorization_url;

    } catch (error) {
        console.error('Paystack payment initiation failed:', error);
        setError(error instanceof Error ? error.message : 'Payment initiation failed. Please try again.');
        setIsProcessing(false);
        setLoading(false);
    }
  };

  // SINGLE useEffect for params resolution - FIXED
  useEffect(() => {
    const resolveAndSetParams = async () => {
      try {
        const [params, searchParams] = await Promise.all([
          props.params,
          props.searchParams
        ]);

        const previewParam = searchParams.preview;
        const shopIdParam = searchParams.shop_id;
        const tableIdParam = searchParams.table_id;
        const domainFromRoute = params.domain;

        setIsPreview(previewParam === 'true');
        setTenantDomain(domainFromRoute);
        setShopId(shopIdParam || null);
        setTableId(tableIdParam || null);

        console.log('🔍 URL Parameters:', {
          domain: domainFromRoute,
          shop_id: shopIdParam,
          table_id: tableIdParam,
          preview: previewParam
        });

        // Validate that domain is provided
        if (!domainFromRoute && !previewParam) {
          console.error('❌ No domain provided in URL');
          setError('Invalid restaurant URL. Please check the link and try again.');
        }
      } catch (error) {
        console.error('Error resolving params:', error);
        setError('Failed to load page parameters. Please refresh the page.');
      }
    };

    resolveAndSetParams();
  }, [props.params, props.searchParams]);

  // Apply tenant settings to CSS variables - FIXED TYPE
  const applyTenantSettings = useCallback((settings: TenantSettings['customer_page_settings']) => {
    if (!settings) return {};

    const styles: TenantCSSProperties = {
      '--primary-green': settings.primary_color || '#38A169',
      '--secondary-color': settings.secondary_color || '#2D3748',
      '--background-color-light': settings.background_color || '#FFFFFF',
      '--card-background-color': settings.card_background_color || '#FFFFFF',
      '--dark-gray-text': settings.text_color || '#2D3748',
      '--medium-gray-text': settings.text_color ? `${settings.text_color}99` : '#4A556899',
      '--accent-color': settings.accent_color || '#ED8936',
      '--border-color': settings.card_border_color || '#E2E8F0',
      '--font-family': settings.font_family || 'Inter, sans-serif',
      '--navbar-main-item-hover-bg': settings.primary_color ? `${settings.primary_color}10` : '#38A16910',
      '--navbar-main-item-inactive-text': settings.text_color ? `${settings.text_color}80` : '#2D374880',
      fontFamily: settings.font_family || 'Inter, sans-serif',
    };

    return styles;
  }, []);

  // Listen for settings updates from parent (preview mode)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TENANT_SETTINGS_UPDATE') {
        const previewSettings = event.data.settings;
        setTenantSettings({ customer_page_settings: previewSettings });
        const styles = applyTenantSettings(previewSettings);
        setTenantStyles(styles);
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial settings if in preview mode
    if (isPreview && window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_TENANT_SETTINGS' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [applyTenantSettings, isPreview]);

  // Load tenant settings from API (for non-preview mode using domain)
  const fetchTenantSettings = useCallback(async () => {
    if (isPreview) {
      console.log('🔍 Preview mode - using settings from parent');
      return;
    }

    try {
      console.log('🔍 Loading tenant settings for domain:', tenantDomain);

      if (!tenantDomain) {
        console.log('⚠️ No domain provided - using default settings');
        setError('Restaurant not found. Please check the URL.');
        return;
      }

      // Use the API function from api.ts to get tenant by domain
      const tenantData = await getTenantByDomain(tenantDomain);

      if (tenantData && tenantData.customer_page_settings) {
        console.log('✅ Tenant settings loaded:', tenantData.customer_page_settings);
        setTenantSettings(tenantData);
        const styles = applyTenantSettings(tenantData.customer_page_settings);
        setTenantStyles(styles);
      } else {
        console.log('⚠️ No tenant settings found for domain - using defaults');
        setError('Restaurant menu not available. Please try again later.');
      }
    } catch (error) {
      console.error('❌ Error loading tenant settings by domain:', error);
      setError('Failed to load restaurant information. Please check the URL and try again.');
    }
  }, [applyTenantSettings, isPreview, tenantDomain]);

  // Fetch table data if table_id is provided
  const fetchTableData = useCallback(async () => {
    if (!tableId) {
      console.log('ℹ️ No table ID provided - using default table');
      // Set a default table or leave as null
      setSelectedTable({
        id: 'default',
        name: 'Takeaway',
        capacity: 1,
        location: 'Counter',
        status: 'available',
        store_id: shopId || 'default'
      } as Table);
      return;
    }

    try {
      console.log('🔍 Fetching table data for ID:', tableId);
      const tableData: Table = await fetchData(`tables/${tableId}`);

      if (tableData) {
        setSelectedTable(tableData);
        console.log('✅ Table data loaded:', tableData);
      } else {
        console.warn('⚠️ Table not found, using default');
        setSelectedTable({
          id: tableId,
          name: `Table ${tableId}`,
          capacity: 4,
          location: 'Main Area',
          status: 'available',
          store_id: shopId || 'default'
        } as Table);
      }
    } catch (err) {
      console.error('❌ Error fetching table data:', err);
      // Use a default table on error
      setSelectedTable({
        id: tableId,
        name: `Table ${tableId}`,
        capacity: 4,
        location: 'Main Area',
        status: 'available',
        store_id: shopId || 'default'
      } as Table);
    }
  }, [tableId, shopId]);

  // Helper function to map category names to icons
  const getCategoryIcon = (categoryName: string): React.ElementType => {
    switch (categoryName.toLowerCase()) {
      case "pizza":
        return FaPizzaSlice;
      case "burgers":
        return FaHamburger;
      case "drinks":
        return FaCoffee;
      case "desserts":
        return FaWineGlass;
      case "chicken":
        return FaDrumstickBite;
      case "hotdogs":
        return FaHotdog;
      case "cocktails":
        return FaCocktail;
      case "breads":
        return FaBreadSlice;
      default:
        return FaUtensils;
    }
  };

  // Also update the fetchDataWithRetry function to be more robust:
  const fetchDataWithRetry = useCallback(async (endpoint: string, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔄 Attempt ${i + 1} to fetch ${endpoint}`);
        const data = await fetchData(endpoint);

        // Validate the response data
        if (data === undefined || data === null) {
          throw new Error(`No data received from ${endpoint}`);
        }

        console.log(`✅ Successfully fetched ${endpoint}:`, data);
        return data;
      } catch (error) {
        console.error(`❌ Attempt ${i + 1} failed for ${endpoint}:`, error);

        if (i === retries - 1) {
          throw error; // Throw the error on the last attempt
        }

        // Wait before retrying (exponential backoff)
        const waitTime = delay * (i + 1);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }, []);

  // Replace the existing fetchFoodsAndCategories function with this corrected version:
  const fetchFoodsAndCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Starting to fetch foods and categories...');

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (shopId) {
        queryParams.append('store_id', shopId);
      }

      const foodsEndpoint = queryParams.toString() ? `foods?${queryParams.toString()}` : 'foods';
      const categoriesEndpoint = queryParams.toString() ? `categories?${queryParams.toString()}` : 'categories';

      // Use Promise.allSettled to fetch both datasets in parallel
      const [foodsData, categoriesData] = await Promise.allSettled([
        fetchDataWithRetry(foodsEndpoint),
        fetchDataWithRetry(categoriesEndpoint),
      ]);

      // Handle foods data
      if (foodsData.status === 'rejected') {
        console.error('❌ Failed to fetch foods:', foodsData.reason);
        throw new Error('Failed to load menu items. Please check your connection.');
      }

      // Handle categories data
      if (categoriesData.status === 'rejected') {
        console.error('❌ Failed to fetch categories:', categoriesData.reason);
        throw new Error('Failed to load categories. Some items may not display correctly.');
      }

      const foodsResult = foodsData.value;
      const categoriesResult = categoriesData.value;

      console.log('✅ Foods data:', foodsResult);
      console.log('✅ Categories data:', categoriesResult);

      // Validate data structure
      if (!Array.isArray(foodsResult)) {
        console.error('❌ Invalid foods data structure:', foodsResult);
        throw new Error('Invalid menu data received from server.');
      }

      if (!Array.isArray(categoriesResult)) {
        console.error('❌ Invalid categories data structure:', categoriesResult);
        throw new Error('Invalid categories data received from server.');
      }

      // Create category map for lookup
      const categoryMap = new Map<string, string>();
      categoriesResult.forEach((cat: Category) => {
        if (cat && cat.id && cat.name) {
          categoryMap.set(cat.id, cat.name);
        }
      });

      // Process foods data with proper error handling
      const processedFoods: DisplayFoodItem[] = foodsResult
        .filter((food: Food) => food && food.id) // Filter out invalid items
        .map((food: Food) => ({
          ...food,
          categoryName: categoryMap.get(food.category_id) || "Uncategorized",
          displayPrice: food.price || 0,
          image: food.image_urls?.[0] || "/placeholder-food.jpg",
          description: food.description || "No description available.",
        }));

      console.log('✅ Processed foods:', processedFoods.length, 'items');

      setFoods(processedFoods);

      // Generate dynamic categories from the actual food data
      const uniqueCategories = new Set<string>();
      processedFoods.forEach((food: DisplayFoodItem) => {
        if (food.categoryName && food.categoryName !== "Uncategorized") {
          uniqueCategories.add(food.categoryName);
        }
      });

      const generatedCategories: FoodCategory[] = [
        { id: "All", name: "All", icon: FaUtensils },
      ];

      // Add categories from the actual food data
      Array.from(uniqueCategories)
        .sort((a, b) => a.localeCompare(b))
        .forEach((cat) => {
          generatedCategories.push({
            id: cat,
            name: cat,
            icon: getCategoryIcon(cat),
          });
        });

      // Also add categories from the categories API if they're not already included
      categoriesResult.forEach((cat: Category) => {
        if (cat && cat.name && !uniqueCategories.has(cat.name)) {
          generatedCategories.push({
            id: cat.name,
            name: cat.name,
            icon: getCategoryIcon(cat.name),
          });
        }
      });

      console.log('✅ Generated categories:', generatedCategories);
      setDynamicCategories(generatedCategories);

    } catch (err) {
      console.error('❌ Error in fetchFoodsAndCategories:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load menu items. Please try again later.";
      setError(errorMessage);

      // Set empty arrays to prevent further errors
      setFoods([]);
      setDynamicCategories([{ id: "All", name: "All", icon: FaUtensils }]);
    } finally {
      setLoading(false);
    }
  }, [fetchDataWithRetry, shopId]);

  // Update the data initialization - FIXED
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        if (isMounted) {
          setLoading(true);
          await fetchTenantSettings();
          await fetchTableData();
          await fetchFoodsAndCategories();
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        if (isMounted) {
          setError('Failed to initialize application data. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only initialize if we have a domain or are in preview mode
    if (tenantDomain || isPreview) {
      initializeData();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchTenantSettings, fetchTableData, fetchFoodsAndCategories, tenantDomain, isPreview]);

  // Rest of your component functions remain the same...
  const openDetailsModal = (food: DisplayFoodItem) => {
    setSelectedFood(food);
    setCurrentImageIndex(0);
    onDetailsModalOpen();
  };

  const closeDetailsModal = () => {
    setSelectedFood(null);
    setCurrentImageIndex(0);
    onDetailsModalClose();
  };

  const nextImage = () => {
    if (!selectedFood?.image_urls) return;
    setCurrentImageIndex((prev: number) =>
      prev === selectedFood!.image_urls!.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!selectedFood?.image_urls) return;
    setCurrentImageIndex((prev: number) =>
      prev === 0 ? selectedFood!.image_urls!.length - 1 : prev - 1
    );
  };

  const filteredFoods = foods.filter((food: DisplayFoodItem) => {
    const matchesSearch =
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (food.description &&
        food.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" ||
      (food.categoryName &&
        food.categoryName.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const groupedFoods = [];

  if (selectedCategory === "All") {
    groupedFoods.push({
      id: "All",
      name: "All",
      icon: FaUtensils,
      items: filteredFoods,
    });
  } else {
    const selectedCat = dynamicCategories.find(
      (cat: { id: any; }) => cat.id === selectedCategory
    );
    if (selectedCat) {
      groupedFoods.push({
        ...selectedCat,
        items: filteredFoods.filter(
          (food: { categoryName: string; }) =>
            food.categoryName &&
            food.categoryName.toLowerCase() === selectedCategory.toLowerCase()
        ),
      });
    }
  }

  const addToCart = (item: DisplayFoodItem) => {
    setCartItems((prevItems: CartItem[]) => {
      const existingItem = prevItems.find(
        (cartItem: CartItem) => cartItem.id === item.id
      );
      if (existingItem) {
        return prevItems.map((cartItem: CartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    setCartItems((prevItems: CartItem[]) => {
      if (quantity <= 0) {
        return prevItems.filter((item: CartItem) => item.id !== itemId);
      }
      return prevItems.map((item: CartItem) =>
        item.id === itemId ? { ...item, quantity: quantity } : item
      );
    });
  };

  const removeCartItem = (itemId: string) => {
    setCartItems((prevItems: CartItem[]) => prevItems.filter((item: CartItem) => item.id !== itemId));
  };

  const getCartItemQuantity = (itemId: string) => {
    const item = cartItems.find((cartItem: CartItem) => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const totalCartItems = cartItems.reduce(
    (total: any, item: { quantity: any; }) => total + item.quantity,
    0
  );

  const activeOrdersCount = orderedMeals.filter(
    (meal: { status: string; }) => meal.status !== "Served"
  ).length;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    if (selectedPaymentMethod === 'cash') {
      try {
        setLoading(true);
        setIsProcessing(true);

        const tempOrderId = `order-${Date.now()}`;
        const orderData = {
          store_id: shopId || 'default-store',
          table_id: tableId || null,
          total_amount: totalCartPrice,
          status: 'pending',
          notes: 'Cash order placed via customer menu',
          items: cartItems.map((item) => ({
            food_id: item.id,
            quantity: item.quantity,
            price: item.displayPrice,
            sub_total: item.displayPrice * item.quantity,
            name: item.name,
            order_id: tempOrderId,
            price_at_sale: item.displayPrice,
          })),
          subtotal_amount: totalCartPrice,
          tax_amount: 0,
          discount_amount: 0,
          order_type: tableId ? 'dine-in' : 'takeaway',
          payment_method: 'cash',
          payment_status: 'pending',
        };

        const createdOrder = await fetchDataWithContext('orders', undefined, orderData, 'POST');

        if (createdOrder && createdOrder.id) {
          const newOrderedMeals: OrderedMeal[] = cartItems.map((item: any) => ({
            ...item,
            status: "Preparing",
            orderTime: new Date().toLocaleString(),
          }));
          setOrderedMeals((prev) => [...prev, ...newOrderedMeals]);
          setCartItems([]);
          onCartClose();
        } else {
          throw new Error('Failed to create cash order');
        }

      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to create cash order. Please try again.');
      } finally {
        setLoading(false);
        setIsProcessing(false);
      }
    } else if (selectedPaymentMethod === 'card') {
      handlePaystackPayment();
    }
  };

  const handleTrackOrderClick = () => {
    setActiveTabIndex(1);
    onCartOpen();
  };

  const handleCartButtonClick = () => {
    setActiveTabIndex(0);
    onCartOpen();
  };

  // Add a retry button for users in case of errors
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchFoodsAndCategories();
  }, [fetchFoodsAndCategories]);

  // Safe getter for tenant styles - FIXED
  const getTenantStyle = (key: keyof TenantCSSProperties, fallback: string): string => {
    const value = tenantStyles[key];
    return getChakraColor(value, fallback);
  };

  // Use the helper functions directly
  const primaryGreen = getTenantStyle('--primary-green', '#38A169');
  const textColor = getTenantStyle('--dark-gray-text', '#2D3748');
  const cardBg = getTenantStyle('--card-background-color', '#FFFFFF');
  const borderColor = getTenantStyle('--border-color', '#E2E8F0');
  const modalContentBg = getTenantStyle('--background-color-light', '#FFFFFF');
  const topBarBg = getTenantStyle('--background-color-light', '#FFFFFF');
  const accentColor = getTenantStyle('--accent-color', '#ED8936');
  const fontFamily = getTenantStyle('--font-family', 'Inter, sans-serif');

  // Get card styles based on tenant settings
  const getCardStyles = () => {
    const settings = tenantSettings?.customer_page_settings;
    if (!settings) return {};

    const baseStyles = {
      bg: settings.card_background_color || '#FFFFFF',
      border: settings.card_style === 'border' ? `${settings.card_border_width || 1}px solid` : 'none',
      borderColor: settings.card_border_color || '#E2E8F0',
      borderRadius: `${settings.card_border_radius || 12}px`,
      shadow: settings.card_shadow || 'md',
    };

    if (settings.card_style === 'gradient') {
      return {
        ...baseStyles,
        bg: `linear-gradient(135deg, ${settings.card_background_color || '#FFFFFF'}, ${settings.primary_color || '#38A169'}20)`,
        border: 'none',
      };
    }

    return baseStyles;
  };

  // Cart Table Info Component
  const CartTableInfo = () => (
    <HStack spacing={1}>
      <Text fontSize="md" color="var(--medium-gray-text)">
        {selectedTable?.name || "Takeaway"}
      </Text>
      {tableId && (
        <Badge colorScheme="green" fontSize="xs">
          #{tableId}
        </Badge>
      )}
    </HStack>
  );

  // In page.tsx - Enhanced BannerSection component
  const BannerSection = () => {
    if (!tenantSettings?.customer_page_settings?.show_banner) return null;

    const bannerSettings = tenantSettings.customer_page_settings;
    const bannerHeight = bannerSettings.banner_height || 300;
    const hasLogo = bannerSettings.logo_url;
    const showBannerText = bannerSettings.show_banner_text;

    const getLogoStyles = () => {
      const position = bannerSettings.logo_position || 'top-left';
      const marginTop = bannerSettings.logo_margin_top || 4;
      const marginBottom = bannerSettings.logo_margin_bottom || 0;
      const marginLeft = bannerSettings.logo_margin_left || 4;
      const marginRight = bannerSettings.logo_margin_right || 0;

      const baseStyles = {
        zIndex: 20,
      };

      switch (position) {
        case 'top-left':
          return {
            ...baseStyles,
            position: 'absolute' as const,
            top: `${marginTop}px`,
            left: `${marginLeft}px`,
          };
        case 'top-center':
          return {
            ...baseStyles,
            position: 'absolute' as const,
            top: `${marginTop}px`,
            left: '50%',
            transform: 'translateX(-50%)',
          };
        case 'top-right':
          return {
            ...baseStyles,
            position: 'absolute' as const,
            top: `${marginTop}px`,
            right: `${marginRight}px`,
          };
        case 'above-banner':
          return {
            ...baseStyles,
            position: 'relative' as const,
            marginTop: `${marginTop}px`,
            marginBottom: `${marginBottom}px`,
            textAlign: 'center' as const,
          };
        case 'side-by-side':
          return {
            ...baseStyles,
            position: 'relative' as const,
            display: 'inline-block',
            marginRight: `${marginRight}px`,
            verticalAlign: 'middle' as const,
          };
        case 'center-banner':
          return {
            ...baseStyles,
            position: 'absolute' as const,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          };
        case 'bottom-banner':
          return {
            ...baseStyles,
            position: 'absolute' as const,
            bottom: `${marginBottom}px`,
            left: '50%',
            transform: 'translateX(-50%)',
          };
        default:
          return {
            ...baseStyles,
            position: 'absolute' as const,
            top: `${marginTop}px`,
            left: `${marginLeft}px`,
          };
      }
    };

    const renderHeaderContent = () => {
      const position = bannerSettings.logo_position || 'top-left';

      // Special handling for layout-based positions
      if (position === 'side-by-side' && hasLogo && showBannerText) {
        return (
          <Flex
            align="center"
            justify="center"
            w="full"
            h="full"
            p={4}
            gap={4}
          >
            <ChakraImage
              src={bannerSettings.logo_url}
              alt="Restaurant Logo"
              height={
                bannerSettings.logo_size === 'large' ? '80px' :
                  bannerSettings.logo_size === 'small' ? '40px' : '60px'
              }
              width="auto"
              flexShrink={0}
            />
            <Text
              color={bannerSettings.banner_text_color || '#ffffff'}
              fontSize="2xl"
              fontWeight="bold"
              textAlign="center"
              flex="1"
            >
              {bannerSettings.banner_text || 'Welcome to Our Restaurant'}
            </Text>
          </Flex>
        );
      }

      if (position === 'above-banner' && hasLogo) {
        return (
          // FIX: Removed redundant `as` prop
          <VStack spacing={3} w="full" p={4}>
            <ChakraImage
              src={bannerSettings.logo_url}
              alt="Restaurant Logo"
              height={
                bannerSettings.logo_size === 'large' ? '80px' :
                  bannerSettings.logo_size === 'small' ? '40px' : '60px'
              }
              width="auto"
            />
            {showBannerText && (
              <Text
                color={bannerSettings.banner_text_color || '#ffffff'}
                fontSize="2xl"
                fontWeight="bold"
                textAlign="center"
              >
                {bannerSettings.banner_text || 'Welcome to Our Restaurant'}
              </Text>
            )}
          </VStack>
        );
      }

      // For absolute positions
      return (
        <>
          {hasLogo && position !== 'side-by-side' && position !== 'above-banner' && (
            <Box style={getLogoStyles()}>
              <ChakraImage
                src={bannerSettings.logo_url}
                alt="Restaurant Logo"
                height={
                  bannerSettings.logo_size === 'large' ? '80px' :
                    bannerSettings.logo_size === 'small' ? '40px' : '60px'
                }
                width="auto"
              />
            </Box>
          )}
          {showBannerText && position !== 'side-by-side' && position !== 'above-banner' && (
            <Text
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              color={bannerSettings.banner_text_color || '#ffffff'}
              fontSize="2xl"
              fontWeight="bold"
              textAlign="center"
              zIndex={20}
              width="80%"
              textShadow="2px 2px 4px rgba(0,0,0,0.5)"
            >
              {bannerSettings.banner_text || 'Welcome to Our Restaurant'}
            </Text>
          )}
        </>
      );
    };

    return (
      <Box
        position="relative"
        height={`${bannerHeight}px`}
        mb={6}
        overflow="hidden"
        bg={bannerSettings.banner_image_url ? undefined : 'gray.200'}
      >
        {/* Background Image Layer */}
        {bannerSettings.banner_image_url && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bgImage={`url(${bannerSettings.banner_image_url})`}
            bgSize="cover"
            backgroundPosition="center"
            bgRepeat="no-repeat"
            zIndex={10}
          />
        )}

        {/* Overlay Layer - UNDER the content */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={bannerSettings.banner_overlay_color || '#000000'}
          opacity={bannerSettings.banner_overlay_opacity || 0.3}
          style={{
            backdropFilter: `blur(${bannerSettings.banner_overlay_blur || 0}px)`,
            WebkitBackdropFilter: `blur(${bannerSettings.banner_overlay_blur || 0}px)`,
          }}
          zIndex={15}
        />

        {/* Content Layer - ABOVE the overlay */}
        <Box
          position="relative"
          height="100%"
          zIndex={20}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {renderHeaderContent()}
        </Box>
      </Box>
    );
  };

  // Show loading state while initializing
  if (loading && foods.length === 0) {
    return (
      <Flex justify="center" align="center" minH="80vh" bg={getTenantStyle('--background-color-light', '#F7FAFC')}>
        <Spinner size="xl" colorScheme="green" />
        <Text ml={4} fontSize="lg" color={textColor}>
          Loading menu...
        </Text>
      </Flex>
    );
  }

  // Update the error display for domain-specific errors
  if (error && !tenantDomain && !isPreview) {
    return (
      <Flex justify="center" align="center" minH="80vh" bg={getTenantStyle('--background-color-light', '#F7FAFC')}>
        <Alert
          status="error"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          maxW="400px"
          rounded="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Restaurant Not Found
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            The restaurant URL is invalid or the menu is not available.
            <Text mt={2} fontSize="sm">
              Please check the link and try again.
            </Text>
            {/* FIX: Removed redundant `as` prop */}
            <VStack mt={4} spacing={3}>
              <Button
                colorScheme="green"
                onClick={() => window.location.reload()}
                width="full"
              >
                Try Again
              </Button>
            </VStack>
          </AlertDescription>
        </Alert>
      </Flex>
    );
  }

  // Update the error display section to include a retry button:
  if (error && foods.length === 0) {
    return (
      <Flex justify="center" align="center" minH="80vh" bg={getTenantStyle('--background-color-light', '#F7FAFC')}>
        <Alert
          status="error"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          maxW="400px"
          rounded="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Failed to Load Menu
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
            {/* FIX: Removed redundant `as` prop */}
            <VStack mt={4} spacing={3}>
              <Button
                colorScheme="green"
                onClick={handleRetry}
                width="full"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                width="full"
              >
                Reload Page
              </Button>
            </VStack>
          </AlertDescription>
        </Alert>
      </Flex>
    );
  }

  // Rest of your JSX return remains the same...
  return (
    <Box
      bg={getTenantStyle('--background-color-light', '#F7FAFC')}
      minH="100vh"
      style={tenantStyles}
    >
      {/* Preview Mode Banner - Only show in preview */}
      {isPreview && (
        <Box
          bg="orange.500"
          color="white"
          textAlign="center"
          py={2}
          fontSize="sm"
          fontWeight="bold"
          position="sticky"
          top={0}
          zIndex={2000}
        >
          🎨 Preview Mode - Customization in Progress
        </Box>
      )}

      {/* Restaurant Info Header */}
      <Box
        bg={topBarBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        py={2}
        px={4}
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center" wrap="wrap">
            <Text
              fontSize="sm"
              color="var(--medium-gray-text)"
              fontFamily={fontFamily}
            >
              {tenantDomain ? `Restaurant: ${tenantDomain.replace(/_/g, ' ').toUpperCase()}` : 'Preview Mode'}
            </Text>
            {(shopId || tableId) && (
              // FIX: Removed redundant `as` prop
              <HStack spacing={4}>
                {shopId && (
                  <Badge colorScheme="blue" fontSize="xs">
                    Shop: {shopId}
                  </Badge>
                )}
                {tableId && (
                  <Badge colorScheme="green" fontSize="xs">
                    Table: {tableId}
                  </Badge>
                )}
              </HStack>
            )}
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" px={4} py={8}>
        {/* Banner Section */}
        <BannerSection />

        {/* Sticky Header Section */}
        <Box
          position="sticky"
          top={isPreview ? "24px" : "0"}
          zIndex={100}
          bg={topBarBg}
          pb={4}
          pt={4}
          boxShadow="0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)"
          transition="all 0.3s ease-in-out"
          mt={-6}
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "flex-start", md: "center" }}
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
                fontFamily={fontFamily}
                fontWeight="extrabold"
              >
                Our Delicious Menu
              </Heading>
            </Box>
          </Flex>

          {/* Search Bar */}
          {tenantSettings?.customer_page_settings?.show_search_bar !== false && (
            <Box px={{ base: 4, md: 8 }} mb={6} mt={4}>
              <InputGroup width="100%">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchTerm}
                  onChange={(e: { target: { value: any; }; }) => setSearchTerm(e.target.value)}
                  rounded="lg"
                  color={textColor}
                  borderColor="#333"
                  _focus={{ borderColor: primaryGreen }}
                  fontFamily={fontFamily}
                  px={5}
                  py={3}
                  boxShadow="sm"
                  _hover={{ borderColor: primaryGreen, boxShadow: "md" }}
                  transition="all 0.2s ease-in-out"
                />
              </InputGroup>
            </Box>
          )}

          {/* Category Navigation */}
          {tenantSettings?.customer_page_settings?.show_category_nav !== false && (
            <Flex
              overflowX="auto"
              whiteSpace="nowrap"
              gap={{ base: 2, md: 4 }}
              justifyContent="flex-start"
              css={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
              py={2}
              px={{ base: 4, md: 8 }}
            >
              {dynamicCategories.map((category: { id: any; icon: any; name: any; }) => (
                <NavItem
                  key={category.id}
                  icon={category.icon}
                  isActive={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  tenantStyles={tenantStyles}
                >
                  {category.name}
                </NavItem>
              ))}
            </Flex>
          )}
        </Box>

        {/* Menu Content */}
        <Box mt={8}>
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <AlertTitle>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <MenuSkeleton />
          ) : (
            groupedFoods.map((group) => (
              <Box key={group.id} mb={10}>
                <Heading
                  as="h2"
                  size="lg"
                  mb={6}
                  color={textColor}
                  borderBottom="2px solid"
                  borderColor={primaryGreen}
                  pb={2}
                  display="inline-block"
                  fontFamily={fontFamily}
                >
                  {group.name} ({group.items.length})
                </Heading>

                {group.items.length === 0 ? (
                  <Text
                    color="gray.500"
                    textAlign="center"
                    py={8}
                    fontFamily={fontFamily}
                  >
                    No items found in this category.
                  </Text>
                ) : (
                  // FIX: Removed redundant `as` prop
                  <SimpleGrid
                    columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                    spacing={6}
                  >
                    {group.items.map((item: DisplayFoodItem) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onItemClick={openDetailsModal}
                        onAddToCart={addToCart}
                        cartQuantity={getCartItemQuantity(item.id)}
                        tenantStyles={tenantStyles}
                        tenantSettings={tenantSettings}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            ))
          )}
        </Box>

        {/* Rest of the modals remain the same */}
        {/* Item Details Modal */}
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={closeDetailsModal}
          size="xl"
          isCentered
        >
          <ModalOverlay />
          <ModalContent
            bg={modalContentBg}
            rounded="xl"
            overflow="hidden"
            {...getCardStyles()}
          >
            <ModalCloseButton color={textColor} />
            <ModalHeader
              borderBottomWidth="1px"
              borderColor={borderColor}
              color={textColor}
              fontFamily={fontFamily}
              pb={3}
            >
              {selectedFood?.name}
            </ModalHeader>

            <ModalBody p={0}>
              {selectedFood?.image_urls && selectedFood.image_urls.length > 0 && (
                <Box position="relative">
                  <ChakraImage
                    src={selectedFood.image_urls[currentImageIndex]}
                    alt={selectedFood.name}
                    height={{ base: "250px", md: "300px" }}
                    objectFit="cover"
                    width="100%"
                  />
                  {selectedFood.image_urls.length > 1 && (
                    <>
                      {/* FIX: Removed redundant `as` prop */}
                      <IconButton
                        aria-label="Previous image"
                        icon={<FaChevronLeft />}
                        position="absolute"
                        left={2}
                        top="50%"
                        transform="translateY(-50%)"
                        onClick={prevImage}
                        bg="blackAlpha.600"
                        color="white"
                        _hover={{ bg: 'blackAlpha.700' }}
                      />
                      {/* FIX: Removed redundant `as` prop */}
                      <IconButton
                        aria-label="Next image"
                        icon={<FaChevronRight />}
                        position="absolute"
                        right={2}
                        top="50%"
                        transform="translateY(-50%)"
                        onClick={nextImage}
                        bg="blackAlpha.600"
                        color="white"
                        _hover={{ bg: 'blackAlpha.700' }}
                      />
                      <Badge
                        position="absolute"
                        bottom={2}
                        right={2}
                        bg="blackAlpha.600"
                        color="white"
                      >
                        {currentImageIndex + 1} / {selectedFood.image_urls.length}
                      </Badge>
                    </>
                  )}
                </Box>
              )}
              {/* FIX: Removed redundant `as` prop */}
              <VStack p={6} spacing={4} align="stretch">
                <Text
                  fontSize="md"
                  color="var(--medium-gray-text)"
                  fontFamily={fontFamily}
                >
                  {selectedFood?.description}
                </Text>
                <Text
                  color={primaryGreen}
                  fontSize="2xl"
                  fontWeight="extrabold"
                  fontFamily={fontFamily}
                >
                  R {selectedFood?.displayPrice.toFixed(2)}
                </Text>

                {/* Restaurant Logo */}
                {tenantSettings?.customer_page_settings?.logo_url && (
                  <Box mt={4} pt={4} borderTop="1px solid" borderColor={borderColor}>
                    <ChakraImage
                      src={tenantSettings.customer_page_settings.logo_url}
                      alt="Restaurant Logo"
                      height="40px"
                      width="auto"
                    />
                  </Box>
                )}

                {selectedFood && (
                  <Box pt={4}>
                    {getCartItemQuantity(selectedFood.id) === 0 ? (
                      <Button
                        variant="solid"
                        colorScheme="green"
                        size="lg"
                        width="full"
                        rounded={tenantSettings?.customer_page_settings?.button_style === 'pill' ? 'full' :
                          tenantSettings?.customer_page_settings?.button_style === 'square' ? 'none' : 'lg'}
                        onClick={() => {
                          if (selectedFood) addToCart(selectedFood);
                          closeDetailsModal();
                        }}
                        fontWeight="semibold"
                        fontSize="lg"
                        bg={primaryGreen}
                        _hover={{ bg: "green.600", shadow: "md" }}
                        fontFamily={fontFamily}
                      >
                        Add to Cart
                      </Button>
                    ) : (
                      <HStack width="full" justify="space-between">
                        {/* FIX: Changed disabled to isDisabled and removed redundant `as` prop */}
                        <IconButton
                          aria-label="Decrease quantity"
                          icon={<MinusIcon />}
                          size="lg"
                          onClick={() =>
                            selectedFood && updateCartItemQuantity(
                              selectedFood.id,
                              getCartItemQuantity(selectedFood.id) - 1
                            )
                          }
                          isDisabled={!selectedFood || getCartItemQuantity(selectedFood.id) <= 0}
                          rounded={tenantSettings?.customer_page_settings?.button_style === 'pill' ? 'full' :
                            tenantSettings?.customer_page_settings?.button_style === 'square' ? 'none' : 'lg'}
                          colorScheme="red"
                          variant="outline"
                        />
                        <Text
                          fontWeight="bold"
                          fontSize="xl"
                          color={textColor}
                          fontFamily={fontFamily}
                        >
                          {selectedFood ? getCartItemQuantity(selectedFood.id) : 0}
                        </Text>
                        {/* FIX: Removed redundant `as` prop */}
                        <IconButton
                          aria-label="Increase quantity"
                          icon={<AddIcon />}
                          size="lg"
                          onClick={() =>
                            selectedFood && updateCartItemQuantity(
                              selectedFood.id,
                              getCartItemQuantity(selectedFood.id) + 1
                            )
                          }
                          rounded={tenantSettings?.customer_page_settings?.button_style === 'pill' ? 'full' :
                            tenantSettings?.customer_page_settings?.button_style === 'square' ? 'none' : 'lg'}
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
          size={{ base: "full", sm: "md" }}
          isCentered
          scrollBehavior="inside"
        >
          <ModalOverlay />
          <ModalContent
            bg={modalContentBg}
            rounded="xl"
            maxH="80vh"
            {...getCardStyles()}
          >
            <ModalHeader
              borderBottomWidth="1px"
              borderColor={borderColor}
              color={textColor}
              fontFamily={fontFamily}
              mt={8}
            >
              <Flex justifyContent="space-between" alignItems="center">
                <Text>Your Order ({totalCartItems} items)</Text>
                <CartTableInfo />
              </Flex>
            </ModalHeader>
            <ModalCloseButton color={textColor} />

            <ModalBody>
              {/* FIX: Removed redundant `as` prop */}
              <Tabs
                isFitted
                variant="enclosed"
                colorScheme="green"
                index={activeTabIndex}
                onChange={(index: any) => setActiveTabIndex(index)}
              >
                <TabList mb="1em">
                  <Tab
                    _selected={{
                      color: primaryGreen,
                      borderColor: primaryGreen,
                      borderBottomColor: "transparent",
                    }}
                    fontFamily={fontFamily}
                  >
                    Your Order
                  </Tab>
                  <Tab
                    _selected={{
                      color: primaryGreen,
                      borderColor: primaryGreen,
                      borderBottomColor: "transparent",
                    }}
                    fontFamily={fontFamily}
                  >
                    Order Progress
                    {orderedMeals.length > 0 && (
                      <Badge ml={2} colorScheme="orange" rounded="full" px={2}>
                        {
                          orderedMeals.filter((meal: { status: string; }) => meal.status !== "Served")
                            .length
                        }
                      </Badge>
                    )}
                  </Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    {cartItems.length === 0 ? (
                      <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        height="full"
                        minH="200px"
                      >
                        <Icon
                          as={FaShoppingCart}
                          w={12}
                          h={12}
                          color="gray.400"
                          mb={4}
                        />
                        <Text
                          fontSize="lg"
                          color="gray.500"
                          fontFamily={fontFamily}
                        >
                          Your cart is empty.
                        </Text>
                        <Text
                          fontSize="md"
                          color="gray.500"
                          mt={2}
                          fontFamily={fontFamily}
                        >
                          Add some delicious items from the menu!
                        </Text>
                      </Flex>
                    ) : (
                      <VStack>
                        {/* FIX: Removed redundant `as` prop */}
                        <VStack spacing={4} align="stretch">
                          {cartItems.map((item: CartItem) => (
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
                                {/* FIX: Removed redundant `as` prop */}
                                <Text
                                  fontWeight="semibold"
                                  color={textColor}
                                  noOfLines={1}
                                  fontFamily={fontFamily}
                                >
                                  {item.name}
                                </Text>
                                <Text
                                  fontSize="sm"
                                  color="var(--medium-gray-text)"
                                  fontFamily={fontFamily}
                                >
                                  R {item.displayPrice.toFixed(2)} x{" "}
                                  {item.quantity}
                                </Text>
                                <Text
                                  fontWeight="bold"
                                  color={primaryGreen}
                                  fontFamily={fontFamily}
                                >
                                  R{" "}
                                  {(item.displayPrice * item.quantity).toFixed(2)}
                                </Text>
                              </Box>
                              {/* FIX: Removed redundant `as` prop */}
                              <HStack spacing={2}>
                                {/* FIX: Changed disabled to isDisabled and removed redundant `as` prop */}
                                <IconButton
                                  aria-label="Decrease quantity"
                                  icon={<MinusIcon />}
                                  size="sm"
                                  onClick={() =>
                                    updateCartItemQuantity(
                                      item.id,
                                      item.quantity - 1
                                    )
                                  }
                                  isDisabled={item.quantity <= 1}
                                  rounded="md"
                                  colorScheme="red"
                                  variant="ghost"
                                />
                                <Text
                                  fontWeight="bold"
                                  color={textColor}
                                  fontFamily={fontFamily}
                                >
                                  {item.quantity}
                                </Text>
                                {/* FIX: Removed redundant `as` prop */}
                                <IconButton
                                  aria-label="Increase quantity"
                                  icon={<AddIcon />}
                                  size="sm"
                                  onClick={() =>
                                    updateCartItemQuantity(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  rounded="md"
                                  colorScheme="green"
                                  variant="ghost"
                                />
                                {/* FIX: Removed redundant `as` prop */}
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
                      <Flex
                        direction="column"
                        align="center"
                        justify="center"
                        height="full"
                        minH="200px"
                      >
                        <Icon
                          as={FaUtensils}
                          w={12}
                          h={12}
                          color="gray.400"
                          mb={4}
                        />
                        <Text
                          fontSize="lg"
                          color="gray.500"
                          fontFamily={fontFamily}
                        >
                          No active orders. Place an order to see its progress!
                        </Text>
                      </Flex>
                    ) : (
                      // FIX: Removed redundant `as` prop
                      <VStack spacing={4} align="stretch">
                        {orderedMeals.map((meal: OrderedMeal, index: any) => (
                          <Card
                            key={index}
                            p={4}
                            rounded="md"
                            borderWidth="1px"
                            borderColor={borderColor}
                            bg={cardBg}
                          >
                            <HStack justifyContent="space-between" mb={2}>
                              <Text
                                fontWeight="semibold"
                                color={textColor}
                                fontFamily={fontFamily}
                              >
                                {meal.name} x {meal.quantity}
                              </Text>
                              <Badge
                                colorScheme={
                                  meal.status === "Preparing"
                                    ? "orange"
                                    : meal.status === "Ready"
                                      ? "blue"
                                      : "green"
                                }
                                fontFamily={fontFamily}
                              >
                                {meal.status}
                              </Badge>
                            </HStack>
                            <Text
                              fontSize="sm"
                              color="var(--medium-gray-text)"
                              fontFamily={fontFamily}
                            >
                              Ordered: {meal.orderTime}
                            </Text>
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
                {/* FIX: Removed redundant `as` prop */}
                <VStack width="full" spacing={4}>
                  <Box width="full">
                    <Heading
                      size="sm"
                      mb={2}
                      color={textColor}
                      fontFamily={fontFamily}
                    >
                      Payment Method
                    </Heading>
                    {/* FIX: Removed redundant `as` prop */}
                    <HStack spacing={4} justify="center" flexWrap="wrap">
                      <Button
                        variant="outline"
                        borderWidth="2px"
                        borderColor={
                          selectedPaymentMethod === "cash"
                            ? primaryGreen
                            : "gray.200"
                        }
                        rounded={tenantSettings?.customer_page_settings?.button_style === 'pill' ? 'full' :
                          tenantSettings?.customer_page_settings?.button_style === 'square' ? 'none' : 'lg'}
                        p={3}
                        onClick={() => setSelectedPaymentMethod("cash")}
                        bg={
                          selectedPaymentMethod === "cash"
                            ? "green.50"
                            : "transparent"
                        }
                        _hover={{ bg: "green.50" }}
                        flexDir="column"
                        height="auto"
                        width="100px"
                      >
                        <Icon
                          as={FaMoneyBillWave}
                          w={6}
                          h={6}
                          color="gray.500"
                          mb={1}
                        />
                        <Text fontSize="sm" color="var(--medium-gray-text)">
                          Cash
                        </Text>
                        {selectedPaymentMethod === "cash" && (
                          <Box
                            position="absolute"
                            top={1}
                            right={1}
                            color={primaryGreen}
                          >
                            <Icon as={FaCheckCircle} />
                          </Box>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        borderWidth="2px"
                        borderColor={
                          selectedPaymentMethod === "card"
                            ? primaryGreen
                            : "gray.200"
                        }
                        rounded={tenantSettings?.customer_page_settings?.button_style === 'pill' ? 'full' :
                          tenantSettings?.customer_page_settings?.button_style === 'square' ? 'none' : 'lg'}
                        p={3}
                        onClick={() => setSelectedPaymentMethod("card")}
                        bg={
                          selectedPaymentMethod === "card"
                            ? "green.50"
                            : "transparent"
                        }
                        _hover={{ bg: "green.50" }}
                        flexDir="column"
                        height="auto"
                        width="100px"
                      >
                        <Icon
                          as={FaCreditCard}
                          w={6}
                          h={6}
                          color="gray.500"
                          mb={1}
                        />
                        <Text fontSize="sm" color="var(--medium-gray-text)">
                          Card (Paystack)
                        </Text>
                        {selectedPaymentMethod === "card" && (
                          <Box
                            position="absolute"
                            top={1}
                            right={1}
                            color={primaryGreen}
                          >
                            <Icon as={FaCheckCircle} />
                          </Box>
                        )}
                      </Button>
                    </HStack>
                  </Box>

                  <Flex width="full" justify="space-between" align="center">
                    <Text
                      fontSize="xl"
                      fontWeight="bold"
                      color={textColor}
                      fontFamily={fontFamily}
                    >
                      Total:
                    </Text>
                    <Text
                      fontSize="xl"
                      fontWeight="bold"
                      color={primaryGreen}
                      fontFamily={fontFamily}
                    >
                      R {totalCartPrice.toFixed(2)}
                    </Text>
                  </Flex>

                  {/* FIX: Changed disabled to isDisabled, loading to isLoading, and removed redundant `as` prop */}
                  <Button
                    size="lg"
                    width="full"
                    colorScheme="green"
                    bg={primaryGreen}
                    _hover={{ bg: "green.600", shadow: "md" }}
                    onClick={handlePlaceOrder}
                    isDisabled={cartItems.length === 0 || isProcessing}
                    isLoading={isProcessing}
                    loadingText="Processing..."
                    fontWeight="semibold"
                    fontFamily={fontFamily}
                    rounded={tenantSettings?.customer_page_settings?.button_style === 'pill' ? 'full' :
                      tenantSettings?.customer_page_settings?.button_style === 'square' ? 'none' : 'lg'}
                  >
                    Place Order with{" "}
                    {selectedPaymentMethod === "cash" ? "Cash" : "Card"}
                  </Button>
                </VStack>
              </ModalFooter>
            )}
          </ModalContent>
        </Modal>

        {/* Floating Cart Button */}
        <Box position="fixed" bottom={4} right={4} zIndex={100}>
          <Button
            onClick={handleCartButtonClick}
            colorScheme="green"
            size="lg"
            rounded="full"
            height="50px"
            width="50px"
            shadow="lg"
            _hover={{
              bg: "green.600",
              transform: "scale(1.05)",
            }}
            transition="all 0.2s ease-in-out"
            position="relative"
            bg={primaryGreen}
            mb={totalCartItems > 0 || activeOrdersCount > 0 ? "60px" : "0"}
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
                bg: "blue.600",
                transform: "scale(1.05)",
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
      </Container>
    </Box>
  );
};

export default CustomerMenuPage;
