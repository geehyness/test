// src/app/components/Navbar.tsx
'use client';

import React, { forwardRef } from 'react'; // Import forwardRef
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { entities } from '../lib/config/entities'; // Import your entities configuration
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Image as ChakraImage
} from '@chakra-ui/react';

interface MenuItem {
  name: string;
  href: string;
  subMenus?: MenuItem[];
}

export const dashboardMenu: MenuItem[] = [
  {
    name: 'Dashboard Overview',
    href: '/',
  },
  {
    name: 'Daily Summaries',
    href: '/daily_summaries',
  },
  {
    name: 'Customer Menu',
    href: '/customer-menu',
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
      { name: 'Tables Sections', href: '/tables_sections' },
      { name: 'Coupons', href: '/coupons' },
      { name: 'Table Coupons', href: '/table_coupons' },
      { name: 'Product Coupons', href: '/product_coupons' },
      { name: 'Customer Coupons', href: '/customer_coupons' },
      { name: 'Coupon Redemptions', href: '/coupon_redemptions' },
    ],
  },
  {
    name: 'Foods & Products',
    href: '/foods',
    subMenus: [
      { name: 'Foods', href: '/foods' },
      { name: 'Food Categories', href: '/food_categories' },
      { name: 'Food Brands', href: '/food_brands' },
      { name: 'Modifiers', href: '/modifiers' },
      { name: 'Food Product', href: '/food_product' },
      { name: 'Products', href: '/products' },
      { name: 'Product Categories', href: '/product_categories' },
      { name: 'Product Brands', href: '/product_brands' },
      { name: 'Stocks', href: '/stocks' },
      { name: 'Stocks Movements', href: '/stocks_movements' },
      { name: 'Stocks Logs', href: '/stocks_logs' },
      { name: 'Consumption Items', href: '/consumption_items' },
      { name: 'Location Product', href: '/location_product' },
      { name: 'Food Location', href: '/food_location' },
      { name: 'Recipes', href: '/recipes' },
      { name: 'Ingredient Recipe', href: '/ingredient_recipe' },
      { name: 'Units', href: '/units' },
    ],
  },
  {
    name: 'Purchases',
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
    name: 'Employees',
    href: '/employees',
    subMenus: [
      { name: 'Employees', href: '/employees' },
      { name: 'Employee Categories', href: '/employee_categories' },
      { name: 'Employee Attendances', href: '/employee_attendances' },
      { name: 'Employee Salaries', href: '/employee_salaries' },
      { name: 'Payrolls', href: '/payrolls' },
      { name: 'Administrators', href: '/administrators' },
    ],
  },
  {
    name: 'Accounts',
    href: '/accounts',
    subMenus: [
      { name: 'Accounts', href: '/accounts' },
      { name: 'Transactions', href: '/transactions' },
      { name: 'Expenses', href: '/expenses' },
      { name: 'Expense Categories', href: '/expense_categories' },
      { name: 'Cash Flows', href: '/cash_flows' },
      { name: 'Cashflows Logs', href: '/cashflows_logs' },
      { name: 'Registers', href: '/registers' },
      { name: 'Wallets', href: '/wallets' },
      { name: 'Invoices', href: '/invoices' },
    ],
  },
  {
    name: 'Other Entities',
    href: '#', // Placeholder href for a category that isn't a direct link
    subMenus: [
      { name: 'Tenants', href: '/tenants' },
      { name: 'Domains', href: '/domains' },
      { name: 'Jobs', href: '/jobs' },
      { name: 'Failed Jobs', href: '/failed_jobs' },
      { name: 'Password Resets', href: '/password_resets' },
      { name: 'Users', href: '/users' },
      { name: 'User Stores', href: '/user_stores' },
      { name: 'Roles', href: '/roles' },
      { name: 'Model Has Roles', href: '/model_has_roles' },
      { name: 'Model Has Permissions', href: '/model_has_permissions' },
      { name: 'Permissions', href: '/permissions' },
      { name: 'Role Has Permissions', href: '/role_has_permissions' },
      { name: 'Languages', href: '/languages' },
      { name: 'Language Translations', href: '/language_translations' },
      { name: 'Customers', href: '/customers' },
      { name: 'Payments', href: '/payments' },
      { name: 'Store Timings', href: '/store_timings' },
      { name: 'Reviews', href: '/reviews' },
      { name: 'FAQs', href: '/faqs' },
      { name: 'Invoice Items', href: '/invoice_items' },
      { name: 'Menus', href: '/menus' },
      { name: 'Menu Items', href: '/menu_items' },
      { name: 'Announcements', href: '/announcements' },
      { name: 'Settings', href: '/settings' },
      { name: 'Carts', href: '/carts' },
      { name: 'Cart Items', href: '/cart_items' },
      { name: 'Delivery Personnel', href: '/delivery_personnels' },
      { name: 'Notifications', href: '/notifications' },
      { name: 'Password Changes', href: '/password_changes' },
      { name: 'Contact Messages', href: '/contact_messages' },
    ],
  },
];

const getEntityLabel = (resource: string): string => {
  const cfg = entities[resource];
  return cfg ? cfg.label : resource.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Use forwardRef to allow parent components to pass a ref to this component
const Navbar = forwardRef<HTMLDivElement, { isOpen: boolean }>(({ isOpen }, ref) => {
  const pathname = usePathname();

  return (
    <Box
      as="nav"
      ref={ref} // Attach the forwarded ref here
      w="250px"
      bg="var(--navbar-bg)"
      color="var(--navbar-main-item-inactive-text)"
      p={4}
      height="100vh"
      position="fixed"
      left={isOpen ? '0' : '-250px'}
      top="0"
      zIndex={20}
      transition="left 0.3s ease-in-out"
      boxShadow="lg"
      display={{ base: 'block', md: 'block' }}
      overflowY="auto"
    >
      {/* Sticky Header Section - Retained from user's provided snippet */}
      <Box
        position="sticky"
        top="0"
        zIndex="10"
        bg="var(--navbar-bg)"
        pb={4}
      >
        <Box mb={2} textAlign="center">
          <br />
          <ChakraImage
            src="/carte.png"
            alt="Carte Logo"
            width="300px"
            height="auto"
            objectFit="contain"
            mx="auto"
            mt={4}
          />
          <br />
          <Text
            fontSize="md"
            fontWeight="medium"
            color="var(--navbar-main-item-inactive-text)"
            mt={2}
            fontFamily="var(--font-lexend-deca)"
          >
            Restaurant Manager
          </Text>
        </Box>
        <hr style={{ borderColor: 'var(--navbar-submenu-border-color)' }} />
        <br />
      </Box>

      {/* Scrollable Menu Section */}
      <VStack as="ul" align="stretch" spacing={1} listStyleType="none">
        {dashboardMenu.map((menuItem) => (
          <Box as="li" key={menuItem.name} listStyleType="none">
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
          </Box>
        ))}
      </VStack>
    </Box>
  );
});

Navbar.displayName = 'Navbar'; // Add a display name for better debugging

export default Navbar;