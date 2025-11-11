// src/app/pos/management/[entityName]/page.tsx - CORRECTED
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import DataTable from "@/components/DataTable";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  Flex,
  Spacer,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Select,
  Checkbox,
  CheckboxGroup,
  Stack,
  HStack,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
} from "@chakra-ui/react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import {
  entities,
  EntityConfig,
  RecipeItem,
  InventoryProduct,
  Food,
  Unit,
} from "@/lib/config/entities";
import { fetchData, deleteItem } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

// Import the new shift management components
import dynamic from "next/dynamic";
import PayrollManagement from "./PayrollManagement";
import InventoryManagement from "./InventoryManagement";
const ShiftManagement = dynamic(() => import("./ShiftManagement"), {
  ssr: false,
  loading: () => (
    <Center minH="400px">
      <Spinner size="xl" />
    </Center>
  ),
});

// Import the new TimesheetManagement component
const TimesheetManagement = dynamic(() => import("./TimesheetManagement"), {
  ssr: false,
  loading: () => (
    <Center minH="400px">
      <Spinner size="xl" />
    </Center>
  ),
});

// Import PurchaseOrderManagement
const PurchaseOrderManagement = dynamic(
  () => import("./PurchaseOrderManagement"),
  {
    ssr: false,
    loading: () => (
      <Center minH="400px">
        <Spinner size="xl" />
      </Center>
    ),
  }
);

interface Column {
  accessorKey: string;
  header: string | React.ReactNode;
  cell?: (row: any) => React.ReactNode;
  isSortable?: boolean;
}

interface AccessRole {
  id: string;
  name: string;
}

interface JobTitle {
  id: string;
  title: string;
}

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// New interfaces for HR entities
interface Shift {
  shift_id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  employee_name?: string;
}

interface Payroll {
  payroll_id: string;
  employee_id: string;
  payment_cycle: string;
  pay_period_start: string;
  pay_period_end: string;
  total_wages_due: string;
  tax_deductions: string;
  net_pay: string;
  status: string;
  employee_name?: string;
}

interface Company {
  company_id: string;
  name: string;
  country: string;
  tax_details: {
    tax_year: string;
    efiling_admin: string;
    related_docs: string;
  };
  metrics: {
    total_employees: number;
    active_employees: number;
    employees_on_leave: number;
    terminated_employees: number;
    full_time_employees: number;
    part_time_employees: number;
    contract_employees: number;
    employee_invites: {
      sent: number;
      active: number;
      require_attention: number;
    };
  };
}

export default function DynamicEntityManagementPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const entityName = params.entityName as string;
  const entityConfig: EntityConfig | undefined = entities[entityName];

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [accessRoles, setAccessRoles] = useState<AccessRole[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<
    InventoryProduct[]
  >([]);
  const [foodCategories, setFoodCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [currentRecipes, setCurrentRecipes] = useState<RecipeItem[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]); // For HR entity relationships

  // If the entity is shifts, render the special shift management component
  if (entityName === "shifts") {
    return <ShiftManagement />;
  }

  // If the entity is timesheets, render the new timesheet management component
  if (entityName === "timesheets") {
    return <TimesheetManagement />;
  }

  if (entityName === "payrolls") {
    return <PayrollManagement />;
  }

  if (entityName === "inventory") {
    return <InventoryManagement />;
  }

  if (entityName === "purchase_orders") {
    return <PurchaseOrderManagement />;
  }

  // Enhanced error handling function
  const handleApiError = (error: any, operation: string) => {
    if (error.message?.includes("404")) {
      toast({
        title: "Not Found",
        description: `The requested resource was not found for ${operation}.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } else if (error.message?.includes("405")) {
      toast({
        title: "Method Not Allowed",
        description: `The operation ${operation} is not supported.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } else if (error.message?.includes("400")) {
      toast({
        title: "Bad Request",
        description: `Invalid data provided for ${operation}.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error",
        description: error.message || `Failed to ${operation}.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Form validation function
  const validateForm = (): string | null => {
    if (entityName === "employees") {
      if (!selectedItem?.first_name?.trim()) return "First name is required";
      if (!selectedItem?.last_name?.trim()) return "Last name is required";
      if (!selectedItem?.user?.email?.trim()) return "Email is required";
      if (!selectedItem?.main_access_role_id)
        return "Main access role is required";
      if (!selectedItem?.job_title_id) return "Job title is required";
    }
    if (entityName === "foods" || entityName === "recipes") {
      if (!selectedItem?.name?.trim()) return "Food name is required";
      if (!selectedItem?.price || selectedItem.price <= 0)
        return "Valid price is required";
      if (!selectedItem?.category_id) return "Category is required";
    }
    if (["timesheets", "payrolls"].includes(entityName)) {
      if (!selectedItem?.employee_id) return "Employee is required";
    }
    return null;
  };

  const refreshData = useCallback(async () => {
    if (!entityConfig) return;
    setIsLoading(true);
    setError(null);
    try {
      const promises = [fetchData(entityConfig.endpoint)];

      // Add necessary data for different entities
      if (entityName === "employees") {
        promises.push(fetchData("access_roles"));
        promises.push(fetchData("job_titles"));
        promises.push(fetchData("departments"));
        promises.push(fetchData("users"));
      } else if (entityName === "foods" || entityName === "recipes") {
        promises.push(fetchData("inventory_products"));
        promises.push(fetchData("categories"));
        promises.push(fetchData("units"));
      } else if (["payrolls", "timesheets"].includes(entityName)) {
        // For HR entities, we need employee data
        promises.push(fetchData("employees"));
      }

      const results = await Promise.all(promises);

      const fetchedEntityData = results[0];
      let fetchedAccessRoles: any,
        fetchedJobTitles: any,
        fetchedDepartments: any,
        fetchedUsers: any;
      let fetchedInventoryProducts, fetchedFoodCategories, fetchedUnits;
      let fetchedEmployees: any;

      if (entityName === "employees") {
        [
          fetchedAccessRoles,
          fetchedJobTitles,
          fetchedDepartments,
          fetchedUsers,
        ] = results.slice(1);
      } else if (entityName === "foods" || entityName === "recipes") {
        [fetchedInventoryProducts, fetchedFoodCategories, fetchedUnits] =
          results.slice(1);
      } else if (["payrolls", "timesheets"].includes(entityName)) {
        fetchedEmployees = results[1];
        setAllEmployees(fetchedEmployees || []);
      }

      // Process data based on entity type
      if (entityName === "employees") {
        const combinedData = (fetchedEntityData || []).map((employee: any) => {
          const user = (fetchedUsers || []).find(
            (u: any) => u.id === employee.user_id
          );
          const mainRole = (fetchedAccessRoles || []).find(
            (r: any) => r.id === employee.main_access_role_id
          );
          const jobTitle = (fetchedJobTitles || []).find(
            (p: any) => p.id === employee.job_title_id
          );

          return {
            ...employee,
            user,
            email: user?.email || "N/A",
            mainAccessRoleName: mainRole?.name || "N/A",
            jobTitleName: jobTitle?.title || "N/A",
          };
        });
        setData(combinedData);
        setAccessRoles(fetchedAccessRoles || []);
        setJobTitles(fetchedJobTitles || []);
        setDepartments(fetchedDepartments || []);
        setUsers(fetchedUsers || []);
      } else if (entityName === "foods" || entityName === "recipes") {
        const foodsWithCategories = (fetchedEntityData || []).map(
          (food: Food) => {
            const category = (fetchedFoodCategories || []).find(
              (cat: any) => cat.id === food.category_id
            );
            return {
              ...food,
              category_name: category?.name || "N/A",
            };
          }
        );
        setData(foodsWithCategories);
        setInventoryProducts(fetchedInventoryProducts || []);
        setFoodCategories(fetchedFoodCategories || []);
        setUnits(fetchedUnits || []);
      } else if (["timesheets", "payrolls"].includes(entityName)) {
        // Add employee names to HR entities
        const dataWithEmployeeNames = (fetchedEntityData || []).map(
          (item: any) => {
            const employee = (fetchedEmployees || []).find(
              (e: any) => e.id === item.employee_id
            );
            return {
              ...item,
              employee_name: employee
                ? `${employee.first_name} ${employee.last_name}`
                : "N/A",
            };
          }
        );
        setData(dataWithEmployeeNames);
      } else {
        setData(fetchedEntityData || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
      handleApiError(err, "fetching data");
    } finally {
      setIsLoading(false);
    }
  }, [entityConfig, entityName, toast]);

  useEffect(() => {
    if (!entityName || !entityConfig) {
      // Avoid running for components that have their own management
      if (
        ![
          "shifts",
          "timesheets",
          "payrolls",
          "inventory",
          "purchase_orders",
        ].includes(entityName)
      ) {
        toast({
          title: "Error",
          description: `Invalid entity: ${entityName}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        router.replace("/pos/management");
      }
      return;
    }
    refreshData();
  }, [entityName, entityConfig, router, toast, refreshData]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          `Are you sure you want to delete this ${entityConfig?.label.toLowerCase()}?`
        )
      ) {
        return;
      }
      try {
        if (entityName === "employees") {
          const employeeToDelete = data.find((item) => item.id === id);
          if (employeeToDelete && employeeToDelete.user_id) {
            await deleteItem("users", employeeToDelete.user_id);
          }
          await deleteItem(entityConfig!.endpoint, id);
        } else {
          // For foods, just delete the food - recipes are embedded and will be deleted automatically
          await deleteItem(entityConfig!.endpoint, id);
        }
        toast({
          title: "Deleted",
          description: `${entityConfig?.label} deleted successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        refreshData();
      } catch (err: any) {
        handleApiError(err, `deleting ${entityConfig?.label.toLowerCase()}`);
      }
    },
    [entityConfig, entityName, toast, refreshData, data]
  );

  const handleAdd = () => {
    setSelectedItem({
      user: {},
      other_access_roles: [],
      is_active: true,
      is_available: true,
    });
    setCurrentRecipes([]);
    setIsEditing(false);
    onOpen();
  };

  const handleEdit = useCallback(
    (item: any) => {
      const otherRoles = Array.isArray(item.other_access_roles)
        ? item.other_access_roles
        : [];
      setSelectedItem({
        ...item,
        user: item.user ? { ...item.user } : {}, // FIX: Handle undefined/null user
        other_access_roles: otherRoles,
      });
      setCurrentRecipes(item.recipes || []);
      setIsEditing(true);
      onOpen();
    },
    [onOpen]
  );

  const handleAddRecipe = () => {
    setCurrentRecipes((prev) => [
      ...prev,
      {
        id: uuidv4(),
        food_id: selectedItem?.id || "",
        inventory_product_id: "",
        quantity_used: 0,
        unit_of_measure: "",
      },
    ]);
  };

  const handleRecipeChange = (
    index: number,
    field: keyof RecipeItem,
    value: any
  ) => {
    setCurrentRecipes((prev) =>
      prev.map((recipe, i) =>
        i === index ? { ...recipe, [field]: value } : recipe
      )
    );
  };

  const handleRemoveRecipe = (id: string) => {
    setCurrentRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityConfig || !selectedItem) return;

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let payload = { ...selectedItem };

      // FIX: Handle payroll date formats
      if (entityName === "payrolls") {
        if (payload.pay_period_start) {
          payload.pay_period_start = new Date(payload.pay_period_start).toISOString();
        }
        if (payload.pay_period_end) {
          payload.pay_period_end = new Date(payload.pay_period_end).toISOString();
        }
      }

      if (isEditing) {
        const { user, ...employeeData } = payload;
        // FIX: Handle nested user object for employees
        if (entityName === "employees" && user) {
          if (user.id) {
            await fetchData("users", user.id, user, "PUT");
          }
        }
        if (entityName === "foods" || entityName === "recipes") {
          employeeData.recipes = currentRecipes;
        }
        
        await fetchData(entityConfig.endpoint, selectedItem.id, employeeData, "PUT");

        toast({
          title: "Updated",
          description: `${entityConfig.label} updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

      } else { // Creating a new item
        // FIX: Handle nested user object for new employees
        if (entityName === "employees") {
          const { user, ...employeeData } = selectedItem;
          const newUserPayload = { ...user, password: user.password || 'password' }; // Set default password if not provided
          const createdUser = await fetchData("users", undefined, newUserPayload, "POST");

          if (!createdUser || !createdUser.id) {
            throw new Error("Failed to create user for the employee.");
          }
          // Prepare employee payload with the new user_id, removing user object
          payload = { ...employeeData, user_id: createdUser.id };
        }
        
        if (entityName === "foods" || entityName === "recipes") {
          payload.recipes = currentRecipes;
        }
        
        await fetchData(entityConfig.endpoint, undefined, payload, "POST");
        
        toast({
          title: "Added",
          description: `${entityConfig.label} added successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      refreshData();
    } catch (err: any) {
      handleApiError(
        err,
        `${
          isEditing ? "updating" : "adding"
        } ${entityConfig.label.toLowerCase()}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemChange = (field: string, value: any) => {
    setSelectedItem((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUserChange = (field: string, value: any) => {
    setSelectedItem((prev: any) => ({
      ...prev,
      user: { ...prev.user, [field]: value },
    }));
  };

  const excludedFields = useMemo(
    () => ["created_at", "updated_at", "store_id", "tenant_id"],
    []
  );

  const actionColumn = useMemo(
    () => ({
      accessorKey: "actions",
      header: "Actions",
      isSortable: false,
      cell: (row: any) => (
        <HStack>
          <IconButton
            aria-label="Edit"
            icon={<FaEdit />}
            onClick={() => handleEdit(row)}
            size="sm"
            colorScheme="blue"
          />
          <IconButton
            aria-label="Delete"
            icon={<FaTrash />}
            onClick={() => handleDelete(row.id)}
            size="sm"
            colorScheme="red"
          />
        </HStack>
      ),
    }),
    [handleDelete, handleEdit]
  );

  const columns: Column[] = useMemo(() => {
    if (!entityConfig) {
      return [];
    }

    let entityColumns: Column[] = [];

    if (entityName === "employees") {
      entityColumns = [
        { accessorKey: "first_name", header: "First Name", isSortable: true },
        { accessorKey: "last_name", header: "Last Name", isSortable: true },
        { accessorKey: "email", header: "Email", isSortable: true },
        { accessorKey: "mainAccessRoleName", header: "Role", isSortable: true },
        { accessorKey: "jobTitleName", header: "Position", isSortable: true },
        { accessorKey: "hire_date", header: "Hire Date", isSortable: true },
      ];
    } else if (entityName === "foods" || entityName === "recipes") {
      entityColumns = [
        { accessorKey: "name", header: "Name", isSortable: true },
        { accessorKey: "category_name", header: "Category", isSortable: true },
        { accessorKey: "description", header: "Description", isSortable: true },
        { accessorKey: "price", header: "Price (ZAR)", isSortable: true },
        {
          accessorKey: "recipes",
          header: "Ingredients",
          cell: (row: Food) => (
            <VStack align="start" spacing={1}>
              {(row.recipes || []).map((recipe: RecipeItem, index: number) => {
                const product = inventoryProducts.find(
                  (p) => p.id === recipe.inventory_product_id
                );
                const unit = units.find((u) => u.id === recipe.unit_of_measure);
                return (
                  <Text key={index} fontSize="sm">
                    - {recipe.quantity_used}{" "}
                    {unit?.symbol || recipe.unit_of_measure} of{" "}
                    {product?.name || "N/A"}
                  </Text>
                );
              })}
            </VStack>
          ),
          isSortable: false,
        },
      ];
    } else if (entityName === "payrolls") {
      entityColumns = [
        { accessorKey: "employee_name", header: "Employee", isSortable: true },
        {
          accessorKey: "payment_cycle",
          header: "Payment Cycle",
          isSortable: true,
        },
        {
          accessorKey: "pay_period_start",
          header: "Period Start",
          isSortable: true,
        },
        {
          accessorKey: "pay_period_end",
          header: "Period End",
          isSortable: true,
        },
        { accessorKey: "net_pay", header: "Net Pay", isSortable: true },
        { accessorKey: "status", header: "Status", isSortable: true },
      ];
    } else if (entityName === "companies") {
      entityColumns = [
        { accessorKey: "name", header: "Company Name", isSortable: true },
        { accessorKey: "country", header: "Country", isSortable: true },
        {
          accessorKey: "metrics.total_employees",
          header: "Total Employees",
          isSortable: true,
          cell: (row: Company) => row.metrics.total_employees,
        },
      ];
    } else {
      entityColumns = entityConfig.fields
        .filter((field) => !excludedFields.includes(field))
        .map((field) => ({
          accessorKey: field,
          header: field
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          isSortable: true,
        }));
    }
    return [actionColumn, ...entityColumns];
  }, [
    entityConfig,
    entityName,
    excludedFields,
    actionColumn,
    inventoryProducts,
    units,
  ]);

  if (!entityConfig) {
    // This will be true for components that have their own management
    return null;
  }
  if (isLoading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={8}>
        <Heading>Error</Heading>
        <Text>Failed to load data for {entityName}.</Text>
        <Text color="red.500">{error}</Text>
        <Button mt={4} onClick={refreshData}>
          Retry
        </Button>
      </Box>
    );
  }

  // Render special form fields for different entities
  const renderEmployeeFormFields = () => (
    <>
      <FormControl isRequired>
        <FormLabel>First Name</FormLabel>
        <Input
          value={selectedItem?.first_name || ""}
          onChange={(e) => handleItemChange("first_name", e.target.value)}
          placeholder="Enter first name"
        />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Last Name</FormLabel>
        <Input
          value={selectedItem?.last_name || ""}
          onChange={(e) => handleItemChange("last_name", e.target.value)}
          placeholder="Enter last name"
        />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Email</FormLabel>
        <Input
          type="email"
          value={selectedItem?.user?.email || ""}
          onChange={(e) => handleUserChange("email", e.target.value)}
          placeholder="Enter email address"
        />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Main Access Role</FormLabel>
        <Select
          placeholder="Select role"
          value={selectedItem?.main_access_role_id || ""}
          onChange={(e) =>
            handleItemChange("main_access_role_id", e.target.value)
          }
        >
          {accessRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel>Other Access Roles</FormLabel>
        <CheckboxGroup
          value={selectedItem?.other_access_roles || []}
          onChange={(val) => handleItemChange("other_access_roles", val)}
        >
          <Stack direction="row" flexWrap="wrap">
            {accessRoles.map((role) => (
              <Checkbox key={role.id} value={role.id}>
                {role.name}
              </Checkbox>
            ))}
          </Stack>
        </CheckboxGroup>
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Job Title</FormLabel>
        <Select
          placeholder="Select job title"
          value={selectedItem?.job_title_id || ""}
          onChange={(e) => handleItemChange("job_title_id", e.target.value)}
        >
          {jobTitles.map((title) => (
            <option key={title.id} value={title.id}>
              {title.title}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel>Hire Date</FormLabel>
        <Input
          type="date"
          value={selectedItem?.hire_date || ""}
          onChange={(e) => handleItemChange("hire_date", e.target.value)}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Salary</FormLabel>
        <NumberInput
          value={selectedItem?.salary || 0}
          onChange={(_, value) => handleItemChange("salary", value)}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
      <FormControl>
        <Checkbox
          isChecked={selectedItem?.is_active}
          onChange={(e) => handleItemChange("is_active", e.target.checked)}
        >
          Is Active
        </Checkbox>
      </FormControl>
    </>
  );

  const renderFoodFormFields = () => (
    <>
      <FormControl isRequired>
        <FormLabel>Food Name</FormLabel>
        <Input
          value={selectedItem?.name || ""}
          onChange={(e) => handleItemChange("name", e.target.value)}
          placeholder="Enter food name"
        />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Price (ZAR)</FormLabel>
        <NumberInput
          value={selectedItem?.price || 0}
          onChange={(_, value) => handleItemChange("price", value)}
          min={0}
          precision={2}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Category</FormLabel>
        <Select
          placeholder="Select category"
          value={selectedItem?.category_id || ""}
          onChange={(e) => handleItemChange("category_id", e.target.value)}
        >
          {foodCategories.map((category: any) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          value={selectedItem?.description || ""}
          onChange={(e) => handleItemChange("description", e.target.value)}
          placeholder="Enter food description"
        />
      </FormControl>
      <FormControl>
        <FormLabel>Preparation Time (minutes)</FormLabel>
        <NumberInput
          value={selectedItem?.preparation_time || 0}
          onChange={(_, value) => handleItemChange("preparation_time", value)}
          min={0}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>
      <FormControl>
        <Checkbox
          isChecked={selectedItem?.is_available}
          onChange={(e) => handleItemChange("is_available", e.target.checked)}
        >
          Is Available
        </Checkbox>
      </FormControl>

      <Box w="100%">
        <Heading size="md" mb={4}>
          Recipes
        </Heading>
        <VStack spacing={4} align="stretch">
          {currentRecipes.map((recipe, index) => (
            <HStack
              key={recipe.id}
              spacing={2}
              borderWidth="1px"
              p={4}
              borderRadius="lg"
            >
              <FormControl>
                <FormLabel>Product</FormLabel>
                <Select
                  placeholder="Select inventory product"
                  value={recipe.inventory_product_id}
                  onChange={(e) =>
                    handleRecipeChange(
                      index,
                      "inventory_product_id",
                      e.target.value
                    )
                  }
                >
                  {inventoryProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl w="30%">
                <FormLabel>Quantity</FormLabel>
                <NumberInput
                  value={recipe.quantity_used}
                  onChange={(_, value) =>
                    handleRecipeChange(index, "quantity_used", value)
                  }
                  min={0}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl w="30%">
                <FormLabel>Unit</FormLabel>
                <Select
                  placeholder="Select unit"
                  value={recipe.unit_of_measure}
                  onChange={(e) =>
                    handleRecipeChange(index, "unit_of_measure", e.target.value)
                  }
                >
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.symbol}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                icon={<FaTrash />}
                aria-label="Remove recipe item"
                onClick={() => handleRemoveRecipe(recipe.id)}
                colorScheme="red"
                alignSelf="flex-end"
                mt={6}
              />
            </HStack>
          ))}
          <Button
            leftIcon={<FaPlus />}
            onClick={handleAddRecipe}
            colorScheme="teal"
            variant="outline"
          >
            Add Recipe Item
          </Button>
        </VStack>
      </Box>
    </>
  );

  const renderHRFormFields = () => (
    <>
      <FormControl isRequired>
        <FormLabel>Employee</FormLabel>
        <Select
          placeholder="Select employee"
          value={selectedItem?.employee_id || ""}
          onChange={(e) => handleItemChange("employee_id", e.target.value)}
        >
          {allEmployees.map((emp: any) => (
            <option key={emp.id} value={emp.id}>
              {emp.first_name} {emp.last_name}
            </option>
          ))}
        </Select>
      </FormControl>
      {entityName === "payrolls" && (
        <>
          <FormControl isRequired>
            <FormLabel>Payment Cycle</FormLabel>
            <Select
              value={selectedItem?.payment_cycle || ""}
              onChange={(e) =>
                handleItemChange("payment_cycle", e.target.value)
              }
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Pay Period Start</FormLabel>
            <Input
              type="date"
              value={selectedItem?.pay_period_start?.split('T')[0] || ""}
              onChange={(e) =>
                handleItemChange("pay_period_start", e.target.value)
              }
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Pay Period End</FormLabel>
            <Input
              type="date"
              value={selectedItem?.pay_period_end?.split('T')[0] || ""}
              onChange={(e) =>
                handleItemChange("pay_period_end", e.target.value)
              }
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Gross Pay</FormLabel>
            <NumberInput
              value={selectedItem?.gross_pay || 0}
              onChange={(_, value) => handleItemChange("gross_pay", value)}
              min={0}
              precision={2}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Tax Deductions</FormLabel>
            <NumberInput
              value={selectedItem?.tax_deductions || 0}
              onChange={(_, value) => handleItemChange("tax_deductions", value)}
              min={0}
              precision={2}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Net Pay</FormLabel>
            <NumberInput
              value={selectedItem?.net_pay || 0}
              onChange={(_, value) => handleItemChange("net_pay", value)}
              min={0}
              precision={2}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Status</FormLabel>
            <Select
              value={selectedItem?.status || ""}
              onChange={(e) => handleItemChange("status", e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </Select>
          </FormControl>
        </>
      )}
    </>
  );

  const renderGenericFormFields = () => (
    <>
      {entityConfig?.fields
        .filter((field) => !excludedFields.includes(field))
        .map((field) => (
          <FormControl
            key={field}
            isRequired={
              !field.includes("description") && !field.includes("notes")
            }
          >
            <FormLabel>
              {field
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </FormLabel>
            {field.includes("description") || field.includes("notes") ? (
              <Textarea
                value={selectedItem?.[field] || ""}
                onChange={(e) => handleItemChange(field, e.target.value)}
                placeholder={`Enter ${field.replace(/_/g, " ")}`}
              />
            ) : (
              <Input
                value={selectedItem?.[field] || ""}
                onChange={(e) => handleItemChange(field, e.target.value)}
                placeholder={`Enter ${field.replace(/_/g, " ")}`}
                type={
                  field.includes("email")
                    ? "email"
                    : field.includes("date")
                    ? "date"
                    : "text"
                }
              />
            )}
          </FormControl>
        ))}
    </>
  );

  return (
    <Box p={8}>
      <Flex mb={6} align="center">
        <Heading as="h1" size="xl">
          {entityConfig?.label} Management
        </Heading>
        <Spacer />
        <Button colorScheme="green" leftIcon={<FaPlus />} onClick={handleAdd}>
          Add New {entityConfig?.label}
        </Button>
      </Flex>

      <DataTable columns={columns} data={data} />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>
            {isEditing
              ? `Edit ${
                  entityName === "recipes" ? "Food Recipe" : entityConfig.label
                }`
              : `Add ${entityName === "recipes" ? "Food" : entityConfig.label}`}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="70vh" overflowY="auto">
            <VStack spacing={4}>
              {entityName === "employees"
                ? renderEmployeeFormFields()
                : entityName === "foods" || entityName === "recipes"
                ? renderFoodFormFields()
                : ["timesheets", "payrolls", "companies"].includes(entityName)
                ? renderHRFormFields()
                : renderGenericFormFields()}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={onClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              colorScheme="green"
              type="submit"
              isLoading={isSubmitting}
              loadingText={isEditing ? "Saving..." : "Adding..."}
            >
              {isEditing ? "Save" : "Add"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}