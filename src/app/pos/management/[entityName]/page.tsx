// src/app/pos/management/[entityName]/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { uploadToCloudinary, validateImageFile } from '@/lib/api';

import { useParams, useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
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
	Image,
	UnorderedList,
	ListItem
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import {
	entities,
	EntityConfig,
	RecipeItem,
	InventoryProduct,
	Food,
	Unit,
	Employee,
} from '@/lib/config/entities';
import {
	fetchData,
	deleteItem,
	fetchDataWithContext,
	getCurrentSessionContext,
	canDeleteEntity,
} from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';

// Import the new shift management components
import dynamic from 'next/dynamic';
import PayrollManagement from './PayrollManagement';
import InventoryManagement from './InventoryManagement';
import TenantSettings from './TenantSettings';

const ShiftManagement = dynamic(() => import('./ShiftManagement'), {
	ssr: false,
	loading: () => (
		<Center minH="400px">
			<Spinner size="xl" />
		</Center>
	),
});

// Import the new TimesheetManagement component
const TimesheetManagement = dynamic(() => import('./TimesheetManagement'), {
	ssr: false,
	loading: () => (
		<Center minH="400px">
			<Spinner size="xl" />
		</Center>
	),
});

// Import PurchaseOrderManagement
const PurchaseOrderManagement = dynamic(
	() => import('./PurchaseOrderManagement'),
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


	const [imageFiles, setImageFiles] = useState<File[]>([]);
	const [imagePreviews, setImagePreviews] = useState<string[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Add these state variables near your other useState declarations
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);

	// Add dependency warning state
	const [dependencyWarning, setDependencyWarning] = useState<{
		isOpen: boolean;
		entityName: string;
		dependencies: string[];
	}>({ isOpen: false, entityName: '', dependencies: [] });

	// Add these functions near your other handler functions
	const openImageModal = (imageUrl: string) => {
		setSelectedImage(imageUrl);
		setIsImageModalOpen(true);
	};

	const closeImageModal = () => {
		setSelectedImage(null);
		setIsImageModalOpen(false);
	};

	const handleDeleteExistingFoodImage = (index: number) => {
		if (!selectedItem?.image_urls) return;

		const updatedImages = [...selectedItem.image_urls];
		updatedImages.splice(index, 1);

		handleItemChange('image_urls', updatedImages);
	};

	const handleDeleteExistingCategoryImage = () => {
		handleItemChange('image_url', '');
	};

	// Reset form function
	const resetForm = () => {
		setImageFiles([]);
		setImagePreviews([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};


	// If the entity is shifts, render the special shift management component
	if (entityName === 'shifts') {
		return <ShiftManagement />;
	}

	if (entityName === 'tenant_settings') {
		return <TenantSettings />;
	  }

	// If the entity is timesheets, render the new timesheet management component
	if (entityName === 'timesheets') {
		return <TimesheetManagement />;
	}

	if (entityName === 'payrolls') {
		return <PayrollManagement />;
	}

	if (entityName === 'inventory') {
		return <InventoryManagement />;
	}

	if (entityName === 'purchase_orders') {
		return <PurchaseOrderManagement />;
	}

	// Enhanced error handling function with warning messages
	const handleApiError = (error: any, operation: string) => {
		// Handle validation errors specifically with warning messages
		if (error.message?.includes('422')) {
			try {
				const errorData = JSON.parse(error.message);
				if (
					errorData.detail &&
					Array.isArray(errorData.detail)
				) {
					const errorMessages = errorData.detail
						.map((err: any) => {
							const field =
								err.loc[
								err.loc
									.length -
								1
								];
							const friendlyName =
								field
									.replace(
										/_/g,
										' '
									)
									.replace(
										/\b\w/g,
										(
											l: string
										) =>
											l.toUpperCase()
									);
							return `${friendlyName}: ${err.msg}`;
						})
						.join(', ');

					toast({
						title: 'Form Validation Warning',
						description: `Please check: ${errorMessages}`,
						status: 'warning',
						duration: 6000,
						isClosable: true,
					});
					return;
				}
			} catch {
				// If parsing fails, use the original error
				toast({
					title: 'Validation Warning',
					description:
						error.message ||
						`Please check your input for ${operation}.`,
					status: 'warning',
					duration: 5000,
					isClosable: true,
				});
			}
		} else if (error.message?.includes('404')) {
			toast({
				title: 'Not Found',
				description: `The requested resource was not found for ${operation}.`,
				status: 'warning',
				duration: 5000,
				isClosable: true,
			});
		} else if (error.message?.includes('405')) {
			toast({
				title: 'Method Not Allowed',
				description: `The operation ${operation} is not supported.`,
				status: 'warning',
				duration: 5000,
				isClosable: true,
			});
		} else if (error.message?.includes('400')) {
			toast({
				title: 'Input Warning',
				description: `Please check your input data for ${operation}.`,
				status: 'warning',
				duration: 5000,
				isClosable: true,
			});
		} else if (
			error.message?.includes('Network error') ||
			error.message?.includes('fetch')
		) {
			toast({
				title: 'Connection Issue',
				description:
					'Unable to connect to the server. Please check your connection.',
				status: 'warning',
				duration: 5000,
				isClosable: true,
			});
		} else {
			// For generic errors, use warning instead of error
			toast({
				title: 'Operation Warning',
				description:
					error.message ||
					`Failed to ${operation}. Please try again.`,
				status: 'warning',
				duration: 5000,
				isClosable: true,
			});
		}
	};

	// Enhanced form validation function for all entities
	const validateForm = (): string | null => {
		if (entityName === 'employees') {
			if (!selectedItem?.first_name?.trim())
				return 'First name is required';
			if (!selectedItem?.last_name?.trim())
				return 'Last name is required';
			if (!selectedItem?.user?.email?.trim())
				return 'Email is required';
			if (!selectedItem?.main_access_role_id)
				return 'Main access role is required';
			if (!selectedItem?.job_title_id)
				return 'Job title is required';
			if (!selectedItem?.hire_date)
				return 'Hire date is required';
			if (!selectedItem?.salary || selectedItem.salary < 0)
				return 'Valid salary is required';
		} else if (entityName === 'foods' || entityName === 'recipes') {
			if (!selectedItem?.name?.trim())
				return 'Food name is required';
			if (!selectedItem?.description?.trim())
				return 'Description is required';
			if (!selectedItem?.price || selectedItem.price <= 0)
				return 'Valid price is required';
			if (!selectedItem?.category_id)
				return 'Category is required';
		} else if (
			entityName === 'categories' ||
			entityName === 'inv_categories'
		) {
			if (!selectedItem?.name?.trim())
				return 'Category name is required';
		} else if (entityName === 'customers') {
			if (!selectedItem?.first_name?.trim())
				return 'First name is required';
			if (!selectedItem?.store_id) return 'Store is required';
		} else if (entityName === 'tables') {
			if (!selectedItem?.name?.trim())
				return 'Table name is required';
			if (
				!selectedItem?.capacity ||
				selectedItem.capacity <= 0
			)
				return 'Valid capacity is required';
			if (!selectedItem?.location?.trim())
				return 'Location is required';
			if (!selectedItem?.store_id) return 'Store is required';
		} else if (entityName === 'access_roles') {
			if (!selectedItem?.name?.trim())
				return 'Role name is required';
			if (!selectedItem?.landing_page?.trim())
				return 'Landing page is required';
			if (
				!selectedItem?.permissions ||
				selectedItem.permissions.length === 0
			)
				return 'At least one permission is required';
		} else if (entityName === 'job_titles') {
			if (!selectedItem?.title?.trim())
				return 'Job title is required';
		} else if (entityName === 'departments') {
			if (!selectedItem?.name?.trim())
				return 'Department name is required';
			if (!selectedItem?.store_id) return 'Store is required';
		} else if (entityName === 'inventory_products') {
			if (!selectedItem?.name?.trim())
				return 'Product name is required';
			if (!selectedItem?.sku?.trim())
				return 'SKU is required';
			if (!selectedItem?.unit_of_measure)
				return 'Unit of measure is required';
			if (
				!selectedItem?.unit_cost ||
				selectedItem.unit_cost < 0
			)
				return 'Valid unit cost is required';
			if (
				!selectedItem?.quantity_in_stock ||
				selectedItem.quantity_in_stock < 0
			)
				return 'Valid quantity is required';
			if (
				!selectedItem?.reorder_level ||
				selectedItem.reorder_level < 0
			)
				return 'Valid reorder level is required';
		} else if (entityName === 'suppliers') {
			if (!selectedItem?.name?.trim())
				return 'Supplier name is required';
			if (!selectedItem?.contact_person?.trim())
				return 'Contact person is required';
			if (!selectedItem?.phone?.trim())
				return 'Phone number is required';
			if (!selectedItem?.email?.trim())
				return 'Email is required';
			if (!selectedItem?.address?.trim())
				return 'Address is required';
		} else if (entityName === 'units') {
			if (!selectedItem?.name?.trim())
				return 'Unit name is required';
			if (!selectedItem?.symbol?.trim())
				return 'Unit symbol is required';
		} else if (['stores', 'tenants'].includes(entityName)) {
			if (!selectedItem?.name?.trim())
				return 'Name is required';
			if (!selectedItem?.email?.trim())
				return 'Email is required';
			if (entityName === 'stores') {
				if (!selectedItem?.address?.trim())
					return 'Address is required';
				if (!selectedItem?.phone?.trim())
					return 'Phone is required';
			}
		} else if (entityName === 'reservations') {
			if (!selectedItem?.customer_id)
				return 'Customer is required';
			if (!selectedItem?.date_time)
				return 'Date and time is required';
			if (
				!selectedItem?.number_of_guests ||
				selectedItem.number_of_guests <= 0
			)
				return 'Valid number of guests is required';
			if (!selectedItem?.store_id) return 'Store is required';
		} else if (entityName === 'users') {
			if (!selectedItem?.email?.trim())
				return 'Email is required';
			if (!selectedItem?.username?.trim())
				return 'Username is required';
			if (!isEditing && !selectedItem?.password?.trim())
				return 'Password is required for new users';
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
			if (entityName === 'employees') {
				promises.push(fetchData('access_roles'));
				promises.push(fetchData('job_titles'));
				promises.push(fetchData('departments'));
				promises.push(fetchData('users'));
			} else if (
				entityName === 'foods' ||
				entityName === 'recipes'
			) {
				promises.push(fetchData('inventory_products'));
				promises.push(fetchData('categories'));
				promises.push(fetchData('units'));
			} else if (
				['payrolls', 'timesheets'].includes(entityName)
			) {
				// For HR entities, we need employee data
				promises.push(fetchData('employees'));
			}

			const results = await Promise.all(promises);

			const fetchedEntityData = results[0];
			let fetchedAccessRoles: any,
				fetchedJobTitles: any,
				fetchedDepartments: any,
				fetchedUsers: any;
			let fetchedInventoryProducts,
				fetchedFoodCategories: any,
				fetchedUnits;
			let fetchedEmployees: any;

			if (entityName === 'employees') {
				[
					fetchedAccessRoles,
					fetchedJobTitles,
					fetchedDepartments,
					fetchedUsers,
				] = results.slice(1);
			} else if (
				entityName === 'foods' ||
				entityName === 'recipes'
			) {
				[
					fetchedInventoryProducts,
					fetchedFoodCategories,
					fetchedUnits,
				] = results.slice(1);
			} else if (
				['payrolls', 'timesheets'].includes(entityName)
			) {
				fetchedEmployees = results[1];
				setAllEmployees(fetchedEmployees || []);
			}

			// Process data based on entity type
			if (entityName === 'employees') {
				const combinedData = (
					fetchedEntityData || []
				).map((employee: any) => {
					const user = (fetchedUsers || []).find(
						(u: any) =>
							u.id ===
							employee.user_id
					);
					const mainRole = (
						fetchedAccessRoles || []
					).find(
						(r: any) =>
							r.id ===
							employee.main_access_role_id
					);
					const jobTitle = (
						fetchedJobTitles || []
					).find(
						(p: any) =>
							p.id ===
							employee.job_title_id
					);

					return {
						...employee,
						user,
						email: user?.email || 'N/A',
						mainAccessRoleName:
							mainRole?.name || 'N/A',
						jobTitleName:
							jobTitle?.title ||
							'N/A',
					};
				});
				setData(combinedData);
				setAccessRoles(fetchedAccessRoles || []);
				setJobTitles(fetchedJobTitles || []);
				setDepartments(fetchedDepartments || []);
				setUsers(fetchedUsers || []);
			} else if (
				entityName === 'foods' ||
				entityName === 'recipes'
			) {
				const foodsWithCategories = (
					fetchedEntityData || []
				).map((food: Food) => {
					const category = (
						fetchedFoodCategories || []
					).find(
						(cat: any) =>
							cat.id ===
							food.category_id
					);
					return {
						...food,
						category_name:
							category?.name || 'N/A',
					};
				});
				setData(foodsWithCategories);
				setInventoryProducts(
					fetchedInventoryProducts || []
				);
				setFoodCategories(fetchedFoodCategories || []);
				setUnits(fetchedUnits || []);
			} else if (
				['timesheets', 'payrolls'].includes(entityName)
			) {
				// Add employee names to HR entities
				const dataWithEmployeeNames = (
					fetchedEntityData || []
				).map((item: any) => {
					const employee = (
						fetchedEmployees || []
					).find(
						(e: any) =>
							e.id ===
							item.employee_id
					);
					return {
						...item,
						employee_name: employee
							? `${employee.first_name} ${employee.last_name}`
							: 'N/A',
					};
				});
				setData(dataWithEmployeeNames);
			} else {
				setData(fetchedEntityData || []);
			}
		} catch (err: any) {
			setError(err.message || 'Failed to fetch data.');
			handleApiError(err, 'fetching data');
		} finally {
			setIsLoading(false);
		}
	}, [entityConfig, entityName, toast]);

	useEffect(() => {
		if (!entityName || !entityConfig) {
			// Avoid running for components that have their own management
			if (
				![
					'shifts',
					'timesheets',
					'payrolls',
					'inventory',
					'purchase_orders',
				].includes(entityName)
			) {
				toast({
					title: 'Error',
					description: `Invalid entity: ${entityName}`,
					status: 'error',
					duration: 5000,
					isClosable: true,
				});
				router.replace('/pos/management');
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
				if (entityName === 'employees') {
					const employeeToDelete = data.find(
						(item) => item.id === id
					);
					if (
						employeeToDelete &&
						employeeToDelete.user_id
					) {
						await deleteItem(
							'users',
							employeeToDelete.user_id
						);
					}
					await deleteItem(
						entityConfig!.endpoint,
						id
					);
				} else if (entityName === 'foods') {
					// For foods, just delete the food - recipes are embedded and will be deleted automatically
					await deleteItem(
						entityConfig!.endpoint,
						id
					);
				} else {
					// Generic delete for other entities
					await deleteItem(
						entityConfig!.endpoint,
						id
					);
				}
				toast({
					title: 'Deleted',
					description: `${entityConfig?.label} deleted successfully.`,
					status: 'success',
					duration: 3000,
					isClosable: true,
				});
				refreshData();
			} catch (err: any) {
				handleApiError(
					err,
					`deleting ${entityConfig?.label.toLowerCase()}`
				);
			}
		},
		[entityConfig, entityName, toast, refreshData, data]
	);

	const handleAdd = () => {
		const session = getCurrentSessionContext();

		const baseItem: any = {
			is_active: true,
			is_available: true,
			description: '',
		};

		// Add entity-specific default fields
		if (entityName === 'employees') {
			baseItem.user = {};
			baseItem.other_access_roles = [];
			baseItem.access_role_ids = [];
			baseItem.main_access_role_id = '';
			baseItem.store_id = session.store_id;
			baseItem.tenant_id = session.tenant_id;
			baseItem.hire_date = new Date()
				.toISOString()
				.split('T')[0];
			baseItem.salary = 0;
			baseItem.first_name = '';
			baseItem.last_name = '';
		} else if (entityName === 'foods' || entityName === 'recipes') {
			baseItem.store_id = session.store_id;
			baseItem.tenant_id = session.tenant_id;
			baseItem.is_available = true;
			baseItem.price = 0;
			baseItem.preparation_time = 0;
			baseItem.allergens = [];
			baseItem.recipes = [];
			baseItem.image_urls = []; // Initialize as empty array
			baseItem.name = '';
			baseItem.description = '';
		} else if (
			['categories', 'inv_categories'].includes(entityName)
		) {
			baseItem.store_id = session.store_id;
			baseItem.name = '';
			baseItem.description = '';
		} else if (entityName === 'customers') {
			baseItem.store_id = session.store_id;
			baseItem.first_name = '';
			baseItem.last_name = '';
			baseItem.loyalty_points = 0;
		} else if (entityName === 'tables') {
			baseItem.store_id = session.store_id;
			baseItem.name = '';
			baseItem.capacity = 4;
			baseItem.location = '';
			baseItem.status = 'available';
		} else if (entityName === 'access_roles') {
			baseItem.name = '';
			baseItem.description = '';
			baseItem.landing_page = '';
			baseItem.permissions = [];
		} else if (entityName === 'job_titles') {
			baseItem.title = '';
			baseItem.description = '';
			baseItem.store_id = session.store_id;
		} else if (entityName === 'departments') {
			baseItem.name = '';
			baseItem.store_id = session.store_id;
		} else if (entityName === 'inventory_products') {
			baseItem.store_id = session.store_id;
			baseItem.tenant_id = session.tenant_id;
			baseItem.name = '';
			baseItem.sku = '';
			baseItem.unit_of_measure = '';
			baseItem.unit_cost = 0;
			baseItem.quantity_in_stock = 0;
			baseItem.reorder_level = 5;
		} else if (entityName === 'suppliers') {
			baseItem.name = '';
			baseItem.contact_person = '';
			baseItem.phone = '';
			baseItem.email = '';
			baseItem.address = '';
		} else if (entityName === 'units') {
			baseItem.name = '';
			baseItem.symbol = '';
		} else if (entityName === 'stores') {
			baseItem.tenant_id = session.tenant_id;
			baseItem.name = '';
			baseItem.address = '';
			baseItem.phone = '';
			baseItem.email = '';
		} else if (entityName === 'tenants') {
			baseItem.name = '';
			baseItem.email = '';
			baseItem.password = 'default123';
		} else if (entityName === 'reservations') {
			baseItem.store_id = session.store_id;
			baseItem.date_time = new Date().toISOString();
			baseItem.number_of_guests = 2;
			baseItem.status = 'confirmed';
		} else if (entityName === 'users') {
			baseItem.email = '';
			baseItem.username = '';
			baseItem.password = 'default123';
			baseItem.cashAccounts = [];
			baseItem.cardAccounts = [];
			baseItem.onlineAccounts = [];
			baseItem.gpayAccounts = [];
			baseItem.phonepeAccounts = [];
			baseItem.amazonpayAccounts = [];
			baseItem.locations = [];
		}

		setSelectedItem(baseItem);

		// Initialize recipes for food entities
		if (entityName === 'foods' || entityName === 'recipes') {
			setCurrentRecipes([]);
		}

		// Reset form state including images
		resetForm();
		setIsEditing(false);
		onOpen();
	};

	// Create a custom close handler that resets the form
	const handleCloseModal = () => {
		resetForm();
		onClose();
	};

	const handleEdit = useCallback(
		(item: any) => {
			if (entityName === 'employees') {
				// Extract roles
				const accessRoleIds = Array.isArray(
					item.access_role_ids
				)
					? item.access_role_ids
					: [];
				const mainRoleId =
					item.main_access_role_id ||
					(accessRoleIds.length > 0
						? accessRoleIds[0]
						: '');

				// FIX: Include the main role in other_access_roles so it shows as checked
				const otherRoles = [...accessRoleIds]; // This includes the main role

				console.log('Editing employee:', {
					accessRoleIds,
					mainRoleId,
					otherRoles,
					item,
				});

				setSelectedItem({
					...item,
					user: item.user
						? { ...item.user }
						: { email: '' }, // Provide default structure
					main_access_role_id: mainRoleId,
					other_access_roles: otherRoles,
					description: item.description || '',
				});
			} else if (
				entityName === 'foods' ||
				entityName === 'recipes'
			) {
				// Handle food items with recipes
				setSelectedItem({
					...item,
					description: item.description || '',
				});
				setCurrentRecipes(item.recipes || []);
			} else {
				// Generic handling for other entities
				setSelectedItem({
					...item,
					description: item.description || '',
				});
			}

			// Reset image selections when editing
			resetForm();
			setIsEditing(true);
			onOpen();
		},
		[entityName, onOpen]
	);

	// Handle file selection
	/*const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file
		const validationError = validateImageFile(file);
		if (validationError) {
			toast({
				title: 'Invalid Image',
				description: validationError,
				status: 'warning',
				duration: 5000,
				isClosable: true,
			});
			return;
		}

		setImageFile(file);

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			setImagePreview(e.target?.result as string);
		};
		reader.readAsDataURL(file);
	};*/

	// Handle image upload

	/*/ Clear image selection
	const handleClearImage = () => {
		setImageFile(null);
		setImagePreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};*/

	// Handle multiple file selection
	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;

		// Validate each file
		const validFiles: File[] = [];
		const invalidFiles: string[] = [];

		files.forEach(file => {
			const validationError = validateImageFile(file);
			if (validationError) {
				invalidFiles.push(`${file.name}: ${validationError}`);
			} else {
				validFiles.push(file);
			}
		});

		// Show errors for invalid files
		if (invalidFiles.length > 0) {
			toast({
				title: 'Invalid Images',
				description: invalidFiles.join(', '),
				status: 'warning',
				duration: 5000,
				isClosable: true,
			});
		}

		if (validFiles.length === 0) return;

		// Create previews for valid files
		const newPreviews: string[] = [];
		validFiles.forEach(file => {
			const reader = new FileReader();
			reader.onload = (e) => {
				newPreviews.push(e.target?.result as string);
				// When all previews are loaded, update state
				if (newPreviews.length === validFiles.length) {
					setImagePreviews(prev => [...prev, ...newPreviews]);
				}
			};
			reader.readAsDataURL(file);
		});

		setImageFiles(prev => [...prev, ...validFiles]);
	};

	// Handle multiple image uploads
	const handleImageUploads = async (): Promise<string[] | null> => {
		if (imageFiles.length === 0) return null;

		setIsUploading(true);
		const uploadPromises = imageFiles.map(file => uploadToCloudinary(file));

		try {
			const imageUrls = await Promise.all(uploadPromises);
			toast({
				title: 'Images Uploaded',
				description: `${imageUrls.length} images successfully uploaded`,
				status: 'success',
				duration: 3000,
				isClosable: true,
			});
			return imageUrls;
		} catch (error: any) {
			toast({
				title: 'Upload Failed',
				description: error.message || 'Failed to upload some images',
				status: 'error',
				duration: 5000,
				isClosable: true,
			});
			return null;
		} finally {
			setIsUploading(false);
		}
	};

	// Clear a specific image
	const handleRemoveImage = (index: number) => {
		setImageFiles(prev => prev.filter((_, i) => i !== index));
		setImagePreviews(prev => prev.filter((_, i) => i !== index));
	};

	// Clear all images
	const handleClearAllImages = () => {
		setImageFiles([]);
		setImagePreviews([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleAddRecipe = () => {
		setCurrentRecipes((prev) => [
			...prev,
			{
				id: uuidv4(),
				food_id: selectedItem?.id || '',
				inventory_product_id: '',
				quantity_used: 0,
				unit_of_measure: '',
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
				i === index
					? { ...recipe, [field]: value }
					: recipe
			)
		);
	};

	const handleRemoveRecipe = (id: string) => {
		setCurrentRecipes((prev) =>
			prev.filter((recipe) => recipe.id !== id)
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!entityConfig || !selectedItem) return;

		const validationError = validateForm();
		if (validationError) {
			toast({
				title: 'Form Incomplete',
				description: validationError,
				status: 'warning',
				duration: 5000,
				isClosable: true,
			});
			return;
		}

		setIsSubmitting(true);

		try {
			let finalImageUrls: string[] | string | undefined;

			if (entityName === 'foods') {
				// For foods: multiple images
				const existingUrls = selectedItem.image_urls || [];
				let newImageUrls: string[] = [];

				if (imageFiles.length > 0) {
					const uploadedUrls = await handleImageUploads();
					if (uploadedUrls) newImageUrls = uploadedUrls;
					else return;
				}

				finalImageUrls = [...existingUrls, ...newImageUrls];
			}
			else if (entityName === 'categories') {
				// For categories: single image (only use first image)
				const existingUrl = selectedItem.image_url;
				let newImageUrl: string | undefined = existingUrl;

				if (imageFiles.length > 0) {
					const uploadedUrls = await handleImageUploads();
					if (uploadedUrls && uploadedUrls.length > 0) {
						newImageUrl = uploadedUrls[0]; // Only use the first image
					} else {
						return;
					}
				}

				finalImageUrls = newImageUrl;
			}

			const session = getCurrentSessionContext();

			let submitData: any;
			if (entityName === 'foods') {
				submitData = {
					...selectedItem,
					image_urls: finalImageUrls as string[]
				};
			} else if (entityName === 'categories') {
				submitData = {
					...selectedItem,
					image_url: finalImageUrls as string  // Single image URL
				};
			} else {
				submitData = selectedItem;
			}

			// ... rest of your submit logic remains the same
			if (isEditing) {
				await fetchDataWithContext(entityConfig.endpoint, selectedItem.id, submitData, 'PUT');
				toast({
					title: 'Updated',
					description: `${entityConfig.label} updated successfully.`,
					status: 'success',
					duration: 3000,
					isClosable: true,
				});
			} else {
				await fetchDataWithContext(entityConfig.endpoint, undefined, submitData, 'POST');
				toast({
					title: 'Added',
					description: `${entityConfig.label} added successfully.`,
					status: 'success',
					duration: 3000,
					isClosable: true,
				});
			}

			onClose();
			refreshData();
		} catch (err: any) {
			handleApiError(err, `${isEditing ? 'updating' : 'adding'} ${entityConfig.label.toLowerCase()}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Enhanced delete handler with custom modal
	const handleDeleteFromModal = async () => {
		if (!selectedItem?.id) return;

		// Get the display name
		const entityDisplayName =
			selectedItem.name ||
			selectedItem.title ||
			selectedItem.email ||
			(selectedItem.first_name && selectedItem.last_name ? `${selectedItem.first_name} ${selectedItem.last_name}` : null) ||
			(selectedItem.first_name ? selectedItem.first_name : null) ||
			(entityName === 'reservations' ? `reservation for ${selectedItem.number_of_guests || ''} guests` : null) ||
			`this ${entityConfig?.label.toLowerCase()}`;

		// Check for dependencies first
		try {
			const deleteCheck = await canDeleteEntity(entityName, selectedItem.id);

			if (!deleteCheck.canDelete) {
				setDependencyWarning({
					isOpen: true,
					entityName: entityDisplayName,
					dependencies: deleteCheck.dependencies || []
				});
				return;
			}
		} catch (error) {
			console.error('Error checking dependencies:', error);
			// If dependency check fails, ask user if they want to proceed anyway
			if (!window.confirm(
				`Unable to verify dependencies for "${entityDisplayName}".\n\nThis might be used by other records. Are you sure you want to delete it?`
			)) {
				return;
			}
		}

		// If we get here, either no dependencies or user confirmed despite check failure
		if (!window.confirm(
			`Are you sure you want to delete "${entityDisplayName}"? This action cannot be undone.`
		)) {
			return;
		}

		try {
			if (entityName === 'employees') {
				const employeeToDelete = data.find(
					(item) => item.id === selectedItem.id
				);
				if (employeeToDelete && employeeToDelete.user_id) {
					await deleteItem('users', employeeToDelete.user_id);
				}
				await deleteItem(entityConfig!.endpoint, selectedItem.id);
			} else if (entityName === 'foods') {
				await deleteItem(entityConfig!.endpoint, selectedItem.id);
			} else {
				await deleteItem(entityConfig!.endpoint, selectedItem.id);
			}

			toast({
				title: 'Deleted',
				description: `"${entityDisplayName}" has been deleted successfully.`,
				status: 'success',
				duration: 3000,
				isClosable: true,
			});

			onClose();
			refreshData();
		} catch (err: any) {
			handleApiError(err, `deleting "${entityDisplayName}"`);
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

	// Fixed NumberInput handler function
	const handleNumberInputChange = (
		field: string,
		valueString: string
	) => {
		const value = valueString === '' ? 0 : parseFloat(valueString);
		handleItemChange(field, value);
	};

	const handleRecipeNumberInputChange = (
		index: number,
		field: keyof RecipeItem,
		valueString: string
	) => {
		const value = valueString === '' ? 0 : parseFloat(valueString);
		handleRecipeChange(index, field, value);
	};

	const excludedFields = useMemo(
		() => ['created_at', 'updated_at', 'store_id', 'tenant_id'],
		[]
	);

	const actionColumn = useMemo(
		() => ({
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
					{/* Remove the delete button from here */}
				</HStack>
			),
		}),
		[handleEdit] // Remove handleDelete from dependencies
	);

	const columns: Column[] = useMemo(() => {
		if (!entityConfig) {
			return [];
		}

		let entityColumns: Column[] = [];

		if (entityName === 'employees') {
			entityColumns = [
				{
					accessorKey: 'first_name',
					header: 'First Name',
					isSortable: true,
				},
				{
					accessorKey: 'last_name',
					header: 'Last Name',
					isSortable: true,
				},
				{
					accessorKey: 'email',
					header: 'Email',
					isSortable: true,
				},
				{
					accessorKey: 'mainAccessRoleName',
					header: 'Role',
					isSortable: true,
				},
				{
					accessorKey: 'jobTitleName',
					header: 'Position',
					isSortable: true,
				},
				{
					accessorKey: 'hire_date',
					header: 'Hire Date',
					isSortable: true,
				},
			];
		} else if (entityName === 'foods' || entityName === 'recipes') {
			entityColumns = [
				{
					accessorKey: 'name',
					header: 'Name',
					isSortable: true,
				},
				{
					accessorKey: 'category_name',
					header: 'Category',
					isSortable: true,
				},
				{
					accessorKey: 'description',
					header: 'Description',
					isSortable: true,
				},
				{
					accessorKey: 'price',
					header: 'Price (ZAR)',
					isSortable: true,
				},
				{
					accessorKey: 'recipes',
					header: 'Ingredients',
					cell: (row: Food) => (
						<VStack align="start" spacing={1}>
							{(row.recipes || []).map((recipe: RecipeItem, index: number) => {
								const product = inventoryProducts.find((p) => p.id === recipe.inventory_product_id);
								const unit = units.find((u) => u.id === recipe.unit_of_measure);
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
				// KEEP ONLY ONE IMAGE COLUMN - REMOVE THE DUPLICATE BELOW
				{
					accessorKey: entityName === 'foods' ? 'image_urls' : 'image_url',
					header: 'Image(s)',
					cell: (row: any) => {
						if (entityName === 'foods') {
							const imageUrls = row.image_urls || [];
							return imageUrls.length > 0 ? (
								<HStack spacing={1}>
									{imageUrls.slice(0, 3).map((url: string, index: number) => (
										<Image
											key={index}
											src={url}
											alt={`${row.name} ${index + 1}`}
											boxSize="40px"
											objectFit="cover"
											borderRadius="md"
										/>
									))}
									{imageUrls.length > 3 && (
										<Text fontSize="xs" color="gray.500">
											+{imageUrls.length - 3} more
										</Text>
									)}
								</HStack>
							) : (
								<Text color="gray.500" fontSize="sm">No Images</Text>
							);
						} else {
							return row.image_url ? (
								<Image
									src={row.image_url}
									alt={row.name}
									boxSize="50px"
									objectFit="cover"
									borderRadius="md"
								/>
							) : (
								<Text color="gray.500" fontSize="sm">No Image</Text>
							);
						}
					},
					isSortable: false,
				},
				// REMOVE THIS DUPLICATE COLUMN
			];
		} else if (entityName === 'payrolls') {
			entityColumns = [
				{
					accessorKey: 'employee_name',
					header: 'Employee',
					isSortable: true,
				},
				{
					accessorKey: 'payment_cycle',
					header: 'Payment Cycle',
					isSortable: true,
				},
				{
					accessorKey: 'pay_period_start',
					header: 'Period Start',
					isSortable: true,
				},
				{
					accessorKey: 'pay_period_end',
					header: 'Period End',
					isSortable: true,
				},
				{
					accessorKey: 'net_pay',
					header: 'Net Pay',
					isSortable: true,
				},
				{
					accessorKey: 'status',
					header: 'Status',
					isSortable: true,
				},
			];
		} else if (entityName === 'companies') {
			entityColumns = [
				{
					accessorKey: 'name',
					header: 'Company Name',
					isSortable: true,
				},
				{
					accessorKey: 'country',
					header: 'Country',
					isSortable: true,
				},
				{
					accessorKey: 'metrics.total_employees',
					header: 'Total Employees',
					isSortable: true,
					cell: (row: Company) =>
						row.metrics.total_employees,
				},
			];
		} else if (entityName === 'categories') {
			// Special handling for categories - exclude the ID field
			entityColumns = entityConfig.fields
				.filter(
					(field) =>
						!excludedFields.includes(field) &&
						field !== 'id'
				)
				.map((field) => {
					if (field === 'image') {
						// Handle image field specially
						return {
							accessorKey: field,
							header: 'Image',
							cell: ({ row }: any) => {
								const imageUrl = row.original.image;
								return imageUrl ? (
									<img
										src={imageUrl}
										alt="Category"
										style={{
											width: 50,
											height: 50,
											objectFit: 'cover',
											borderRadius: '8px',
										}}
									/>
								) : (
									<span>No Image</span>
								);
							},
						};
					}

					// Default field handling
					return {
						accessorKey: field,
						header: field
							.replace(/_/g, ' ')
							.replace(/\b\w/g, (c) => c.toUpperCase()),
						isSortable: true,
					};
				});
		}
		else {
			entityColumns = entityConfig.fields
				.filter(
					(field) =>
						!excludedFields.includes(
							field
						) && field !== 'id'
				)
				.map((field) => ({
					accessorKey: field,
					header: field
						.replace(/_/g, ' ')
						.replace(/\b\w/g, (c) =>
							c.toUpperCase()
						),
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

	// Dependency warning modal component
	const DependencyWarningModal = () => (
		<Modal isOpen={dependencyWarning.isOpen} onClose={() => setDependencyWarning({ isOpen: false, entityName: '', dependencies: [] })}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader color="red.500">Cannot Delete</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<VStack align="start" spacing={3}>
						<Text fontWeight="bold">"{dependencyWarning.entityName}" cannot be deleted because it's being used by:</Text>
						<Box bg="red.50" p={3} borderRadius="md" w="100%">
							<UnorderedList>
								{dependencyWarning.dependencies.map((dep, index) => (
									<ListItem key={index}>{dep}</ListItem>
								))}
							</UnorderedList>
						</Box>
						<Text color="orange.600" fontSize="sm">
							Please remove these dependencies first or contact an administrator.
						</Text>
					</VStack>
				</ModalBody>
				<ModalFooter>
					<Button colorScheme="blue" onClick={() => setDependencyWarning({ isOpen: false, entityName: '', dependencies: [] })}>
						Understand
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);

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
				<Text>
					Failed to load data for {entityName}.
				</Text>
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
					value={selectedItem?.first_name || ''}
					onChange={(e) =>
						handleItemChange(
							'first_name',
							e.target.value
						)
					}
					placeholder="Enter first name"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Last Name</FormLabel>
				<Input
					value={selectedItem?.last_name || ''}
					onChange={(e) =>
						handleItemChange(
							'last_name',
							e.target.value
						)
					}
					placeholder="Enter last name"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Email</FormLabel>
				<Input
					type="email"
					value={selectedItem?.user?.email || ''}
					onChange={(e) =>
						handleUserChange(
							'email',
							e.target.value
						)
					}
					placeholder="Enter email address"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Main Access Role</FormLabel>
				<Select
					placeholder="Select role"
					value={
						selectedItem?.main_access_role_id ||
						''
					}
					onChange={(e) =>
						handleItemChange(
							'main_access_role_id',
							e.target.value
						)
					}
				>
					{accessRoles.map((role) => (
						<option
							key={role.id}
							value={role.id}
						>
							{role.name}
						</option>
					))}
				</Select>
			</FormControl>
			<FormControl>
				<FormLabel>Other Access Roles</FormLabel>
				<Stack direction="row" flexWrap="wrap">
					{accessRoles.map((role) => (
						<Checkbox
							key={role.id}
							isChecked={selectedItem?.other_access_roles?.includes(
								role.id
							)}
							onChange={(e) => {
								const isChecked =
									e.target
										.checked;
								const currentOtherRoles =
									selectedItem?.other_access_roles ||
									[];
								let newOtherRoles;

								if (isChecked) {
									newOtherRoles =
										[
											...currentOtherRoles,
											role.id,
										];
								} else {
									newOtherRoles =
										currentOtherRoles.filter(
											(
												id: string
											) =>
												id !==
												role.id
										);
								}

								handleItemChange(
									'other_access_roles',
									newOtherRoles
								);
							}}
						>
							{role.name}
						</Checkbox>
					))}
				</Stack>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Job Title</FormLabel>
				<Select
					placeholder="Select job title"
					value={selectedItem?.job_title_id || ''}
					onChange={(e) =>
						handleItemChange(
							'job_title_id',
							e.target.value
						)
					}
				>
					{jobTitles.map((title) => (
						<option
							key={title.id}
							value={title.id}
						>
							{title.title}
						</option>
					))}
				</Select>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Hire Date</FormLabel>
				<Input
					type="date"
					value={
						selectedItem?.hire_date ||
						new Date()
							.toISOString()
							.split('T')[0]
					}
					onChange={(e) =>
						handleItemChange(
							'hire_date',
							e.target.value
						)
					}
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Salary</FormLabel>
				<NumberInput
					value={selectedItem?.salary || 0}
					onChange={(valueString) =>
						handleNumberInputChange(
							'salary',
							valueString
						)
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
			<FormControl>
				<Checkbox
					isChecked={selectedItem?.is_active}
					onChange={(e) =>
						handleItemChange(
							'is_active',
							e.target.checked
						)
					}
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
					placeholder="Enter food name"
				/>
			</FormControl>

			<FormControl isRequired>
				<FormLabel>Description</FormLabel>
				<Textarea
					value={selectedItem?.description || ''}
					onChange={(e) => handleItemChange('description', e.target.value)}
					placeholder="Enter food description"
				/>
			</FormControl>

			<FormControl isRequired>
				<FormLabel>Price (ZAR)</FormLabel>
				<NumberInput
					value={selectedItem?.price || 0}
					onChange={(valueString) => handleNumberInputChange('price', valueString)}
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
					value={selectedItem?.category_id || ''}
					onChange={(e) => handleItemChange('category_id', e.target.value)}
				>
					{foodCategories.map((category: any) => (
						<option key={category.id} value={category.id}>
							{category.name}
						</option>
					))}
				</Select>
			</FormControl>

			<FormControl>
				<FormLabel>Preparation Time (minutes)</FormLabel>
				<NumberInput
					value={selectedItem?.preparation_time || 0}
					onChange={(valueString) => handleNumberInputChange('preparation_time', valueString)}
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
					isChecked={!!selectedItem?.is_available}
					onChange={(e) => handleItemChange('is_available', e.target.checked)}
				>
					Is Available
				</Checkbox>
			</FormControl>

			{/* IMAGE FIELD: shown for foods ONLY */}
			<FormControl>
				<FormLabel>Images</FormLabel>

				{/* Existing Images for foods */}
				{selectedItem?.image_urls && selectedItem.image_urls.length > 0 && (
					<Box mb={4}>
						<Text fontSize="sm" color="gray.600" mb={2}>Existing Images:</Text>
						<HStack spacing={2} flexWrap="wrap">
							{selectedItem.image_urls.map((url: string, index: number) => (
								<Box key={index} position="relative">
									<Image
										src={url}
										alt={`Existing ${index + 1}`}
										boxSize="80px"
										objectFit="cover"
										borderRadius="md"
										cursor="pointer"
										onClick={() => openImageModal(url)}
										_hover={{ opacity: 0.8, transform: 'scale(1.05)' }}
										transition="all 0.2s"
									/>
									<IconButton
										aria-label="Delete image"
										icon={<FaTrash />}
										size="xs"
										colorScheme="red"
										position="absolute"
										top="-8px"
										right="-8px"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteExistingFoodImage(index);
										}}
									/>
								</Box>
							))}
						</HStack>
					</Box>
				)}

				{/* New Images Preview for foods */}
				{imagePreviews.length > 0 && (
					<Box mb={4}>
						<Text fontSize="sm" color="gray.600" mb={2}>New Images to Upload:</Text>
						<HStack spacing={2} flexWrap="wrap">
							{imagePreviews.map((preview, index) => (
								<Box key={index} position="relative">
									<Image
										src={preview}
										alt={`Preview ${index + 1}`}
										boxSize="80px"
										objectFit="cover"
										borderRadius="md"
										cursor="pointer"
										onClick={() => openImageModal(preview)}
										_hover={{ opacity: 0.8, transform: 'scale(1.05)' }}
										transition="all 0.2s"
									/>
									<IconButton
										aria-label="Remove image"
										icon={<FaTrash />}
										size="xs"
										colorScheme="red"
										position="absolute"
										top="-8px"
										right="-8px"
										onClick={() => handleRemoveImage(index)}
									/>
								</Box>
							))}
						</HStack>
						<Button
							size="sm"
							colorScheme="red"
							variant="outline"
							mt={2}
							onClick={handleClearAllImages}
						>
							Clear All New Images
						</Button>
					</Box>
				)}

				{/* File Input - Multiple for foods */}
				<Input
					type="file"
					accept="image/jpeg,image/jpg,image/png,image/webp"
					onChange={handleImageSelect}
					ref={fileInputRef}
					multiple={true}
				/>

				{isUploading && (
					<Text color="blue.500" fontSize="sm" mt={2}>
						📤 Uploading {imageFiles.length} images...
					</Text>
				)}

				<Text fontSize="sm" color="gray.600" mt={1}>
					Supported formats: JPEG, PNG, WebP (Max 5MB each) - You can select multiple images
				</Text>
			</FormControl>

			<Box w="100%">
				<Heading size="md" mb={4}>
					Recipes Ingredients
				</Heading>
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
									onChange={(valueString) =>
										handleRecipeNumberInputChange(index, 'quantity_used', valueString)
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
									onChange={(e) => handleRecipeChange(index, 'unit_of_measure', e.target.value)}
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

					<Button leftIcon={<FaPlus />} onClick={handleAddRecipe} colorScheme="teal" variant="outline">
						Add Recipe Item
					</Button>
				</VStack>
			</Box>
		</>
	);
	const renderCategoryFormFields = () => (
		<>
			<FormControl isRequired>
				<FormLabel>Category Name</FormLabel>
				<Input
					value={selectedItem?.name || ''}
					onChange={(e) => handleItemChange('name', e.target.value)}
					placeholder="Enter category name"
				/>
			</FormControl>

			<FormControl>
				<FormLabel>Description</FormLabel>
				<Textarea
					value={selectedItem?.description || ''}
					onChange={(e) => handleItemChange('description', e.target.value)}
					placeholder="Enter category description"
				/>
			</FormControl>

			{/* Image field for categories */}
			<FormControl>
				<FormLabel>Image</FormLabel>

				{/* Existing Image Preview */}
				{selectedItem?.image_url && (
					<Box mb={4}>
						<Text fontSize="sm" color="gray.600" mb={2}>Existing Image:</Text>
						<Box position="relative" display="inline-block">
							<Image
								src={selectedItem.image_url}
								alt="Category"
								maxH="200px"
								maxW="200px"
								objectFit="cover"
								borderRadius="md"
								cursor="pointer"
								onClick={() => openImageModal(selectedItem.image_url)}
								_hover={{ opacity: 0.8, transform: 'scale(1.05)' }}
								transition="all 0.2s"
							/>
							<IconButton
								aria-label="Delete image"
								icon={<FaTrash />}
								size="xs"
								colorScheme="red"
								position="absolute"
								top="-8px"
								right="-8px"
								onClick={handleDeleteExistingCategoryImage}
							/>
						</Box>
					</Box>
				)}

				{/* New Images Preview - For categories, only show first image */}
				{imagePreviews.length > 0 && (
					<Box mb={4}>
						<Text fontSize="sm" color="gray.600" mb={2}>New Image to Upload:</Text>
						<HStack spacing={2} flexWrap="wrap">
							{imagePreviews.slice(0, 1).map((preview, index) => (
								<Box key={index} position="relative">
									<Image
										src={preview}
										alt="Preview"
										boxSize="80px"
										objectFit="cover"
										borderRadius="md"
										cursor="pointer"
										onClick={() => openImageModal(preview)}
										_hover={{ opacity: 0.8, transform: 'scale(1.05)' }}
										transition="all 0.2s"
									/>
									<IconButton
										aria-label="Remove image"
										icon={<FaTrash />}
										size="xs"
										colorScheme="red"
										position="absolute"
										top="-8px"
										right="-8px"
										onClick={() => handleRemoveImage(index)}
									/>
								</Box>
							))}
						</HStack>
						<Button
							size="sm"
							colorScheme="red"
							variant="outline"
							mt={2}
							onClick={handleClearAllImages}
						>
							Clear Image
						</Button>
					</Box>
				)}

				{/* File Input - Single for categories */}
				<Input
					type="file"
					accept="image/jpeg,image/jpg,image/png,image/webp"
					onChange={handleImageSelect}
					ref={fileInputRef}
					multiple={false}
				/>

				{/* Upload Status */}
				{isUploading && (
					<Text color="blue.500" fontSize="sm" mt={2}>
						📤 Uploading image...
					</Text>
				)}

				<Text fontSize="sm" color="gray.600" mt={1}>
					Supported formats: JPEG, PNG, WebP (Max 5MB)
				</Text>

				{/* Warning if user tries to upload multiple for category */}
				{imageFiles.length > 1 && (
					<Text color="orange.500" fontSize="sm" mt={1}>
						⚠️ Only the first image will be used for categories
					</Text>
				)}
			</FormControl>
		</>
	);

	const renderCustomerFormFields = () => (
		<>
			<FormControl isRequired>
				<FormLabel>First Name</FormLabel>
				<Input
					value={selectedItem?.first_name || ''}
					onChange={(e) =>
						handleItemChange(
							'first_name',
							e.target.value
						)
					}
					placeholder="Enter first name"
				/>
			</FormControl>
			<FormControl>
				<FormLabel>Last Name</FormLabel>
				<Input
					value={selectedItem?.last_name || ''}
					onChange={(e) =>
						handleItemChange(
							'last_name',
							e.target.value
						)
					}
					placeholder="Enter last name"
				/>
			</FormControl>
			<FormControl>
				<FormLabel>Email</FormLabel>
				<Input
					type="email"
					value={selectedItem?.email || ''}
					onChange={(e) =>
						handleItemChange(
							'email',
							e.target.value
						)
					}
					placeholder="Enter email address"
				/>
			</FormControl>
			<FormControl>
				<FormLabel>Phone Number</FormLabel>
				<Input
					value={selectedItem?.phone_number || ''}
					onChange={(e) =>
						handleItemChange(
							'phone_number',
							e.target.value
						)
					}
					placeholder="Enter phone number"
				/>
			</FormControl>
			<FormControl>
				<FormLabel>Loyalty Points</FormLabel>
				<NumberInput
					value={
						selectedItem?.loyalty_points ||
						0
					}
					onChange={(valueString) =>
						handleNumberInputChange(
							'loyalty_points',
							valueString
						)
					}
					min={0}
				>
					<NumberInputField />
					<NumberInputStepper>
						<NumberIncrementStepper />
						<NumberDecrementStepper />
					</NumberInputStepper>
				</NumberInput>
			</FormControl>
		</>
	);

	const renderTableFormFields = () => (
		<>
			<FormControl isRequired>
				<FormLabel>Table Name</FormLabel>
				<Input
					value={selectedItem?.name || ''}
					onChange={(e) =>
						handleItemChange(
							'name',
							e.target.value
						)
					}
					placeholder="Enter table name"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Capacity</FormLabel>
				<NumberInput
					value={selectedItem?.capacity || 4}
					onChange={(valueString) =>
						handleNumberInputChange(
							'capacity',
							valueString
						)
					}
					min={1}
					max={20}
				>
					<NumberInputField />
					<NumberInputStepper>
						<NumberIncrementStepper />
						<NumberDecrementStepper />
					</NumberInputStepper>
				</NumberInput>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Location</FormLabel>
				<Input
					value={selectedItem?.location || ''}
					onChange={(e) =>
						handleItemChange(
							'location',
							e.target.value
						)
					}
					placeholder="Enter table location"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Status</FormLabel>
				<Select
					value={
						selectedItem?.status ||
						'available'
					}
					onChange={(e) =>
						handleItemChange(
							'status',
							e.target.value
						)
					}
				>
					<option value="available">
						Available
					</option>
					<option value="occupied">
						Occupied
					</option>
					<option value="reserved">
						Reserved
					</option>
					<option value="maintenance">
						Maintenance
					</option>
				</Select>
			</FormControl>
		</>
	);

	const renderAccessRoleFormFields = () => (
		<>
			<FormControl isRequired>
				<FormLabel>Role Name</FormLabel>
				<Input
					value={selectedItem?.name || ''}
					onChange={(e) =>
						handleItemChange(
							'name',
							e.target.value
						)
					}
					placeholder="Enter role name"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Description</FormLabel>
				<Input
					value={selectedItem?.description || ''}
					onChange={(e) =>
						handleItemChange(
							'description',
							e.target.value
						)
					}
					placeholder="Enter role description"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Landing Page</FormLabel>
				<Input
					value={selectedItem?.landing_page || ''}
					onChange={(e) =>
						handleItemChange(
							'landing_page',
							e.target.value
						)
					}
					placeholder="Enter landing page path"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Permissions</FormLabel>
				<VStack align="start" spacing={2}>
					{[
						'read',
						'write',
						'delete',
						'manage_users',
						'manage_inventory',
						'manage_orders',
						'manage_reports',
						'admin',
					].map((permission) => (
						<Checkbox
							key={permission}
							isChecked={selectedItem?.permissions?.includes(
								permission
							)}
							onChange={(e) => {
								const currentPermissions =
									selectedItem?.permissions ||
									[];
								let newPermissions;
								if (
									e.target
										.checked
								) {
									newPermissions =
										[
											...currentPermissions,
											permission,
										];
								} else {
									newPermissions =
										currentPermissions.filter(
											(
												p: string
											) =>
												p !==
												permission
										);
								}
								handleItemChange(
									'permissions',
									newPermissions
								);
							}}
						>
							{permission
								.replace(
									/_/g,
									' '
								)
								.replace(
									/\b\w/g,
									(l) =>
										l.toUpperCase()
								)}
						</Checkbox>
					))}
				</VStack>
			</FormControl>
		</>
	);

	const renderInventoryProductFormFields = () => (
		<>
			<FormControl isRequired>
				<FormLabel>Product Name</FormLabel>
				<Input
					value={selectedItem?.name || ''}
					onChange={(e) =>
						handleItemChange(
							'name',
							e.target.value
						)
					}
					placeholder="Enter product name"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>SKU</FormLabel>
				<Input
					value={selectedItem?.sku || ''}
					onChange={(e) =>
						handleItemChange(
							'sku',
							e.target.value
						)
					}
					placeholder="Enter SKU"
				/>
			</FormControl>
			<FormControl>
				<FormLabel>Description</FormLabel>
				<Textarea
					value={selectedItem?.description || ''}
					onChange={(e) =>
						handleItemChange(
							'description',
							e.target.value
						)
					}
					placeholder="Enter product description"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Unit of Measure</FormLabel>
				<Input
					value={
						selectedItem?.unit_of_measure ||
						''
					}
					onChange={(e) =>
						handleItemChange(
							'unit_of_measure',
							e.target.value
						)
					}
					placeholder="e.g., kg, lb, each"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Unit Cost</FormLabel>
				<NumberInput
					value={selectedItem?.unit_cost || 0}
					onChange={(valueString) =>
						handleNumberInputChange(
							'unit_cost',
							valueString
						)
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
			<FormControl isRequired>
				<FormLabel>Quantity in Stock</FormLabel>
				<NumberInput
					value={
						selectedItem?.quantity_in_stock ||
						0
					}
					onChange={(valueString) =>
						handleNumberInputChange(
							'quantity_in_stock',
							valueString
						)
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
			<FormControl isRequired>
				<FormLabel>Reorder Level</FormLabel>
				<NumberInput
					value={selectedItem?.reorder_level || 5}
					onChange={(valueString) =>
						handleNumberInputChange(
							'reorder_level',
							valueString
						)
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
		</>
	);

	const renderUserFormFields = () => (
		<>
			<FormControl isRequired>
				<FormLabel>Email</FormLabel>
				<Input
					type="email"
					value={selectedItem?.email || ''}
					onChange={(e) =>
						handleItemChange(
							'email',
							e.target.value
						)
					}
					placeholder="Enter email address"
				/>
			</FormControl>
			<FormControl isRequired>
				<FormLabel>Username</FormLabel>
				<Input
					value={selectedItem?.username || ''}
					onChange={(e) =>
						handleItemChange(
							'username',
							e.target.value
						)
					}
					placeholder="Enter username"
				/>
			</FormControl>
			{!isEditing && (
				<FormControl isRequired>
					<FormLabel>Password</FormLabel>
					<Input
						type="password"
						value={
							selectedItem?.password ||
							''
						}
						onChange={(e) =>
							handleItemChange(
								'password',
								e.target.value
							)
						}
						placeholder="Enter password"
					/>
				</FormControl>
			)}
			<FormControl>
				<FormLabel>First Name</FormLabel>
				<Input
					value={selectedItem?.first_name || ''}
					onChange={(e) =>
						handleItemChange(
							'first_name',
							e.target.value
						)
					}
					placeholder="Enter first name"
				/>
			</FormControl>
			<FormControl>
				<FormLabel>Last Name</FormLabel>
				<Input
					value={selectedItem?.last_name || ''}
					onChange={(e) =>
						handleItemChange(
							'last_name',
							e.target.value
						)
					}
					placeholder="Enter last name"
				/>
			</FormControl>
		</>
	);

	const renderGenericFormFields = () => (
		<>
			{entityConfig?.fields
				.filter(
					(field) =>
						!excludedFields.includes(
							field
						) && field !== 'id'
				)
				.map((field) => {
					const fieldValue =
						selectedItem?.[field];

					return (
						<FormControl
							key={field}
							isRequired={
								!field.includes(
									'description'
								) &&
								!field.includes(
									'notes'
								) &&
								!field.includes(
									'image_url'
								) &&
								!field.includes(
									'avatar_url'
								) &&
								field !==
								'is_active' &&
								field !==
								'is_available' &&
								field !==
								'remember_token' &&
								!field.endsWith(
									'_at'
								)
							}
						>
							<FormLabel>
								{field
									.replace(
										/_/g,
										' '
									)
									.replace(
										/\b\w/g,
										(
											c
										) =>
											c.toUpperCase()
									)}
							</FormLabel>

							{field.includes(
								'description'
							) ||
								field.includes(
									'notes'
								) ? (
								<Textarea
									value={
										fieldValue ||
										''
									}
									onChange={(
										e
									) =>
										handleItemChange(
											field,
											e
												.target
												.value
										)
									}
									placeholder={`Enter ${field.replace(
										/_/g,
										' '
									)}`}
								/>
							) : field ===
								'is_active' ||
								field ===
								'is_available' ? (
								<Checkbox
									isChecked={
										fieldValue !==
											undefined
											? fieldValue
											: true
									}
									onChange={(
										e
									) =>
										handleItemChange(
											field,
											e
												.target
												.checked
										)
									}
								>
									{field ===
										'is_active'
										? 'Is Active'
										: 'Is Available'}
								</Checkbox>
							) : (field.includes(
								'cost'
							) ||
								field.includes(
									'price'
								) ||
								field.includes(
									'amount'
								)) &&
								typeof fieldValue ===
								'number' ? (
								<NumberInput
									value={
										fieldValue
									}
									onChange={(
										valueString
									) =>
										handleNumberInputChange(
											field,
											valueString
										)
									}
									min={0}
									precision={
										2
									}
								>
									<NumberInputField />
									<NumberInputStepper>
										<NumberIncrementStepper />
										<NumberDecrementStepper />
									</NumberInputStepper>
								</NumberInput>
							) : field.includes(
								'quantity'
							) ||
								field.includes(
									'capacity'
								) ? (
								<NumberInput
									value={
										fieldValue ||
										0
									}
									onChange={(
										valueString
									) =>
										handleNumberInputChange(
											field,
											valueString
										)
									}
									min={0}
								>
									<NumberInputField />
									<NumberInputStepper>
										<NumberIncrementStepper />
										<NumberDecrementStepper />
									</NumberInputStepper>
								</NumberInput>
							) : field.includes(
								'date'
							) ? (
								<Input
									type="date"
									value={
										fieldValue ||
										new Date()
											.toISOString()
											.split(
												'T'
											)[0]
									}
									onChange={(
										e
									) =>
										handleItemChange(
											field,
											e
												.target
												.value
										)
									}
								/>
							) : field.includes(
								'email'
							) ? (
								<Input
									type="email"
									value={
										fieldValue ||
										''
									}
									onChange={(
										e
									) =>
										handleItemChange(
											field,
											e
												.target
												.value
										)
									}
									placeholder={`Enter ${field.replace(
										/_/g,
										' '
									)}`}
								/>
							) : (
								<Input
									value={
										fieldValue ||
										''
									}
									onChange={(
										e
									) =>
										handleItemChange(
											field,
											e
												.target
												.value
										)
									}
									placeholder={`Enter ${field.replace(
										/_/g,
										' '
									)}`}
								/>
							)}
						</FormControl>
					);
				})}
		</>
	);

	return (
		<Box p={8}>
			<Flex mb={6} align="center">
				<Heading as="h1" size="xl">
					{entityConfig?.label} Management
				</Heading>
				<Spacer />
				<Button
					colorScheme="green"
					leftIcon={<FaPlus />}
					onClick={handleAdd}
				>
					Add New {entityConfig?.label}
				</Button>
			</Flex>

			<DataTable columns={columns} data={data} />

			<Modal
				isOpen={isOpen}
				onClose={handleCloseModal}  // Change this from onClose to handleCloseModal
				size="xl"
				scrollBehavior="inside"
			>
				<ModalOverlay />
				<ModalContent as="form" onSubmit={handleSubmit}>
					<ModalHeader>
						{isEditing
							? `Edit ${entityName ===
								'recipes'
								? 'Food Recipe'
								: entityConfig.label
							}`
							: `Add ${entityName ===
								'recipes'
								? 'Food'
								: entityConfig.label
							}`}
					</ModalHeader>
					<ModalCloseButton />
					<ModalBody maxH="70vh" overflowY="auto">
						{currentRecipes === null ? (
							<Center><Spinner /></Center>
						) : (
							<VStack spacing={4}>
								{entityName ===
									'employees'
									? renderEmployeeFormFields()
									: entityName ===
										'foods' ||
										entityName ===
										'recipes'
										? renderFoodFormFields()
										: entityName ===
											'categories' ||
											entityName ===
											'inv_categories'
											? renderCategoryFormFields()
											: entityName ===
												'customers'
												? renderCustomerFormFields()
												: entityName ===
													'tables'
													? renderTableFormFields()
													: entityName ===
														'access_roles'
														? renderAccessRoleFormFields()
														: entityName ===
															'inventory_products'
															? renderInventoryProductFormFields()
															: entityName ===
																'users'
																? renderUserFormFields()
																: [
																	'job_titles',
																	'departments',
																	'suppliers',
																	'units',
																].includes(
																	entityName
																)
																	? renderGenericFormFields()
																	: renderGenericFormFields()}
							</VStack>
						)}
					</ModalBody>
					<ModalFooter>
						{/* Show delete button only when editing an existing item */}
						{isEditing && (
							<Button
								colorScheme="red"
								mr="auto"
								onClick={handleDeleteFromModal}
								isDisabled={isSubmitting}
								leftIcon={<FaTrash />}
							>
								Delete
							</Button>
						)}

						<Button
							colorScheme="gray"
							mr={3}
							onClick={handleCloseModal}
							isDisabled={isSubmitting}
						>
							Cancel
						</Button>

						<Button
							colorScheme="green"
							type="submit"
							isLoading={isSubmitting}
							loadingText={isEditing ? 'Saving...' : 'Adding...'}
						>
							{isEditing ? 'Save' : 'Add'}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>


			{/* Image Preview Modal - Add this near the end of your main component */}
			<Modal isOpen={isImageModalOpen} onClose={closeImageModal} size="xl">
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Image Preview</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<Center>
							<Image
								src={selectedImage || ''}
								alt="Full size preview"
								maxH="70vh"
								maxW="100%"
								objectFit="contain"
								borderRadius="md"
							/>
						</Center>
					</ModalBody>
					<ModalFooter>
						<Button colorScheme="blue" onClick={closeImageModal}>
							Close
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			{/* Dependency Warning Modal */}
			<DependencyWarningModal />
		</Box>
	);
}