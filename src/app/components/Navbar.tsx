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
    <Box as="nav" bg="gray.800" color="white" p={4} h="full" overflowY="auto" /* Removed shadow */>
      {/* Added text-left to ensure title is left-aligned */}
      <br /><br />
      <Heading as="h2" size="xl" mb={8} color="yellow.300" textAlign="left" fontWeight="extrabold">
        Resto Admin
      </Heading>
      <hr />
      <VStack as="ul" align="stretch" spacing={1} listStyleType="none"> {/* Reduced spacing, added listStyleType */}
        {dashboardMenu.map((menuItem) => (
          <Box as="li" key={menuItem.name} listStyleType="none"> {/* Added listStyleType */}
            {menuItem.subMenus ? (
              <>
                {/* Use Chakra Button for expandable menu items */}
                <Button
                  variant="ghost"
                  width="full"
                  justifyContent="space-between"
                  px={4}
                  py={2}
                  rounded="md" /* Slightly less rounded */
                  fontSize="md" /* Slightly smaller font */
                  fontWeight="normal" /* Less bold */
                  bg={pathname.startsWith(menuItem.href) ? 'gray.700' : 'transparent'} /* More subtle active bg */
                  color={pathname.startsWith(menuItem.href) ? 'yellow.300' : 'gray.300'} /* Active color */
                  _hover={{ bg: 'gray.700', color: 'yellow.200' }} /* Subtle hover */
                  _active={{ bg: 'gray.600' }} /* Subtle active */
                  _focus={{ outline: 'none', boxShadow: 'none' }} /* Flat focus */
                  onClick={() => toggleMenu(menuItem.name)}
                >
                  <Text as="span" textTransform="capitalize" fontSize="md" fontWeight="normal">{menuItem.name}</Text>
                  {/* Use Chakra UI icon for chevron */}
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
                    mt={1} /* Reduced margin top */
                    borderLeft="1px solid"
                    borderColor="gray.700" /* Darker, more subtle border */
                    pl={4}
                    align="stretch"
                    spacing={0.5} /* Reduced spacing */
                    listStyleType="none" // Added listStyleType
                  >
                    {menuItem.subMenus.map((subMenu) => (
                      <Box as="li" key={subMenu.name} listStyleType="none"> {/* Added listStyleType */}
                        <Link href={subMenu.href} passHref>
                          <Text
                            as="span"
                            display="block"
                            px={3}
                            py={1}
                            rounded="sm" /* Even less rounded */
                            transition="colors 0.2s"
                            textAlign="left"
                            bg={pathname === subMenu.href ? 'gray.600' : 'transparent'} /* More subtle active bg */
                            color={pathname === subMenu.href ? 'yellow.200' : 'gray.400'} /* Active color */
                            fontWeight={pathname === subMenu.href ? 'medium' : 'normal'}
                            _hover={{ bg: 'gray.700', color: 'yellow.100' }} /* Subtle hover */
                            cursor="pointer"
                          >
                            {getEntityLabel(subMenu.href.substring(1))} {/* Remove leading '/' for entity name */}
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
                  rounded="md" /* Slightly less rounded */
                  transition="colors 0.2s"
                  fontSize="md" /* Slightly smaller font */
                  fontWeight="normal" /* Less bold */
                  textAlign="left"
                  bg={pathname === menuItem.href ? 'gray.700' : 'transparent'} /* More subtle active bg */
                  color={pathname === menuItem.href ? 'yellow.300' : 'gray.300'} /* Active color */
                  _hover={{ bg: 'gray.700', color: 'yellow.200' }} /* Subtle hover */
                  cursor="pointer"
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

