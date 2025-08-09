// src/app/pos/management/[entityName]/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import DataTable from "@/app/components/DataTable";
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
} from "@chakra-ui/react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { entities, EntityConfig, RecipeItem, InventoryProduct, Food, Unit } from "@/app/config/entities";
import { fetchData, deleteItem } from "@/app/lib/api";
import { v4 as uuidv4 } from 'uuid';

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

    const refreshData = useCallback(async () => {
        if (!entityConfig) return;
        setIsLoading(true);
        setError(null);
        try {
            const promises = [fetchData(entityConfig.endpoint)];
            if (entityName === 'employees') {
                promises.push(fetchData('access_roles'));
                promises.push(fetchData('job_titles'));
                promises.push(fetchData('departments'));
                promises.push(fetchData('users'));
            } else if (entityName === 'foods' || entityName === 'recipes') {
                promises.push(fetchData('inventory_products'));
                promises.push(fetchData('categories'));
                promises.push(fetchData('units'));
            }
            const results = await Promise.all(promises);

            const fetchedEntityData = results[0];
            let fetchedAccessRoles: any, fetchedJobTitles: any, fetchedDepartments: any, fetchedUsers: any;
            let fetchedInventoryProducts, fetchedFoodCategories: any, fetchedUnits;

            if (entityName === 'employees') {
                [fetchedAccessRoles, fetchedJobTitles, fetchedDepartments, fetchedUsers] = results.slice(1);
            } else if (entityName === 'foods' || entityName === 'recipes') {
                [fetchedInventoryProducts, fetchedFoodCategories, fetchedUnits] = results.slice(1);
            }

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
            toast({
                title: "Error",
                description: `Invalid entity: ${entityName}`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            router.replace('/pos/management');
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

    // Wrap handleEdit in useCallback
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
    }, [onOpen]); // Add any other dependencies if needed

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
                    colorScheme="blue" // Edit button color changed to blue
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
                { accessorKey: 'price', header: 'Price', isSortable: true },
                {
                    accessorKey: 'recipes',
                    header: 'Ingredients',
                    cell: (row: Food) => (
                        <VStack align="start" spacing={1}>
                            {(row.recipes || []).map((recipe: RecipeItem, index: number) => {
                                const product = inventoryProducts.find(p => p.id === recipe.inventory_product_id);
                                const unit = units.find(u => u.id === recipe.unit_of_measure);
                                return (
                                    <Text key={index} fontSize="sm">
                                        - {recipe.quantity_used} {unit?.symbol || recipe.unit_of_measure} of {product?.name || 'N/A'}
                                    </Text>
                                );
                            })}
                        </VStack>
                    ),
                    isSortable: false,
                },
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

        return [actionColumn, ...entityColumns]; // Move action buttons to the beginning
    }, [entityConfig, entityName, excludedFields, actionColumn, inventoryProducts, units]);


    if (!entityConfig) {
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
            <Center minH="100vh">
                <Text color="red.500">Error: {error}</Text>
            </Center>
        );
    }

    const renderEmployeeFormFields = () => {
        return (
            <>
                <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                        value={selectedItem?.first_name || ''}
                        onChange={(e) => handleItemChange('first_name', e.target.value)}
                    />
                </FormControl>
                <FormControl>
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
                <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input
                        type="password"
                        value={selectedItem?.user?.password || ''}
                        onChange={(e) => handleUserChange('password', e.target.value)}
                    />
                </FormControl>
                <FormControl>
                    <FormLabel>Phone Number</FormLabel>
                    <Input
                        value={selectedItem?.phone_number || ''}
                        onChange={(e) => handleItemChange('phone_number', e.target.value)}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Main Access Role</FormLabel>
                    <Select
                        placeholder="Select a role"
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
                        onChange={(value) => handleItemChange('other_access_roles', value)}
                    >
                        <Stack spacing={2} direction="column">
                            {accessRoles.map(role => (
                                <Checkbox key={role.id} value={role.id}>{role.name}</Checkbox>
                            ))}
                        </Stack>
                    </CheckboxGroup>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Position</FormLabel>
                    <Select
                        placeholder="Select a position"
                        value={selectedItem?.job_title_id || ''}
                        onChange={(e) => handleItemChange('job_title_id', e.target.value)}
                    >
                        {jobTitles.map(jobTitle => (
                            <option key={jobTitle.id} value={jobTitle.id}>{jobTitle.title}</option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel>Department</FormLabel>
                    <Select
                        placeholder="Select a department"
                        value={selectedItem?.department || ''}
                        onChange={(e) => handleItemChange('department', e.target.value)}
                    >
                        {departments.map(department => (
                            <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel>Is Active?</FormLabel>
                    <Checkbox
                        isChecked={selectedItem?.user?.is_active || false}
                        onChange={(e) => handleUserChange('is_active', e.target.checked)}
                    >
                        Active
                    </Checkbox>
                </FormControl>
            </>
        );
    };

    const renderFoodFormFields = () => {
        return (
            <>
                <FormControl isRequired>
                    <FormLabel>Food Name</FormLabel>
                    <Input
                        value={selectedItem?.name || ''}
                        onChange={(e) => handleItemChange('name', e.target.value)}
                    />
                </FormControl>
                <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Input
                        value={selectedItem?.description || ''}
                        onChange={(e) => handleItemChange('description', e.target.value)}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Price</FormLabel>
                    <Input
                        type="number"
                        value={selectedItem?.price || ''}
                        onChange={(e) => handleItemChange('price', parseFloat(e.target.value))}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Select
                        placeholder="Select a category"
                        value={selectedItem?.category_id || ''}
                        onChange={(e) => handleItemChange('category_id', e.target.value)}
                    >
                        {foodCategories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </Select>
                </FormControl>
                <Box mt={4} p={4} borderWidth="1px" borderRadius="md">
                    <Flex alignItems="center" mb={2}>
                        <Heading size="sm">Recipe</Heading>
                        <Spacer />
                        <IconButton
                            aria-label="Add Recipe Item"
                            icon={<FaPlus />}
                            onClick={handleAddRecipe}
                            colorScheme="green"
                            size="sm"
                        />
                    </Flex>
                    <VStack spacing={3} align="stretch">
                        {currentRecipes.map((recipe, index) => (
                            <HStack key={recipe.id} spacing={3}>
                                <FormControl>
                                    <Select
                                        placeholder="Select Raw Material"
                                        value={recipe.inventory_product_id}
                                        onChange={(e) => handleRecipeChange(index, 'inventory_product_id', e.target.value)}
                                    >
                                        {inventoryProducts.map(product => (
                                            <option key={product.id} value={product.id}>{product.name}</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Quantity"
                                        value={recipe.quantity_used}
                                        onChange={(e) => handleRecipeChange(index, 'quantity_used', parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormControl>
                                    <Select
                                        placeholder="Unit of Measure"
                                        value={recipe.unit_of_measure}
                                        onChange={(e) => handleRecipeChange(index, 'unit_of_measure', e.target.value)}
                                    >
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>
                                        ))}
                                    </Select>
                                </FormControl>
                                <IconButton
                                    aria-label="Remove Recipe Item"
                                    icon={<FaTrash />}
                                    onClick={() => handleRemoveRecipe(recipe.id)}
                                    colorScheme="red"
                                    size="sm"
                                />
                            </HStack>
                        ))}
                    </VStack>
                </Box>
            </>
        );
    };

    const renderGenericFormFields = () => {
        const fieldsToRender = entityConfig.fields.filter(field => !excludedFields.includes(field) && field !== 'id');
        return fieldsToRender.map((field) => (
            <FormControl key={field}>
                <FormLabel textTransform="capitalize">{field.replace(/_/g, ' ')}</FormLabel>
                <Input
                    value={selectedItem?.[field] || ''}
                    onChange={(e) => handleItemChange(field, e.target.value)}
                />
            </FormControl>
        ));
    };

    return (
        <Box p={6}>
            <Flex mb={6} alignItems="center">
                <Heading as="h1" size="xl">
                    {entityName === 'recipes' ? 'Food Recipes' : entityConfig.label} Management
                </Heading>
                <Spacer />
                <Button onClick={handleAdd} colorScheme="green">
                    Add {entityName === 'recipes' ? 'Food' : entityConfig.label}
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