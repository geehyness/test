// src/app/pos/management/[entityName]/page.tsx
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
import { entities, EntityConfig, RecipeItem, InventoryProduct, Food, Unit } from "@/lib/config/entities";
import { fetchData, deleteItem } from "@/lib/api";
import { v4 as uuidv4 } from 'uuid';

// Import the new shift management components
import dynamic from 'next/dynamic';
import PayrollManagement from "./PayrollManagement";
import InventoryManagement from "./InventoryManagement";
const ShiftManagement = dynamic(() => import('./ShiftManagement'), {
    ssr: false,
    loading: () => <Center minH="400px"><Spinner size="xl" /></Center>
});

// ADDED: Import the new TimesheetManagement component
const TimesheetManagement = dynamic(() => import('./TimesheetManagement'), {
    ssr: false,
    loading: () => <Center minH="400px"><Spinner size="xl" /></Center>
});

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
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [accessRoles, setAccessRoles] = useState<AccessRole[]>([]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
    const [foodCategories, setFoodCategories] = useState<any[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [currentRecipes, setCurrentRecipes] = useState<RecipeItem[]>([]);
    const [allEmployees, setAllEmployees] = useState<any[]>([]); // For HR entity relationships

    // If the entity is shifts, render the special shift management component
    if (entityName === 'shifts') {
        return <ShiftManagement />;
    }

    // ADDED: If the entity is timesheets, render the new timesheet management component
    if (entityName === 'timesheets') {
        return <TimesheetManagement />;
    }

    if (entityName === 'payrolls') {
        return <PayrollManagement />;
    }

    if (entityName === 'inventory') {
        return <InventoryManagement />; // Remove the incorrect props
    }

    if (entityName === 'purchase_orders') {
        return <PurchaseOrderManagement />;
    }

    const refreshData = useCallback(async () => {
        if (!entityConfig) return;
        setIsLoading(true);
        setError(null);
        try {
            const promises = [fetchData(entityConfig.endpoint)];

            // Add necessary data for different entities
            if (entityName === 'employees') {
                promises.push(fetchData('access_roles'));
                promises.push(fetchData('job_titles'));
                promises.push(fetchData('departments'));
                promises.push(fetchData('users'));
            } else if (entityName === 'foods' || entityName === 'recipes') {
                promises.push(fetchData('inventory_products'));
                promises.push(fetchData('categories'));
                promises.push(fetchData('units'));
            } else if (['payrolls'].includes(entityName)) {
                // For HR entities, we need employee data
                promises.push(fetchData('employees'));
            }

            const results = await Promise.all(promises);

            const fetchedEntityData = results[0];
            let fetchedAccessRoles: any, fetchedJobTitles: any, fetchedDepartments: any, fetchedUsers: any;
            let fetchedInventoryProducts, fetchedFoodCategories, fetchedUnits;
            let fetchedEmployees: any;

            if (entityName === 'employees') {
                [fetchedAccessRoles, fetchedJobTitles, fetchedDepartments, fetchedUsers] = results.slice(1);
            } else if (entityName === 'foods' || entityName === 'recipes') {
                [fetchedInventoryProducts, fetchedFoodCategories, fetchedUnits] = results.slice(1);
            } else if (['payrolls'].includes(entityName)) {
                fetchedEmployees = results[1];
                setAllEmployees(fetchedEmployees || []);
            }

            // Process data based on entity type
            if (entityName === 'employees') {
                const combinedData = (fetchedEntityData || []).map((employee: any) => {
                    const user = (fetchedUsers || []).find((u: any) => u.id === employee.user_id);
                    const mainRole = (fetchedAccessRoles || []).find((r: any) => r.id === employee.main_access_role_id);
                    const jobTitle = (fetchedJobTitles || []).find((p: any) => p.id === employee.job_title_id);
                    const department = (fetchedDepartments || []).find((d: any) => d.id === employee.department);

                    return {
                        ...employee,
                        user,
                        email: user?.email || 'N/A',
                        mainAccessRoleName: mainRole?.name || 'N/A',
                        jobTitleName: jobTitle?.title || 'N/A',
                        departmentName: department?.name || 'N/A',
                    };
                });
                setData(combinedData);
                setAccessRoles(fetchedAccessRoles || []);
                setJobTitles(fetchedJobTitles || []);
                setDepartments(fetchedDepartments || []);
                setUsers(fetchedUsers || []);
            } else if (entityName === 'foods' || entityName === 'recipes') {
                const foodsWithCategories = (fetchedEntityData || []).map((food: Food) => {
                    const category = (fetchedFoodCategories || []).find((cat: any) => cat.id === food.category_id);
                    return {
                        ...food,
                        category_name: category?.name || 'N/A',
                    };
                });
                setData(foodsWithCategories);
                setInventoryProducts(fetchedInventoryProducts || []);
                setFoodCategories(fetchedFoodCategories || []);
                setUnits(fetchedUnits || []);
            } else if (['timesheets', 'payrolls'].includes(entityName)) {
                // Add employee names to HR entities
                const dataWithEmployeeNames = (fetchedEntityData || []).map((item: any) => {
                    const employee = (fetchedEmployees || []).find((e: any) => e.id === item.employee_id);
                    return {
                        ...item,
                        employee_name: employee ? `${employee.first_name} ${employee.last_name}` : 'N/A',
                    };
                });
                setData(dataWithEmployeeNames);
            } else {
                setData(fetchedEntityData || []);
            }

        } catch (err: any) {
            setError(err.message || "Failed to fetch data.");
            toast({
                title: "Error",
                description: err.message || "Failed to load data.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    }, [entityConfig, entityName, toast]);

    useEffect(() => {
        if (!entityName || !entityConfig) {
            // Avoid running for 'shifts' and 'timesheets' since they have their own components
            if (entityName !== 'shifts' && entityName !== 'timesheets') {
                toast({
                    title: "Error",
                    description: `Invalid entity: ${entityName}`,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                router.replace('/pos/management');
            }
            return;
        }
        refreshData();
    }, [entityName, entityConfig, router, toast, refreshData]);

    const handleDelete = useCallback(async (id: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${entityConfig?.label.toLowerCase()}?`)) {
            return;
        }
        try {
            if (entityName === 'employees') {
                const employeeToDelete = data.find(item => item.id === id);
                if (employeeToDelete && employeeToDelete.user_id) {
                    await deleteItem('users', employeeToDelete.user_id);
                }
                await deleteItem(entityConfig!.endpoint, id);
            } else if (entityName === 'foods' || entityName === 'recipes') {
                const foodToDelete = data.find(item => item.id === id);
                if (foodToDelete && foodToDelete.recipes) {
                    await Promise.all(foodToDelete.recipes.map((recipe: RecipeItem) => deleteItem(entities.recipes.endpoint, recipe.id)));
                }
                await deleteItem(entities.foods.endpoint, id);
            } else {
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
            toast({
                title: "Error",
                description: err.message || `Failed to delete ${entityConfig?.label.toLowerCase()}.`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    }, [entityConfig, entityName, toast, refreshData, data]);


    const handleAdd = () => {
        setSelectedItem({ user: {}, other_access_roles: [] });
        setCurrentRecipes([]);
        setIsEditing(false);
        onOpen();
    };

    const handleEdit = useCallback((item: any) => {
        const otherRoles = Array.isArray(item.other_access_roles) ? item.other_access_roles : [];
        setSelectedItem({
            ...item,
            user: { ...item.user },
            other_access_roles: otherRoles,
        });
        setCurrentRecipes(item.recipes || []);
        setIsEditing(true);
        onOpen();
    }, [onOpen]);

    const handleAddRecipe = () => {
        setCurrentRecipes(prev => [
            ...prev,
            { id: uuidv4(), food_id: selectedItem.id, inventory_product_id: '', quantity_used: 0, unit_of_measure: '' }
        ]);
    };

    const handleRecipeChange = (index: number, field: keyof RecipeItem, value: any) => {
        setCurrentRecipes(prev => prev.map((recipe, i) => i === index ? { ...recipe, [field]: value } : recipe));
    };

    const handleRemoveRecipe = (id: string) => {
        setCurrentRecipes(prev => prev.filter(recipe => recipe.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!entityConfig || !selectedItem) return;

        try {
            if (isEditing) {
                if (entityName === 'employees' && selectedItem.user) {
                    await fetchData('users', selectedItem.user.id, selectedItem.user, "PUT");
                }
                if (entityName === 'foods' || entityName === 'recipes') {
                    const recipesToDelete = (data.find(item => item.id === selectedItem.id)?.recipes || [])
                        .filter((r: RecipeItem) => !currentRecipes.some(cr => cr.id === r.id));
                    await Promise.all(recipesToDelete.map((r: RecipeItem) => deleteItem(entities.recipes.endpoint, r.id)));

                    await Promise.all(currentRecipes.map(async (recipe: RecipeItem) => {
                        const existingRecipe = (data.find(item => item.id === selectedItem.id)?.recipes || [])
                            .find((r: RecipeItem) => r.id === recipe.id);
                        if (existingRecipe) {
                            await fetchData(entities.recipes.endpoint, recipe.id, recipe, "PUT");
                        } else {
                            await fetchData(entities.recipes.endpoint, undefined, { ...recipe, food_id: selectedItem.id }, "POST");
                        }
                    }));
                    await fetchData(entities.foods.endpoint, selectedItem.id, selectedItem, "PUT");
                } else {
                    await fetchData(entityConfig.endpoint, selectedItem.id, selectedItem, "PUT");
                }
                toast({
                    title: "Updated",
                    description: `${entityConfig.label} updated successfully.`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                const newItem = {
                    ...selectedItem,
                    id: uuidv4(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                if (entityName === 'employees') {
                    const newUserId = uuidv4();
                    const newUser = {
                        id: newUserId,
                        ...selectedItem.user,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    newItem.user_id = newUserId;
                    await fetchData('users', undefined, newUser, "POST");
                }

                if (entityName === 'foods' || entityName === 'recipes') {
                    newItem.recipes = [];
                    await fetchData(entities.foods.endpoint, undefined, newItem, "POST");
                    await Promise.all(currentRecipes.map(async (recipe: RecipeItem) => {
                        await fetchData(entities.recipes.endpoint, undefined, { ...recipe, food_id: newItem.id }, "POST");
                    }));
                } else {
                    await fetchData(entityConfig.endpoint, undefined, newItem, "POST");
                }

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
            toast({
                title: "Error",
                description: err.message || `Failed to ${isEditing ? 'update' : 'add'} ${entityConfig.label.toLowerCase()}.`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
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

    const excludedFields = useMemo(() => ['created_at', 'updated_at', 'store_id'], []);

    const actionColumn = useMemo(() => ({
        accessorKey: 'actions',
        header: 'Actions',
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
    }), [handleDelete, handleEdit]);

    const columns: Column[] = useMemo(() => {
        if (!entityConfig) {
            return [];
        }

        let entityColumns: Column[] = [];

        if (entityName === 'employees') {
            entityColumns = [
                { accessorKey: 'first_name', header: 'First Name', isSortable: true },
                { accessorKey: 'last_name', header: 'Last Name', isSortable: true },
                { accessorKey: 'email', header: 'Email', isSortable: true },
                { accessorKey: 'mainAccessRoleName', header: 'Role', isSortable: true },
                { accessorKey: 'jobTitleName', header: 'Position', isSortable: true },
                { accessorKey: 'departmentName', header: 'Department', isSortable: true },
            ];
        } else if (entityName === 'foods' || entityName === 'recipes') {
            entityColumns = [
                { accessorKey: 'name', header: 'Name', isSortable: true },
                { accessorKey: 'category_name', header: 'Category', isSortable: true },
                { accessorKey: 'description', header: 'Description', isSortable: true },
                { accessorKey: 'price', header: 'Price (ZAR)', isSortable: true },
                {
                    accessorKey: 'recipes', header: 'Ingredients', cell: (row: Food) => (
                        <VStack align="start" spacing={1}>
                            {(row.recipes || []).map((recipe: RecipeItem, index: number) => {
                                const product = inventoryProducts.find(p => p.id === recipe.inventory_product_id);
                                const unit = units.find(u => u.id === recipe.unit_of_measure);
                                return (
                                    <Text key={index} fontSize="sm"> - {recipe.quantity_used} {unit?.symbol || recipe.unit_of_measure} of {product?.name || 'N/A'} </Text>
                                );
                            })}
                        </VStack>
                    ), isSortable: false,
                },
            ];
        } else if (entityName === 'payrolls') {
            entityColumns = [
                { accessorKey: 'employee_name', header: 'Employee', isSortable: true },
                { accessorKey: 'payment_cycle', header: 'Payment Cycle', isSortable: true },
                { accessorKey: 'pay_period_start', header: 'Period Start', isSortable: true },
                { accessorKey: 'pay_period_end', header: 'Period End', isSortable: true },
                { accessorKey: 'net_pay', header: 'Net Pay', isSortable: true },
                { accessorKey: 'status', header: 'Status', isSortable: true },
            ];
        } else if (entityName === 'companies') {
            entityColumns = [
                { accessorKey: 'name', header: 'Company Name', isSortable: true },
                { accessorKey: 'country', header: 'Country', isSortable: true },
                { accessorKey: 'metrics.total_employees', header: 'Total Employees', isSortable: true, cell: (row: Company) => row.metrics.total_employees },
            ];
        } else {
            entityColumns = entityConfig.fields
                .filter(field => !excludedFields.includes(field))
                .map(field => ({
                    accessorKey: field,
                    header: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    isSortable: true,
                }));
        }
        return [actionColumn, ...entityColumns];
    }, [entityConfig, entityName, excludedFields, actionColumn, inventoryProducts, units]);

    if (!entityConfig) {
        // This will be true for 'shifts' and 'timesheets' on first render, so return null to avoid errors
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
            </Box>
        );
    }

    // Render special form fields for different entities
    const renderEmployeeFormFields = () => (
        <>
            <FormControl isRequired>
                <FormLabel>First Name</FormLabel>
                <Input
                    value={selectedItem?.first_name || ''}
                    onChange={(e) => handleItemChange('first_name', e.target.value)}
                />
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Last Name</FormLabel>
                <Input
                    value={selectedItem?.last_name || ''}
                    onChange={(e) => handleItemChange('last_name', e.target.value)}
                />
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                    type="email"
                    value={selectedItem?.user?.email || ''}
                    onChange={(e) => handleUserChange('email', e.target.value)}
                />
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Main Access Role</FormLabel>
                <Select
                    placeholder="Select role"
                    value={selectedItem?.main_access_role_id || ''}
                    onChange={(e) => handleItemChange('main_access_role_id', e.target.value)}
                >
                    {accessRoles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel>Other Access Roles</FormLabel>
                <CheckboxGroup
                    value={selectedItem?.other_access_roles || []}
                    onChange={(val) => handleItemChange('other_access_roles', val)}
                >
                    <Stack direction="row" flexWrap="wrap">
                        {accessRoles.map(role => (
                            <Checkbox key={role.id} value={role.id}>{role.name}</Checkbox>
                        ))}
                    </Stack>
                </CheckboxGroup>
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Job Title</FormLabel>
                <Select
                    placeholder="Select job title"
                    value={selectedItem?.job_title_id || ''}
                    onChange={(e) => handleItemChange('job_title_id', e.target.value)}
                >
                    {jobTitles.map(title => (
                        <option key={title.id} value={title.id}>{title.title}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel>Department</FormLabel>
                <Select
                    placeholder="Select department"
                    value={selectedItem?.department || ''}
                    onChange={(e) => handleItemChange('department', e.target.value)}
                >
                    {departments.map(department => (
                        <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <Checkbox
                    isChecked={selectedItem?.is_active}
                    onChange={(e) => handleItemChange('is_active', e.target.checked)}
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
                    value={selectedItem?.name || ''}
                    onChange={(e) => handleItemChange('name', e.target.value)}
                />
            </FormControl>
            <FormControl isRequired>
                <FormLabel>Price (ZAR)</FormLabel>
                <NumberInput
                    value={selectedItem?.price || 0}
                    onChange={(_, value) => handleItemChange('price', value)}
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
                    value={selectedItem?.category_id || ''}
                    onChange={(e) => handleItemChange('category_id', e.target.value)}
                >
                    {foodCategories.map((category: any) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </Select>
            </FormControl>
            <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                    value={selectedItem?.description || ''}
                    onChange={(e) => handleItemChange('description', e.target.value)}
                />
            </FormControl>

            <Box w="100%">
                <Heading size="md" mb={4}>Recipes</Heading>
                <VStack spacing={4} align="stretch">
                    {currentRecipes.map((recipe, index) => (
                        <HStack key={recipe.id} spacing={2} borderWidth="1px" p={4} borderRadius="lg">
                            <FormControl>
                                <FormLabel>Product</FormLabel>
                                <Select
                                    placeholder="Select inventory product"
                                    value={recipe.inventory_product_id}
                                    onChange={(e) => handleRecipeChange(index, 'inventory_product_id', e.target.value)}
                                >
                                    {inventoryProducts.map(product => (
                                        <option key={product.id} value={product.id}>{product.name}</option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl w="30%">
                                <FormLabel>Quantity</FormLabel>
                                <NumberInput
                                    value={recipe.quantity_used}
                                    onChange={(_, value) => handleRecipeChange(index, 'quantity_used', value)}
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
                                    onChange={(e) => handleRecipeChange(index, 'unit_of_measure', e.target.value)}
                                >
                                    {units.map(unit => (
                                        <option key={unit.id} value={unit.id}>{unit.symbol}</option>
                                    ))}
                                </Select>
                            </FormControl>
                            <IconButton
                                icon={<FaTrash />}
                                aria-label="Remove recipe item"
                                onClick={() => handleRemoveRecipe(recipe.id)}
                                colorScheme="red"
                                alignSelf="flex-end"
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
                    value={selectedItem?.employee_id || ''}
                    onChange={(e) => handleItemChange('employee_id', e.target.value)}
                >
                    {allEmployees.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                </Select>
            </FormControl>
            {entityName === 'payrolls' && (
                <>
                    <FormControl isRequired>
                        <FormLabel>Payment Cycle</FormLabel>
                        <Input
                            value={selectedItem?.payment_cycle || ''}
                            onChange={(e) => handleItemChange('payment_cycle', e.target.value)}
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Pay Period Start</FormLabel>
                        <Input
                            type="date"
                            value={selectedItem?.pay_period_start || ''}
                            onChange={(e) => handleItemChange('pay_period_start', e.target.value)}
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Pay Period End</FormLabel>
                        <Input
                            type="date"
                            value={selectedItem?.pay_period_end || ''}
                            onChange={(e) => handleItemChange('pay_period_end', e.target.value)}
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Total Wages Due</FormLabel>
                        <NumberInput
                            value={selectedItem?.total_wages_due || 0}
                            onChange={(_, value) => handleItemChange('total_wages_due', value)}
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
                            onChange={(_, value) => handleItemChange('tax_deductions', value)}
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
                            onChange={(_, value) => handleItemChange('net_pay', value)}
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
                        <Input
                            value={selectedItem?.status || ''}
                            onChange={(e) => handleItemChange('status', e.target.value)}
                        />
                    </FormControl>
                </>
            )}
        </>
    );

    const renderGenericFormFields = () => (
        <>
            {entityConfig?.fields
                .filter(field => !excludedFields.includes(field))
                .map(field => (
                    <FormControl key={field} isRequired={field !== 'description'}>
                        <FormLabel>
                            {field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </FormLabel>
                        <Input
                            value={selectedItem?.[field] || ''}
                            onChange={(e) => handleItemChange(field, e.target.value)}
                        />
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

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleSubmit}>
                    <ModalHeader>{isEditing ? `Edit ${entityName === 'recipes' ? 'Food Recipe' : entityConfig.label}` : `Add ${entityName === 'recipes' ? 'Food' : entityConfig.label}`}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            {entityName === 'employees' ? renderEmployeeFormFields() :
                                (entityName === 'foods' || entityName === 'recipes') ? renderFoodFormFields() :
                                    ['timesheets', 'payrolls', 'companies'].includes(entityName) ? renderHRFormFields() :
                                        renderGenericFormFields()}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="red" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="green" type="submit">
                            {isEditing ? "Save" : "Add"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}