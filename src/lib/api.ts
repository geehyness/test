// src/lib/api.ts
import {
  InventoryProduct,
  Payroll,
} from "./config/entities";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface StandardResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export const getCurrentSessionContext = (): {
  tenant_id: string | null;
  store_id: string | null;
  employee_id: string | null;
} => {
  if (typeof window === "undefined") {
    return { tenant_id: null, store_id: null, employee_id: null };
  }
  try {
    const storedState = sessionStorage.getItem("pos-storage");
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      const staff = parsedState.state?.currentStaff;
      return {
        tenant_id: staff?.tenant_id || null,
        store_id: staff?.storeId || null,
        employee_id: staff?.id || null,
      };
    }
  } catch (e) {
    console.error("Could not parse session storage for context:", e);
  }
  return { tenant_id: null, store_id: null, employee_id: null };
};

const fetcher = async (url: string) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API error: ${response.statusText}. Response: ${errorBody}`
    );
  }

  try {
    const responseData: StandardResponse = await response.json();
    if (responseData.code >= 400) {
      throw new Error(
        responseData.message || `API error: ${responseData.code}`
      );
    }
    return responseData.data;
  } catch (e) {
    console.error("Failed to parse JSON response from fetcher:", e);
    return null;
  }
};

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}


export async function fetchDataWithContext(
  resource: string,
  id?: string,
  data?: Record<string, any>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<any | null> {
  const context = getCurrentSessionContext();
  const contextData = {
    store_id: context.store_id,
    tenant_id: context.tenant_id,
  };

  const finalData =
    method === "POST" || method === "PUT"
      ? { ...contextData, ...data }
      : data;

  return fetchData(resource, id, finalData, method);
}

export async function loginEmployee(
  email: string,
  password: string
): Promise<any> {
  const url = `${BASE_URL}/login`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: email,
      password: password,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Invalid email or password.");
  }

  const loginResponse = await response.json();
  const { access_token, employee } = loginResponse.data;

  if (!employee) throw new Error("Employee data not found in login response.");

  localStorage.setItem("access_token", access_token);
  return employee;
}

export async function deleteItem(
  resource: string,
  id: string
): Promise<{ message: string }> {
  await fetchData(resource, id, undefined, "DELETE");
  return { message: "Item deleted successfully" };
}

// HR functions
export async function getEmployees(): Promise<any[]> {
  return fetchData("employees");
}
export async function getShifts(employeeId?: string): Promise<any[]> {
  const queryParams = employeeId ? { employee_id: employeeId } : undefined;
  return fetchData("shifts", undefined, undefined, "GET", queryParams);
}
export async function createShift(newShift: any): Promise<any> {
  return fetchData("shifts", undefined, newShift, "POST");
}
export async function updateShift(shiftId: string, updates: any): Promise<any> {
  return fetchData(`shifts/${shiftId}`, undefined, updates, "PUT");
}
export async function deleteShift(shiftId: string): Promise<any> {
  return deleteItem('shifts', shiftId);
}
export async function batchCreateShifts(shifts: any[]): Promise<any[]> {
  return fetchData('shifts/batch', undefined, { shifts }, 'POST');
}
export async function batchUpdateShifts(shifts: { id: string; updates: any }[]): Promise<any[]> {
  return fetchData('shifts/batch', undefined, { shifts }, 'PUT');
}
export async function batchDeleteShifts(shiftIds: string[]): Promise<any[]> {
  return fetchData('shifts/batch', undefined, { ids: shiftIds }, 'DELETE');
}

export async function updateShiftStatus(
  shiftId: string,
  isActive: boolean
): Promise<any> {
  return fetchData(`shifts/${shiftId}`, undefined, { active: isActive }, "PUT");
}

export async function getTimesheets(): Promise<any[]> {
  return fetchData("timesheet_entries");
}

export async function createTimesheetEntry(data: any): Promise<any> {
  return fetchData("timesheet_entries", undefined, data, "POST");
}

export async function clockIn(
  employeeId: string,
  storeId: string
): Promise<any> {
  const queryParams = { employee_id: employeeId, store_id: storeId };
  return fetchData("timesheet_entries/clock-in", undefined, {}, "POST", queryParams as any);
}

export async function clockOut(
  timesheetId: string,
  store_id?: string
): Promise<any> {
  return fetchData(
    `timesheet_entries/${timesheetId}/clock-out`,
    undefined,
    {},
    "POST"
  );
}

// Payroll functions
export async function getPayrolls(employeeId?: string): Promise<any[]> {
  const queryParams = employeeId ? { employee_id: employeeId } : undefined;
  return fetchData("payroll", undefined, undefined, "GET", queryParams);
}
export async function getPayrollById(id: string): Promise<any> {
  return fetchData(`payroll/${id}`);
}
export async function calculatePayroll(
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Promise<any> {
  const queryParams = { employee_id: employeeId, period_start: periodStart, period_end: periodEnd };
  return fetchData("payroll/calculate", undefined, {}, "POST", queryParams as any);
}
export async function processPayroll(payrollId: string): Promise<any> {
  return fetchData(`payroll/${payrollId}/process`, undefined, {}, "POST");
}
export async function createPayroll(payrollData: any): Promise<any> {
  return fetchData("payroll", undefined, payrollData, "POST");
}
export async function getPayrollSettings(): Promise<any> {
  const settings = await fetchData("payroll_settings");
  return settings?.[0] || null;
}
export async function updatePayrollSettings(settingsData: any): Promise<any> {
  return createPayrollSettings(settingsData);
}
export async function updatePayrollSettingsWithId(
  id: string,
  settingsData: any
): Promise<any> {
  return fetchData(`payroll_settings/${id}`, undefined, settingsData, "PUT");
}
export async function createPayrollSettings(settingsData: any): Promise<any> {
  return fetchData("payroll_settings", undefined, settingsData, "POST");
}
export async function getPayrollInfo(
  employeeId: string
): Promise<Payroll | null> {
  const payrolls = await getPayrolls(employeeId);
  return (
    payrolls?.find(
      (p: Payroll) =>
        p.employee_id === employeeId &&
        (p.status === "pending" || p.status === "processing")
    ) || null
  );
}
export async function getEmployeeSchedule(employeeId: string): Promise<any> {
  return getShifts(employeeId);
}

// Other management functions
export async function getJobTitles(): Promise<any[]> {
  return fetchData("job_titles");
}
export async function getUnits(): Promise<any[]> {
  return fetchData("units");
}
export async function getAccessRoles(): Promise<any[]> {
  return fetchData("access_roles");
}
export async function getUsers(): Promise<any[]> {
  return fetchData("users");
}

// Inventory & Purchase Order Functions
export async function getInventoryProducts(): Promise<any[]> {
  return fetchData("inventory_products");
}
export async function createInventoryProduct(productData: any): Promise<any> {
  return fetchData("inventory_products", undefined, productData, "POST");
}
export async function updateInventoryProduct(
  productId: string,
  productData: any
): Promise<any> {
  return fetchData(`inventory_products/${productId}`, undefined, productData, "PUT");
}
export async function deleteInventoryProduct(productId: string): Promise<any> {
  return fetchData(`inventory_products/${productId}`, undefined, undefined, "DELETE");
}
export async function getLowStockItems(): Promise<InventoryProduct[]> {
  return fetchData("inventory/low-stock");
}
export async function getPurchaseOrders(): Promise<any[]> {
  return fetchData("purchase_orders");
}
export async function createPurchaseOrder(orderData: any): Promise<any> {
  return fetchData("purchase_orders", undefined, orderData, "POST");
}
export async function updatePurchaseOrder(
  orderId: string,
  orderData: any
): Promise<any> {
  return fetchData(`purchase_orders/${orderId}`, undefined, orderData, "PUT");
}
export async function getGoodsReceipts(): Promise<any[]> {
  return fetchData("goods_receipts");
}
export async function createGoodsReceipt(receiptData: any): Promise<any> {
  return fetchData("goods_receipts", undefined, receiptData, "POST");
}
export async function getSuppliers(): Promise<any[]> {
  return fetchData("suppliers");
}

export async function getTenant(tenantId: string): Promise<any> {
  return fetchData(`tenants`, tenantId);
}

export async function getTenants(): Promise<any[]> {
  return fetchData(`tenants`);
}

export async function getTenantByDomain(domain: string): Promise<any> {
  // This assumes a custom endpoint that is not in the OpenAPI spec.
  return fetchData(`tenants/domain/${domain}`);
}

export async function updateTenantSettings(tenantId: string, settings: any): Promise<any> {
  // This assumes a custom endpoint for just updating the nested settings object.
  return fetchData(`tenants/${tenantId}/customer-page-settings`, undefined, { customer_page_settings: settings }, 'PUT');
}

export async function uploadToCloudinary(file: File): Promise<string> {
  // This is a placeholder. In a real app, you'd get credentials from your backend.
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your_preset');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name'}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) throw new Error("Image upload failed");
  const data = await response.json();
  return data.secure_url;
}

export function validateImageFile(file: File): string | null {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return "Invalid file type. Please upload a JPG, PNG, GIF, or WebP.";
  }
  const maxSizeInMB = 5;
  if (file.size > maxSizeInMB * 1024 * 1024) {
    return `File size exceeds ${maxSizeInMB}MB.`;
  }
  return null;
}


// Add these missing API functions
export async function getInvCategories(): Promise<any[]> {
  return fetchData("inv_categories");
}

export async function getDepartments(): Promise<any[]> {
  return fetchData("departments");
}

export async function getSites(): Promise<any[]> {
  return fetchData("sites");
}

// Enhanced error handling for API calls
const handleApiError = (error: any, operation: string): never => {
  console.error(`API Error during ${operation}:`, error);

  if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
    throw new Error('Unable to connect to server. Please check your connection.');
  }

  if (error.message?.includes('401')) {
    throw new Error('Session expired. Please log in again.');
  }

  if (error.message?.includes('404')) {
    throw new Error('Requested resource not found.');
  }

  throw error;
};

// Enhanced fetchData function with better error handling
export async function fetchData(
  resource: string,
  id?: string,
  data?: Record<string, any>,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  queryParams?: Record<string, string>
): Promise<any | null> {
  try {
    let cleanResource = resource.replace(/^\/|\/$/g, "").replace(/^api\//i, "");
    let url = id
      ? `${BASE_URL}/${cleanResource}/${id}`
      : `${BASE_URL}/${cleanResource}`;

    const allQueryParams = { ...(getCurrentSessionContext() || {}), ...(queryParams || {}) };

    const cleanedQueryParams = Object.entries(allQueryParams).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const query = new URLSearchParams(cleanedQueryParams).toString();
    if (query) {
      url += `?${query}`;
    }

    const headers: HeadersInit = { "Content-Type": "application/json" };
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options: RequestInit = { method, headers };
    if ((method === "POST" || method === "PUT") && data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.detail || errorMessage;
      } catch (e) {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) return null;

    const responseData: StandardResponse = await response.json();
    if (responseData.code >= 400) {
      throw new Error(responseData.message || "An unknown API error occurred.");
    }
    return responseData.data;
  } catch (error) {
    return handleApiError(error, `${method} ${resource}`);
  }
}












