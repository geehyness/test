// src/app/pos/lib/usePOSStore.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
// Corrected import: Use Food instead of MenuItem for menu items in the store
import {
  Food,
  Category,
  Table,
  Order,
  OrderItem,
  Employee as Staff,
} from "@/app/config/entities"; // Alias Employee to Staff

// Define the shape of your POS state
interface POSState {
  currentStaff: Staff | null;
  menuItems: Food[]; // Changed from MenuItem[] to Food[]
  categories: Category[];
  tables: Table[];
  currentOrder: Order;
  activeOrders: Order[]; // Orders that have been sent to kitchen/are preparing/served but not yet paid

  // Actions
  loginStaff: (staff: Staff) => void;
  logoutStaff: () => void;
  setMenuItems: (items: Food[]) => void; // Changed parameter type to Food[]
  setCategories: (categories: Category[]) => void;
  setTables: (tables: Table[]) => void;
  addOrderItem: (item: Food) => void; // Changed parameter type to Food
  removeOrderItem: (foodId: string) => void; // Already correct, using foodId
  updateOrderItemQuantity: (foodId: string, quantity: number) => void; // Already correct, using foodId
  clearCurrentOrder: () => void;
  setCurrentOrderTable: (tableId: string | null) => void;
  setOrderNotes: (notes: string) => void;
  applyDiscountToOrder: (value: number, type: "percentage" | "fixed") => void;
  addOrder: (order: Order) => void; // For adding a new order to activeOrders
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => void; // For updating an existing active order
  setActiveOrders: (orders: Order[]) => void; // For initial load of active orders
  processOrderPayment: (
    order: Order,
    paymentMethod: "cash" | "card" | "split",
    tenderedAmount?: number
  ) => Promise<void>;
  setCurrentOrder: (order: Order) => void;
}

// Helper function to calculate order totals
const calculateOrderTotals = (
  items: OrderItem[],
  discountValue: number = 0,
  discountType: "percentage" | "fixed" = "fixed"
): { subtotal: number; tax: number; discount: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + (item.sub_total || 0), 0); // Use item.sub_total
  const taxRate = 0.15; // Example: 15% tax (consistent with page.tsx)
  let discountAmount = 0;

  if (discountType === "percentage") {
    discountAmount = subtotal * discountValue; // Use discountValue from the function parameter
  } else if (discountType === "fixed") {
    discountAmount = discountValue; // Use discountValue from the function parameter
  }

  const netSubtotal = subtotal - discountAmount;
  const tax = netSubtotal * taxRate;
  const total = netSubtotal + tax;

  return {
    subtotal: subtotal,
    tax: tax,
    discount: discountAmount,
    total: total,
  };
};

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      currentStaff: null,
      menuItems: [], // Now correctly typed as Food[]
      categories: [],
      tables: [],
      currentOrder: {
        id: "", // Will be generated on send/checkout
        tenant_id: "tenant-231", // Added default tenant_id
        table_id: null,
        customer_id: null, // Initialize customer_id as null
        employee_id: "", // Will be set on login/order creation
        items: [],
        subtotal_amount: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        status: "pending",
        notes: "",
        order_type: "dine-in", // Default
        created_at: "",
        updated_at: "",
      },
      activeOrders: [],

      loginStaff: (staff) => set({ currentStaff: staff }),
      logoutStaff: () => set({ currentStaff: null }),
      setMenuItems: (items) => set({ menuItems: items }),
      setCategories: (categories) => set({ categories: categories }),
      setTables: (tables) => set({ tables: tables }),

      addOrderItem: (item: Food) => {
        // Changed parameter type to Food
        set((state) => {
          // Use food_id for consistency as per entities.ts and api.ts
          const existingItemIndex = state.currentOrder.items.findIndex(
            (orderItem) => orderItem.food_id === item.id
          );

          let updatedItems: OrderItem[];
          if (existingItemIndex > -1) {
            updatedItems = state.currentOrder.items.map((orderItem, index) =>
              index === existingItemIndex
                ? {
                    ...orderItem,
                    quantity: orderItem.quantity + 1,
                    // Use price_at_sale for subtotal calculation
                    sub_total:
                      (orderItem.quantity + 1) * (orderItem.price_at_sale || 0),
                  }
                : orderItem
            );
          } else {
            // Ensure all required OrderItem properties are initialized
            updatedItems = [
              ...state.currentOrder.items,
              {
                id: `order-item-${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(2, 9)}`, // Generate unique ID for OrderItem
                order_id: state.currentOrder.id, // Will be updated when order is saved
                food_id: item.id, // Use food_id
                name: item.name, // Add name for display
                quantity: 1,
                price: item.sale_price || 0, // Original price from Food, provide fallback
                price_at_sale: item.sale_price || item.sale_price || 0, // Price at time of adding (from Food's sale_price or price)
                sub_total: item.sale_price || item.sale_price || 0, // Initial sub_total for 1 quantity
                notes: "", // Initialize with empty notes
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ];
          }

          const { subtotal, tax, discount, total } = calculateOrderTotals(
            updatedItems,
            state.currentOrder.discount_amount, // Pass current discount
            // Infer type based on how discount was previously applied, or default to fixed
            state.currentOrder.discount_amount > 0 &&
              state.currentOrder.subtotal_amount > 0 &&
              state.currentOrder.discount_amount /
                state.currentOrder.subtotal_amount <
                1
              ? "percentage"
              : "fixed"
          );

          return {
            currentOrder: {
              ...state.currentOrder,
              items: updatedItems,
              subtotal_amount: subtotal,
              tax_amount: tax,
              discount_amount: discount,
              total_amount: total,
            },
          };
        });
      },

      removeOrderItem: (foodId) => {
        // Changed menuItemId to foodId for consistency
        set((state) => {
          const updatedItems = state.currentOrder.items.filter(
            (item) => item.food_id !== foodId // Use food_id
          );

          const { subtotal, tax, discount, total } = calculateOrderTotals(
            updatedItems,
            state.currentOrder.discount_amount, // Pass current discount
            state.currentOrder.discount_amount > 0 &&
              state.currentOrder.subtotal_amount > 0 &&
              state.currentOrder.discount_amount /
                state.currentOrder.subtotal_amount <
                1
              ? "percentage"
              : "fixed"
          );

          return {
            currentOrder: {
              ...state.currentOrder,
              items: updatedItems,
              subtotal_amount: subtotal,
              tax_amount: tax,
              discount_amount: discount,
              total_amount: total,
            },
          };
        });
      },

      updateOrderItemQuantity: (foodId, quantity) => {
        // Changed menuItemId to foodId for consistency
        set((state) => {
          const updatedItems = state.currentOrder.items
            .map((item) =>
              item.food_id === foodId // Use food_id
                ? {
                    ...item,
                    quantity: quantity,
                    sub_total: quantity * (item.price_at_sale || 0),
                  } // Use price_at_sale
                : item
            )
            .filter((item) => item.quantity > 0); // Remove if quantity drops to 0

          const { subtotal, tax, discount, total } = calculateOrderTotals(
            updatedItems,
            state.currentOrder.discount_amount, // Pass current discount
            state.currentOrder.discount_amount > 0 &&
              state.currentOrder.subtotal_amount > 0 &&
              state.currentOrder.discount_amount /
                state.currentOrder.subtotal_amount <
                1
              ? "percentage"
              : "fixed"
          );

          return {
            currentOrder: {
              ...state.currentOrder,
              items: updatedItems,
              subtotal_amount: subtotal,
              tax_amount: tax,
              discount_amount: discount,
              total_amount: total,
            },
          };
        });
      },

      clearCurrentOrder: () => {
        set((state) => ({
          currentOrder: {
            id: "",
            tenant_id: "tenant-231", // Added default tenant_id
            table_id: null,
            customer_id: null,
            employee_id: state.currentStaff?.id || "",
            items: [],
            subtotal_amount: 0,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: 0,
            status: "pending",
            notes: "",
            order_type: "dine-in",
            created_at: "",
            updated_at: "",
          },
        }));
      },

      setCurrentOrder: (order: Order) => {
        // IMPLEMENTED THIS ACTION
        set({ currentOrder: order });
      },

      setCurrentOrderTable: (tableId) => {
        set((state) => ({
          currentOrder: {
            ...state.currentOrder,
            table_id: tableId,
            order_type: tableId ? "dine-in" : "takeaway", // Update order_type based on table selection
          },
        }));
      },

      setOrderNotes: (notes) => {
        set((state) => ({
          currentOrder: {
            ...state.currentOrder,
            notes: notes,
          },
        }));
      },

      applyDiscountToOrder: (value, type) => {
        set((state) => {
          const { subtotal, tax, discount, total } = calculateOrderTotals(
            state.currentOrder.items,
            value,
            type
          );
          return {
            currentOrder: {
              ...state.currentOrder,
              subtotal_amount: subtotal,
              tax_amount: tax,
              discount_amount: discount,
              total_amount: total,
            },
          };
        });
      },

      addOrder: (order) => {
        set((state) => ({
          activeOrders: [...state.activeOrders, order],
        }));
      },

      updateOrder: (orderId: string, updatedOrder: Partial<Order>) => {
        set((state) => ({
          activeOrders: state.activeOrders.map((order) =>
            order.id === orderId ? { ...order, ...updatedOrder } : order
          ),
        }));
      },

      setActiveOrders: (orders: Order[]) => set({ activeOrders: orders }),

      processOrderPayment: async (
        order: Order,
        paymentMethod: "cash" | "card" | "split",
        tenderedAmount?: number
      ) => {
        // Here you would typically make an API call to your backend
        // For demonstration, we'll simulate it.
        console.log(
          `Processing payment for order ${order.id} via ${paymentMethod}`
        );
        console.log("Order details:", order);
        console.log("Tendered amount (if cash):", tenderedAmount);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // In a real scenario, the backend would handle:
        // 1. Saving the order with status 'paid'
        // 2. Creating a Payment record
        // 3. Updating inventory (if MenuItem links to Product)
        // 4. Updating table status to 'available' if dine-in

        // Simulate success
        console.log("Payment processed successfully (simulated).");

        // Update the order status in activeOrders to 'paid'
        set((state) => ({
          activeOrders: state.activeOrders.map((o) =>
            o.id === order.id ? { ...o, status: "paid" } : o
          ),
          tables: state.tables.map((table) =>
            table.current_order_id === order.id
              ? { ...table, status: "available", current_order_id: null }
              : table
          ),
        }));
      },
    }),
    {
      name: "pos-storage", // unique name
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for temporary persistence
      // Optionally, only persist specific parts of the state
      partialize: (state) => ({
        currentStaff: state.currentStaff,
        activeOrders: state.activeOrders,
        // Do NOT persist currentOrder as it should be fresh on page load or login
        // Do NOT persist menuItems, categories, tables as they should be fetched from API
      }),
    }
  )
);
