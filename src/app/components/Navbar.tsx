/* src/app/components/Navbar.tsx */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { entities } from '../config/entities'; // Import your entities configuration
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  Collapse,
  Icon,
  Image as ChakraImage // Import Image component from Chakra UI
} from '@chakra-ui/react'; // Chakra UI components
import { ChevronDownIcon } from '@chakra-ui/icons'; // Chakra UI icon

// Define the structure for your dashboard menu
interface MenuItem {
  name: string;
  href: string;
  subMenus?: MenuItem[];
}

// Define your dashboard menu structure based on the entities
// This can be expanded or modified as needed.
const dashboardMenu: MenuItem[] = [
  {
    name: 'Dashboard Overview',
    href: '/',
  },
  {
    name: 'Daily Summaries', href: '/daily_summaries'
  },
  {
    name: 'Sales & Orders',
    href: '/sales',
    subMenus: [
      { name: 'Sales', href: '/sales' },
      { name: 'Sale Items', href: '/sale_items' },
      { name: 'Sale Payments', href: '/sale_payments' },
      { name: 'Sale Statuses', href: '/sale_statuses' },
      { name: 'Orders', href: '/orders' },
      { name: 'Order Items', href: '/order_items' },
      { name: 'Table Items', href: '/table_items' },
      { name: 'Refunds', href: '/refunds' },
      { name: 'Tables', href: '/tables' },
      { name: 'Table Sections', href: '/tables_sections' },
      { name: 'Coupons', href: '/coupons' },
      { name: 'Table Coupons', href: '/table_coupons' },
      { name: 'Product Coupons', href: '/product_coupons' },
      { name: 'Customer Coupons', href: '/customer_coupons' },
      { name: 'Coupon Redemptions', href: '/coupon_redemptions' },
    ],
  },
  {
    name: 'Inventory & Products',
    href: '/foods',
    subMenus: [
      { name: 'Food Items', href: '/foods' },
      { name: 'Food Categories', href: '/food_categories' },
      { name: 'Food Brands', href: '/food_brands' },
      { name: 'Food Modifiers', href: '/modifiers' }, // Linking to modifiers directly
      { name: 'Food Product Links', href: '/food_product' }, // Junction table
      { name: 'Products (Raw/Retail)', href: '/products' },
      { name: 'Product Categories', href: '/product_categories' },
      { name: 'Product Brands', href: '/product_brands' },
      { name: 'Stocks', href: '/stocks' },
      { name: 'Stock Movements', href: '/stocks_movements' },
      { name: 'Stock Logs', href: '/stocks_logs' },
      { name: 'Consumption Items', href: '/consumption_items' },
      { name: 'Location Product', href: '/location_product' },
      { name: 'Food Location', href: '/food_location' },
      { name: 'Recipes', href: '/recipes' },
      { name: 'Ingredient Recipes', href: '/ingredient_recipe' },
      { name: 'Units', href: '/units' },
    ],
  },
  {
    name: 'Purchasing & Suppliers',
    href: '/purchases',
    subMenus: [
      { name: 'Purchases', href: '/purchases' },
      { name: 'Purchase Items', href: '/purchase_items' },
      { name: 'Purchase Payments', href: '/purchase_payments' },
      { name: 'Purchase Statuses', href: '/purchase_statuses' },
      { name: 'Purchase Returns', href: '/purchase_returns' },
      { name: 'Purchase Return Items', href: '/purchase_return_items' },
      { name: 'Suppliers', href: '/suppliers' },
    ],
  },
  {
    name: 'Staff & HR',
    href: '/employees',
    subMenus: [
      { name: 'Employees', href: '/employees' },
      { name: 'Employee Categories', href: '/employee_categories' },
      { name: 'Attendance', href: '/employee_attendances' },
      { name: 'Employee Salaries', href: '/employee_salaries' },
      { name: 'Payrolls', href: '/payrolls' },
      { name: 'Administrators', href: '/administrators' },
    ],
  },
  {
    name: 'Financial Management',
    href: '/accounts',
    subMenus: [
      { name: 'Accounts', href: '/accounts' },
      { name: 'Transactions', href: '/transactions' },
      { name: 'Expenses', href: '/expenses' },
      { name: 'Expense Categories', href: '/expense_categories' },
      { name: 'Cash Flows', href: '/cash_flows' },
      { name: 'Cash Flow Logs', href: '/cashflows_logs' },
      { name: 'Registers', href: '/registers' },
      { name: 'Wallets', href: '/wallets' },
      { name: 'Invoices', href: '/invoices' },
      { name: 'Invoice Items', href: '/invoice_items' },
    ],
  },
  {
    name: 'Settings & Configuration',
    href: '/settings',
    subMenus: [
      { name: 'General Settings', href: '/settings' },
      { name: 'Tenant Settings', href: '/tenant_settings' },
      { name: 'Locations', href: '/locations' },
      { name: 'Kitchens', href: '/kitchens' },
      { name: 'Currencies', href: '/currencies' },
      { name: 'Taxes', href: '/taxes' },
      { name: 'Store Timings', href: '/store_timings' },
      { name: 'Announcements', href: '/announcements' },
      { name: 'Payment Gateways', href: '/gateways' },
      { name: 'Translations', href: '/translations' },
      { name: 'FAQs', href: '/faqs' },
      { name: 'Menus', href: '/menus' },
      { name: 'Menu Items', href: '/menu_items' },
    ],
  },
  {
    name: 'System & Administration',
    href: '/users',
    subMenus: [
      { name: 'Users', href: '/users' },
      { name: 'Roles', href: '/roles' },
      { name: 'Permissions', href: '/permissions' },
      { name: 'Model Has Roles', href: '/model_has_roles' },
      { name: 'Model Has Permissions', href: '/model_has_permissions' },
      { name: 'Role Has Permissions', href: '/role_has_permissions' },
      { name: 'API Tokens', href: '/api_tokens' },
      { name: 'OAuth Auth Codes', href: '/oauth_auth_codes' },
      { name: 'OAuth Access Tokens', href: '/oauth_access_tokens' },
      { name: 'OAuth Refresh Tokens', href: '/oauth_refresh_tokens' },
      { name: 'OAuth Clients', href: '/oauth_clients' },
      { name: 'OAuth Personal Access Clients', href: '/oauth_personal_access_clients' },
      { name: 'Failed Jobs', href: '/failed_jobs' },
      { name: 'Import Batches', href: '/import_batches' },
      { name: 'Import Batch Jobs', href: '/import_batch_jobs' },
      { name: 'Gateway Logs', href: '/gateways_logs' },
      { name: 'Notifications', href: '/notifications' },
      { name: 'Password Changes', href: '/password_changes' },
      { name: 'Events', href: '/events' },
      { name: 'Contact Messages', href: '/contact_messages' },
      { name: 'Messages', href: '/messages' },
    ],
  },
];


const getEntityLabel = (resource: string): string => {
  const cfg = entities[resource];
  return cfg ? cfg.label : resource.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};


export default function Navbar() {
  const pathname = usePathname();
  // State to manage open/closed sub-menus
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  return (
    <Box as="nav" bg="var(--navbar-bg)" color="var(--navbar-main-item-inactive-text)" p={4} h="full" overflowY="auto">
      {/* Logo Image and "Restaurant Manager" Text */}
      <Box mb={8} textAlign="center"> {/* Centering the logo and text */}
        <ChakraImage
          src="/carte.png" // Using the provided image path
          alt="Carte Logo"
          width="300px" // Adjust width as needed
          height="auto" // Maintain aspect ratio
          objectFit="contain"
          mx="auto" // Center the image if width is less than container
          mt={4} // Add some top margin
        />
        <Text
          fontSize="md" // Adjust font size as needed
          fontWeight="medium" // Adjust font weight as needed
          color="var(--navbar-main-item-inactive-text)" // Use a suitable color, e.g., white or a light gray
          mt={2} // Margin top to separate from logo
          fontFamily="var(--font-lexend-deca)" // Ensure Lexend Deca font is used
        >
          Restaurant Manager
        </Text>
      </Box>
      <hr style={{ borderColor: 'var(--navbar-submenu-border-color)' }}/> {/* Styled HR */}
      <VStack as="ul" align="stretch" spacing={1} listStyleType="none">
        {dashboardMenu.map((menuItem) => (
          <Box as="li" key={menuItem.name} listStyleType="none">
            {menuItem.subMenus ? (
              <>
                <Button
                  variant="ghost"
                  width="full"
                  justifyContent="space-between"
                  px={4}
                  py={2}
                  rounded="md"
                  fontSize="md"
                  fontWeight="normal"
                  bg={pathname.startsWith(menuItem.href) ? 'var(--navbar-main-item-active-bg)' : 'transparent'}
                  color={pathname.startsWith(menuItem.href) ? 'var(--navbar-main-item-active-text)' : 'var(--navbar-main-item-inactive-text)'}
                  _hover={{ bg: 'var(--navbar-main-item-hover-bg)', color: 'var(--navbar-main-item-active-text)' }}
                  _active={{ bg: 'var(--navbar-main-item-active-bg)' }}
                  _focus={{ outline: 'none', boxShadow: 'none' }}
                  onClick={() => toggleMenu(menuItem.name)}
                >
                  <Text as="span" textTransform="capitalize" fontSize="md" fontWeight="normal" fontFamily="var(--font-lexend-deca)">{menuItem.name}</Text>
                  <Icon
                    as={ChevronDownIcon}
                    ml={2}
                    h={4}
                    w={4}
                    transition="transform 0.2s"
                    transform={openMenus[menuItem.name] ? 'rotate(180deg)' : 'rotate(0deg)'}
                  />
                </Button>
                <Collapse in={openMenus[menuItem.name]} animateOpacity>
                  <VStack
                    as="ul"
                    ml={4}
                    mt={1}
                    borderLeft="1px solid"
                    borderColor="var(--navbar-submenu-border-color)"
                    pl={4}
                    align="stretch"
                    spacing={0.5}
                    listStyleType="none"
                  >
                    {menuItem.subMenus.map((subMenu) => (
                      <Box as="li" key={subMenu.name} listStyleType="none">
                        <Link href={subMenu.href} passHref>
                          <Text
                            as="span"
                            display="block"
                            px={3}
                            py={1}
                            rounded="sm"
                            transition="colors 0.2s"
                            textAlign="left"
                            bg={pathname === subMenu.href ? 'var(--navbar-submenu-active-bg)' : 'transparent'}
                            color={pathname === subMenu.href ? 'var(--navbar-submenu-active-text)' : 'var(--navbar-submenu-inactive-text)'}
                            fontWeight={pathname === subMenu.href ? 'medium' : 'normal'}
                            _hover={{ bg: 'var(--navbar-submenu-hover-bg)', color: 'var(--navbar-submenu-active-text)' }}
                            cursor="pointer"
                            fontFamily="var(--font-lexend-deca)"
                          >
                            {getEntityLabel(subMenu.href.substring(1))}
                          </Text>
                        </Link>
                      </Box>
                    ))}
                  </VStack>
                </Collapse>
              </>
            ) : (
              <Link href={menuItem.href} passHref>
                <Text
                  as="span"
                  display="block"
                  px={4}
                  py={2}
                  rounded="md"
                  transition="colors 0.2s"
                  fontSize="md"
                  fontWeight="normal"
                  textAlign="left"
                  bg={pathname === menuItem.href ? 'var(--navbar-main-item-active-bg)' : 'transparent'}
                  color={pathname === menuItem.href ? 'var(--navbar-main-item-active-text)' : 'var(--navbar-main-item-inactive-text)'}
                  _hover={{ bg: 'var(--navbar-main-item-hover-bg)', color: 'var(--navbar-main-item-active-text)' }}
                  cursor="pointer"
                  fontFamily="var(--font-lexend-deca)"
                >
                  {menuItem.name}
                </Text>
              </Link>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
