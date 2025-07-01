'use client'; // This is a client component as it uses hooks like useRouter and usePathname

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { entities } from '../config/entities'; // Import your entities configuration

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
    subMenus: [
      { name: 'Summary', href: '/' },
      { name: 'Daily Summaries', href: '/daily_summaries' },
    ],
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

  return (
    // Removed w-64, added h-full to ensure it takes full height of its parent (the fixed div in layout.tsx)
    <nav className="bg-gray-800 text-white p-4 h-full overflow-y-auto shadow-lg">
      <h2 className="text-3xl font-extrabold mb-8 text-yellow-300">Resto Admin</h2>
      <ul>
        {dashboardMenu.map((menuItem) => (
          <li key={menuItem.name} className="mb-2">
            {menuItem.subMenus ? (
              <>
                <button
                  onClick={() => toggleMenu(menuItem.name)}
                  className={`flex items-center justify-between w-full px-4 py-2 rounded-lg transition-colors duration-200
                    ${pathname.startsWith(menuItem.href) ? 'bg-yellow-600 text-white' : 'hover:bg-gray-700 hover:text-yellow-300'}
                    focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50`}
                >
                  <span className="capitalize text-lg font-semibold">{menuItem.name}</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform duration-200 ${openMenus[menuItem.name] ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                {openMenus[menuItem.name] && (
                  <ul className="ml-4 mt-2 border-l border-gray-600 pl-4">
                    {menuItem.subMenus.map((subMenu) => (
                      <li key={subMenu.name} className="mb-1">
                        <Link href={subMenu.href}>
                          <span
                            className={`block px-3 py-1 rounded-md transition-colors duration-200
                              ${pathname === subMenu.href ? 'bg-yellow-500 text-gray-900 font-medium' : 'hover:bg-gray-600 hover:text-yellow-200'}`}
                          >
                            {getEntityLabel(subMenu.href.substring(1))} {/* Remove leading '/' for entity name */}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <Link href={menuItem.href}>
                <span
                  className={`block px-4 py-2 rounded-lg transition-colors duration-200 text-lg font-semibold
                    ${pathname === menuItem.href ? 'bg-yellow-600 text-white' : 'hover:bg-gray-700 hover:text-yellow-300'}`}
                >
                  {menuItem.name}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
