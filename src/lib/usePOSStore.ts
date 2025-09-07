// src/app/pos/lib/usePOSStore.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from 'uuid';

import {
  Food,
  Category,
  Table,
  Order,
  OrderItem,
  Employee as EmployeeDetails, // Renamed to avoid conflict with local interface
  AccessRole,
  JobTitle,
  Report,
  Store,
  Shift as ShiftDetails,
  TimesheetEntry,
} from "@/lib/config/entities";
import { fetchData, updateShiftStatus, login as loginApi } from "@/lib/api";
import { useToast } from "@chakra-ui/react";
import { POSStaffRole } from "@/types/pos.types";

export interface POSStaff {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  password?: string;
  role: POSStaffRole;
  mainAccessRole: AccessRole;
}

// --- Types for Shift Management ---

// This is the Employee interface used by the Shift Management page
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  mainAccessRoleName?: string;
  name?: string;
  color?: string;
}

// Add the Shift interface
export interface Shift {
  id: string;
  employee_id: string;
  start: string; // ISO string
  end: string;   // ISO string
  title?: string;
  employee_name?: string;
  color?: string;
  active?: boolean;
  recurring?: boolean;
}

// Corrected: Extend Employee type to include store-specific details
type CurrentStaff = (EmployeeDetails & {
  accessRoles: AccessRole[];
  mainAccessRole: AccessRole;
  jobTitleName: string;
  storeName: string | null;
  storeId: string | null;
}) | null;

// Define the shape of your POS state and actions
interface POSState {
  currentStaff: CurrentStaff;
  menuItems: Food[];
  categories: Category[];
  tables: Table[];
  currentOrder: Order;
  activeOrders: Order[];
  accessReports: Report[];
  shifts: Shift[];
  employees: Employee[];
  _hasHydrated: boolean;
  currentTimesheetId: string | null;
  kioskUserId: string | null;
}

interface POSActions {
  loginStaff: (staff: EmployeeDetails) => Promise<void>;
  logoutStaff: () => void;
  setMenuItems: (items: Food[]) => void;
  setCategories: (categories: Category[]) => void;
  setTables: (tables: Table[]) => void;
  setEmployees: (employees: Employee[]) => void;
  addOrderItem: (item: Food) => void;
  removeOrderItem: (foodId: string) => void;
  updateOrderItemQuantity: (foodId: string, quantity: number) => void;
  clearCurrentOrder: () => void;
  setCurrentOrderTable: (tableId: string | null) => void;
  setOrderNotes: (notes: string) => void;
  applyDiscountToOrder: (value: number, type: "percentage" | "amount") => void;
  sendOrderToKitchen: (order: Order) => void;
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => Promise<void>;
  processPayment: (
    order: Order,
    paymentMethod: string,
    tenderedAmount?: number
  ) => Promise<void>;
  updateTableStatus: (tableId: string, status: Table["status"]) => void;
  loadOrderForEditing: (order: Order) => void;
  setActiveOrders: (orders: Order[]) => void;
  logAccessAttempt: (
    userId: string,
    userName: string,
    userRole: string,
    attemptedPath: string
  ) => void;
  setAccessReports: (reports: Report[]) => void;
  setHasHydrated: (state: boolean) => void;
  addOrder: (order: Order) => void;
  processOrderPayment: (order: Order, paymentMethod: "cash" | "card" | "split") => Promise<void>;
  setCurrentOrder: (order: Order) => void;
  setShifts: (shifts: Shift[]) => void;
  addShift: (newShift: Shift) => void;
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;
  deleteShift: (shiftId: string) => void;
  setCurrentTimesheetId: (id: string | null) => void;
  setKioskUserId: (id: string | null) => void;
  login: (username: string, password: string) => Promise<void>;
}

export const usePOSStore = create<POSState & POSActions>()(
  persist(
    (set, get) => ({
      currentStaff: null,
      menuItems: [],
      categories: [],
      tables: [],
      shifts: [],
      employees: [],
      currentOrder: {
        id: "new-order",
        store_id: 'default-store',
        tenant_id: "tenant-231",
        table_id: null,
        customer_id: null,
        total_amount: 0,
        status: "new",
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [],
        subtotal_amount: 0,
        tax_amount: 0,
        discount_amount: 0,
        employee_id: "",
        order_type: undefined,
      },
      activeOrders: [],
      accessReports: [],
      _hasHydrated: false,
      currentTimesheetId: null, // <--- ADDED: Initialize state
      kioskUserId: null,
      _hasHydrated: false,

      // --- New Login Action ---
      login: async (username, password) => {
        try {
          const staff = await loginApi(username, password);
          set({ currentStaff: staff });
        } catch (error) {
          console.error("Login failed", error);
          return Promise.reject(error);
        }
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // --- Shift Management Actions ---
      setEmployees: (employees) => {
        set({ employees: employees });
      },

      setShifts: (shifts) => {
        set({ shifts: shifts });
      },

      addShift: (newShift) => {
        set((state) => ({
          shifts: [...state.shifts, newShift]
        }));
      },

      updateShift: (shiftId, updates) => {
        set((state) => ({
          shifts: state.shifts.map(shift =>
            shift.id === shiftId ? { ...shift, ...updates } : shift
          )
        }));
      },

      deleteShift: async (shiftId) => {
        const toast = useToast();
        try {
          await updateShiftStatus(shiftId, false);
          set((state) => ({
            shifts: state.shifts.map(shift =>
              shift.id === shiftId ? { ...shift, active: false } : shift
            )
          }));
          toast({
            title: "Shift deleted.",
            description: "Shift has been set as inactive.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        } catch (error: any) {
          toast({
            title: "Failed to delete shift.",
            description: error.message || "An error occurred.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      },
      logAccessAttempt: (userId, userName, userRole, attemptedPath) => {
        set((state) => {
          const existingReportIndex = state.accessReports.findIndex(
            (report) =>
              report.user_id === userId &&
              report.user_role === userRole &&
              report.attempted_path === attemptedPath
          );

          const now = new Date().toISOString();
          const updatedReports = [...state.accessReports];

          if (existingReportIndex > -1) {
            updatedReports[existingReportIndex] = {
              ...updatedReports[existingReportIndex],
              attempts: updatedReports[existingReportIndex].attempts + 1,
              last_attempt_at: now,
            };
          } else {
            const newReport: Report = {
              id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              user_id: userId,
              user_name: userName,
              user_role: userRole,
              attempted_path: attemptedPath,
              attempts: 1,
              last_attempt_at: now,
              created_at: now,
            };
            updatedReports.push(newReport);
          }
          return { accessReports: updatedReports };
        });
      },

      setAccessReports: (reports) => set({ accessReports: reports }),

      loginStaff: async (staff: EmployeeDetails) => {
        const allAccessRoles = (await fetchData("access_roles")) as AccessRole[];
        const allJobTitles = (await fetchData("job_titles")) as JobTitle[];
        const stores = (await fetchData("stores")) as Store[];

        const resolvedAccessRoles = staff.access_role_ids
          .map((roleId) => allAccessRoles.find((role) => role.id === roleId))
          .filter(Boolean) as AccessRole[];

        const mainAccessRole = resolvedAccessRoles.find(
          (role) => role.id === staff.main_access_role_id
        );

        const jobTitle = allJobTitles.find((jt) => jt.id === staff.job_title_id);

        const staffStore = stores.find((store: any) => store.id === staff.store_id) || null;

        if (!mainAccessRole) {
          console.error("Main access role not found for staff:", staff);
          set({ currentStaff: null });
          return;
        }

        const staffWithRoles: CurrentStaff = {
          ...staff,
          accessRoles: resolvedAccessRoles,
          mainAccessRole: mainAccessRole,
          jobTitleName: jobTitle ? jobTitle.title : "Unknown",
          storeName: staffStore ? staffStore.name : "Unknown Store",
          storeId: staffStore ? staffStore.id : null,
        };

        const newOrder: Order = {
          id: "new-order",
          store_id: staffStore ? staffStore.id : "",
          tenant_id: "tenant-231",
          table_id: null,
          customer_id: null,
          total_amount: 0,
          status: "new",
          notes: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: [],
          subtotal_amount: 0,
          tax_amount: 0,
          discount_amount: 0,
          employee_id: staff.id,
          order_type: "dine-in",
        };

        set((state) => {
          const currentTableId = state.currentOrder.table_id;
          const updatedTables = currentTableId
            ? state.tables.map((table) =>
              table.id === currentTableId
                ? { ...table, status: "available", current_order_id: null }
                : table
            )
            : state.tables;

          return {
            currentStaff: staffWithRoles,
            currentOrder: newOrder,
            tables: updatedTables,
          };
        });
      },

      logoutStaff: () => set({ currentStaff: null }),
      setMenuItems: (items) => set({ menuItems: items }),
      setCategories: (categories) => set({ categories: categories }),
      setTables: (tables) => set({ tables: tables }),

      addOrderItem: (item: Food) => {
        set((state) => {
          const existingItem = state.currentOrder.items.find(
            (orderItem) => orderItem.food_id === item.id
          );

          let updatedItems: OrderItem[];
          if (existingItem) {
            updatedItems = state.currentOrder.items.map((orderItem) =>
              orderItem.food_id === item.id
                ? {
                  ...orderItem,
                  quantity: orderItem.quantity + 1,
                  sub_total: (orderItem.quantity + 1) * orderItem.price,
                }
                : orderItem
            );
          } else {
            const newItem: OrderItem = {
              id: uuidv4(),
              order_id: state.currentOrder.id,
              food_id: item.id,
              quantity: 1,
              price: item.price,
              sub_total: item.price,
              notes: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              price_at_sale: item.price,
              name: item.name
            };
            updatedItems = [...state.currentOrder.items, newItem];
          }

          const newSubtotal = updatedItems.reduce(
            (sum, oi) => sum + oi.sub_total,
            0
          );
          const newTax = newSubtotal * 0.15;
          const newTotal =
            newSubtotal + newTax - state.currentOrder.discount_amount;

          return {
            currentOrder: {
              ...state.currentOrder,
              items: updatedItems,
              subtotal_amount: newSubtotal,
              tax_amount: newTax,
              total_amount: newTotal,
            },
          };
        });
      },

      removeOrderItem: (foodId: string) => {
        set((state) => {
          const updatedItems = state.currentOrder.items.filter(
            (orderItem) => orderItem.food_id !== foodId
          );

          const newSubtotal = updatedItems.reduce(
            (sum, oi) => sum + oi.sub_total,
            0
          );
          const newTax = newSubtotal * 0.15;
          const newTotal =
            newSubtotal + newTax - state.currentOrder.discount_amount;

          return {
            currentOrder: {
              ...state.currentOrder,
              items: updatedItems,
              subtotal_amount: newSubtotal,
              tax_amount: newTax,
              total_amount: newTotal,
            },
          };
        });
      },

      updateOrderItemQuantity: (foodId: string, quantity: number) => {
        set((state) => {
          const updatedItems = state.currentOrder.items.map((orderItem) =>
            orderItem.food_id === foodId
              ? {
                ...orderItem,
                quantity: quantity,
                sub_total: quantity * orderItem.price,
              }
              : orderItem
          );

          const newSubtotal = updatedItems.reduce(
            (sum, oi) => sum + oi.sub_total,
            0
          );
          const newTax = newSubtotal * 0.15;
          const newTotal =
            newSubtotal + newTax - state.currentOrder.discount_amount;

          return {
            currentOrder: {
              ...state.currentOrder,
              items: updatedItems,
              subtotal_amount: newSubtotal,
              tax_amount: newTax,
              total_amount: newTotal,
            },
          };
        });
      },

      addOrder: (order: Order) => {
        set((state) => ({
          activeOrders: [...state.activeOrders, order]
        }));
      },

      clearCurrentOrder: () => {
        set((state) => {
          const currentTableId = state.currentOrder.table_id;
          const currentStaff = state.currentStaff;
          const updatedTables = currentTableId
            ? state.tables.map((table) =>
              table.id === currentTableId
                ? { ...table, status: "available", current_order_id: null }
                : table
            )
            : state.tables;

          return {
            currentOrder: {
              id: "new-order",
              store_id: currentStaff?.storeId || 'default-store',
              tenant_id: "tenant-231",
              table_id: null,
              customer_id: null,
              total_amount: 0,
              status: "new",
              notes: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              items: [],
              subtotal_amount: 0,
              tax_amount: 0,
              discount_amount: 0,
              employee_id: currentStaff?.id || "null",
              order_type: "dine-in",
            },
            tables: updatedTables,
          };
        });
      },

      setCurrentOrderTable: (tableId: string | null) => {
        set((state) => {
          const prevTableId = state.currentOrder.table_id;
          const updatedTables = state.tables.map((table) => {
            if (table.id === prevTableId && prevTableId !== tableId) {
              return { ...table, status: "available", current_order_id: null };
            }
            if (table.id === tableId) {
              return { ...table, status: "occupied", current_order_id: state.currentOrder.id };
            }
            return table;
          });

          return {
            currentOrder: {
              ...state.currentOrder,
              table_id: tableId,
              order_type: tableId ? "dine-in" : "takeaway",
            },
            tables: updatedTables,
          };
        });
      },

      setOrderNotes: (notes: string) => {
        set((state) => ({
          currentOrder: {
            ...state.currentOrder,
            notes: notes,
          },
        }));
      },

      applyDiscountToOrder: (value: number, type: "percentage" | "amount") => {
        set((state) => {
          const subtotal = state.currentOrder.subtotal_amount;
          let discount = 0;
          if (type === "percentage") {
            discount = subtotal * (value / 100);
          } else {
            discount = value;
          }

          discount = Math.min(discount, subtotal);

          const newTotal = subtotal + state.currentOrder.tax_amount - discount;

          return {
            currentOrder: {
              ...state.currentOrder,
              discount_amount: discount,
              total_amount: newTotal,
            },
          };
        });
      },

      sendOrderToKitchen: (order: Order) => {
        set((state) => {
          const updatedActiveOrders = [...state.activeOrders];
          const existingOrderIndex = updatedActiveOrders.findIndex(
            (o) => o.id === order.id
          );

          const newStatus = "preparing";

          if (existingOrderIndex > -1) {
            updatedActiveOrders[existingOrderIndex] = {
              ...order,
              status: newStatus,
              updated_at: new Date().toISOString(),
            };
          } else {
            updatedActiveOrders.push({
              ...order,
              id: `order-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              status: newStatus,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              employee_id: get().currentStaff?.id || "null",
              order_type: "dine-in",
            });
          }

          const updatedTables = state.tables.map((table) => {
            if (order.table_id && table.id === order.table_id) {
              return { ...table, status: "occupied", current_order_id: order.id };
            }
            return table;
          });

          return {
            activeOrders: updatedActiveOrders,
            tables: updatedTables,
            currentOrder: {
              id: "new-order",
              store_id: get().currentStaff?.storeId || 'default-store',
              tenant_id: "tenant-231",
              table_id: null,
              customer_id: null,
              total_amount: 0,
              status: "new",
              notes: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              items: [],
              subtotal_amount: 0,
              tax_amount: 0,
              discount_amount: 0,
              employee_id: get().currentStaff?.id || "null",
              order_type: "dine-in",
            },
          };
        });
      },

      updateOrder: async (orderId: string, updatedOrder: Partial<Order>) => {
        set((state) => ({
          activeOrders: state.activeOrders.map((order) =>
            order.id === orderId ? { ...order, ...updatedOrder } : order
          ),
          currentOrder:
            state.currentOrder.id === orderId
              ? { ...state.currentOrder, ...updatedOrder }
              : state.currentOrder,
        }));
        await fetchData("orders", orderId, updatedOrder, "PUT");
      },

      processPayment: async (
        order: Order,
        paymentMethod: string,
        tenderedAmount?: number
      ) => {
        console.log("Processing payment for order:", order.id);
        console.log("Payment method:", paymentMethod);
        console.log("Tendered amount (if cash):", tenderedAmount);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("Payment processed successfully (simulated).");

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

      updateTableStatus: (tableId, status) => {
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === tableId ? { ...table, status: status } : table
          ),
        }));
      },

      loadOrderForEditing: (order: Order) => {
        set({
          currentOrder: { ...order },
        });
      },

      setActiveOrders: (orders: Order[]) => {
        set({ activeOrders: orders });
      },

      setCurrentOrder: (order: Order) => {
        set({ currentOrder: order });
      },

      processOrderPayment: async (order: Order, paymentMethod: "cash" | "card" | "split") => {
        const completedOrder = {
          ...order,
          status: "completed",
          payment_method: paymentMethod,
          completed_at: new Date().toISOString(),
        };
        await fetchData("orders", order.id, completedOrder, "PUT");
        set((state) => ({
          activeOrders: state.activeOrders.filter(o => o.id !== order.id)
        }));
      },

      setKioskUserId: (id) => set({ kioskUserId: id }),
      _setHasHydrated: (state: any) => {
        set({
          _hasHydrated: state
        });
      },

      setCurrentTimesheetId: (id) => set({ currentTimesheetId: id }),
    }),
    {
      name: "pos-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentStaff: state.currentStaff,
        activeOrders: state.activeOrders,
        accessReports: state.accessReports,
        _hasHydrated: state._hasHydrated,
        currentTimesheetId: state.currentTimesheetId, // <--- ADDED: Persist timesheet ID
        kioskUserId: state.kioskUserId, // ADDED: Persist kioskUserId
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);