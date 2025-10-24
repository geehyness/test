// src/app/pos/management/[entityName]/TenantSettings.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
	Box,
	Heading,
	Text,
	VStack,
	HStack,
	Flex,
	Button,
	useToast,
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
	FormControl,
	FormLabel,
	Input,
	Select,
	Switch,
	Slider,
	SliderTrack,
	SliderFilledTrack,
	SliderThumb,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	NumberDecrementStepper,
	Image,
	Card,
	CardBody,
	CardHeader,
	Divider,
	IconButton,
	Center,
	Spinner,
	useColorModeValue,
	SimpleGrid,
} from '@chakra-ui/react';
import {
	FaUpload,
	FaSave,
	FaUndo,
	FaPalette,
	FaFont,
	FaImage,
	FaCube,
	FaMobile,
	FaDesktop,
} from 'react-icons/fa';
import { getTenant, getTenants, updateTenantSettings, uploadToCloudinary, validateImageFile } from '@/lib/api';
import { getCurrentSessionContext } from '@/lib/api';

// Types and Interfaces
type TenantSettingsType = {
	// Banner Settings
	banner_image_url?: string;
	banner_overlay_opacity?: number;
	banner_overlay_color?: string;
	banner_text?: string;
	banner_text_color?: string;
	show_banner?: boolean;
	show_banner_text?: boolean;

	// New banner settings
	banner_height?: number;
	banner_overlay_blur?: number;

	// Logo Settings
	logo_url?: string;
	logo_size?: 'small' | 'medium' | 'large' | 'custom';
	logo_custom_width?: number;
	logo_margin?: number;

	// Enhanced logo positioning
	logo_position?: 'top-left' | 'top-center' | 'top-right' | 'above-banner' | 'side-by-side' | 'center-banner' | 'bottom-banner';
	logo_margin_top?: number;
	logo_margin_bottom?: number;
	logo_margin_left?: number;
	logo_margin_right?: number;

	// Color Scheme
	primary_color?: string;
	secondary_color?: string;
	background_color?: string;
	card_background_color?: string;
	text_color?: string;
	accent_color?: string;

	// Typography
	font_family?: string;
	heading_font_size?: string;
	body_font_size?: string;
	font_weight?: 'normal' | 'medium' | 'bold';

	// Layout & Components
	layout_option?: 'classic' | 'modern' | 'minimal' | 'custom';
	card_style?: 'flat' | 'raised' | 'border' | 'gradient';
	card_shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	card_border_width?: number;
	card_border_color?: string;
	card_border_radius?: number;
	button_style?: 'rounded' | 'square' | 'pill';

	// Features
	show_search_bar?: boolean;
	show_category_nav?: boolean;
	enable_animations?: boolean;

	// Social Links
	social_links?: {
		facebook?: string;
		instagram?: string;
		twitter?: string;
		website?: string;
	};
};

// Constants
const DEFAULT_SETTINGS: TenantSettingsType = {
	banner_image_url: '',
	banner_overlay_opacity: 0.3,
	banner_overlay_color: '#000000',
	banner_text: 'Welcome to Our Restaurant',
	banner_text_color: '#ffffff',
	show_banner: true,
	show_banner_text: true,

	logo_url: '',
	logo_size: 'medium',
	logo_custom_width: 120,
	logo_position: 'top-left',
	logo_margin: 4,
	banner_height: 300,
	banner_overlay_blur: 0,
	logo_margin_top: 4,
	logo_margin_bottom: 0,
	logo_margin_left: 4,
	logo_margin_right: 0,

	primary_color: '#38A169',
	secondary_color: '#2D3748',
	background_color: '#F7FAFC',
	card_background_color: '#FFFFFF',
	text_color: '#2D3748',
	accent_color: '#ED8936',

	font_family: 'Inter, sans-serif',
	heading_font_size: '2rem',
	body_font_size: '1rem',
	font_weight: 'normal',

	layout_option: 'modern',
	card_style: 'raised',
	card_shadow: 'md',
	card_border_width: 1,
	card_border_color: '#E2E8F0',
	card_border_radius: 12,
	button_style: 'rounded',

	show_search_bar: true,
	show_category_nav: true,
	enable_animations: true,

	social_links: {
		facebook: '',
		instagram: '',
		twitter: '',
		website: '',
	},
};

const GOOGLE_FONTS = [
	{ value: 'Inter, sans-serif', label: 'Inter (Modern)' },
	{ value: 'Roboto, sans-serif', label: 'Roboto (Clean)' },
	{ value: 'Open Sans, sans-serif', label: 'Open Sans (Friendly)' },
	{ value: 'Poppins, sans-serif', label: 'Poppins (Elegant)' },
	{ value: 'Montserrat, sans-serif', label: 'Montserrat (Bold)' },
	{ value: 'Playfair Display, serif', label: 'Playfair (Classic)' },
	{ value: 'Lora, serif', label: 'Lora (Serif)' },
	{ value: 'Nunito, sans-serif', label: 'Nunito (Round)' },
	{ value: 'Source Sans Pro, sans-serif', label: 'Source Sans (Professional)' },
	{ value: 'Merriweather, serif', label: 'Merriweather (Elegant)' },
	{ value: 'Roboto Condensed, sans-serif', label: 'Roboto Condensed' },
	{ value: 'Oswald, sans-serif', label: 'Oswald (Strong)' },
	{ value: 'Raleway, sans-serif', label: 'Raleway (Sophisticated)' },
	{ value: 'Quicksand, sans-serif', label: 'Quicksand (Light)' },
	{ value: 'Rubik, sans-serif', label: 'Rubik (Geometric)' },
];

const CARD_STYLE_PRESETS = [
	{
		id: 'modern-raised',
		label: 'Modern Raised',
		cardStyle: 'raised',
		buttonStyle: 'rounded',
		shadow: 'md',
		border: 'none'
	},
	{
		id: 'minimal-border',
		label: 'Minimal Border',
		cardStyle: 'border',
		buttonStyle: 'square',
		shadow: 'none',
		border: '1px solid'
	},
	{
		id: 'flat-rounded',
		label: 'Flat Rounded',
		cardStyle: 'flat',
		buttonStyle: 'pill',
		shadow: 'none',
		border: 'none'
	},
	{
		id: 'elegant-gradient',
		label: 'Elegant Gradient',
		cardStyle: 'gradient',
		buttonStyle: 'rounded',
		shadow: 'lg',
		border: 'none'
	},
];

const LOGO_POSITIONS = [
	{ value: 'top-left', label: 'Top Left' },
	{ value: 'top-center', label: 'Top Center' },
	{ value: 'top-right', label: 'Top Right' },
	{ value: 'above-banner', label: 'Above Banner' },
	{ value: 'side-by-side', label: 'Side by Side' },
	{ value: 'center-banner', label: 'Center of Banner' },
	{ value: 'bottom-banner', label: 'Bottom of Banner' },
];

export default function TenantSettings() {
	const toast = useToast();
	const [tenant, setTenant] = useState<any>(null);
	const [settings, setSettings] = useState<TenantSettingsType>(DEFAULT_SETTINGS);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
	const [activeTab, setActiveTab] = useState(0);
	const [iframeKey, setIframeKey] = useState(0);
	const [isIframeLoading, setIsIframeLoading] = useState(true);

	const loadTenantData = useCallback(async () => {
		try {
			setIsLoading(true);
			console.log('🔍 ========== STARTING TENANT DATA LOAD ==========');

			// Get session context with detailed logging
			const session = getCurrentSessionContext();
			console.log('📋 RAW SESSION CONTEXT:', session);
			console.log('🔑 Tenant ID from session:', session?.tenant_id);
			console.log('🏪 Store ID from session:', session?.store_id);
			console.log('👤 Employee ID from session:', session?.employee_id);

			// Check if we have a tenant ID
			if (!session?.tenant_id) {
				console.error('❌ CRITICAL: No tenant_id found in session context');
				console.error('📋 Full session object:', JSON.stringify(session, null, 2));

				// Let's check what's actually in sessionStorage
				if (typeof window !== 'undefined') {
					try {
						const stored = sessionStorage.getItem('pos-storage');
						console.log('💾 Raw sessionStorage data:', stored);
						if (stored) {
							const parsed = JSON.parse(stored);
							console.log('📊 Parsed sessionStorage:', parsed);
							console.log('👤 Current staff in storage:', parsed.state?.currentStaff);
						}
					} catch (storageError) {
						console.error('❌ Error reading sessionStorage:', storageError);
					}
				}

				toast({
					title: 'Configuration Error',
					description: 'No tenant information found. Please log in again.',
					status: 'error',
					duration: 5000,
					isClosable: true,
				});
				return;
			}

			console.log('🌐 Attempting to fetch tenant with ID:', session.tenant_id);

			// Try to fetch the tenant
			const tenantData = await getTenant(session.tenant_id);
			console.log('📥 SUCCESS - Tenant API response:', tenantData);

			if (tenantData && tenantData.id) {
				console.log('✅ Tenant loaded successfully:', tenantData.name);
				setTenant(tenantData);

				// Merge settings
				const mergedSettings = {
					...DEFAULT_SETTINGS,
					...(tenantData.customer_page_settings || {})
				};

				console.log('⚙️ Final merged settings:', mergedSettings);
				setSettings(mergedSettings);
			} else {
				console.error('❌ Tenant data is empty or invalid');
				throw new Error('Invalid tenant data received from server');
			}

		} catch (error: any) {
			console.error('💥 ========== CRITICAL ERROR LOADING TENANT ==========');
			console.error('❌ Error name:', error.name);
			console.error('❌ Error message:', error.message);
			console.error('❌ Error stack:', error.stack);
			console.error('❌ Full error object:', error);

			// Specific error handling
			if (error.message?.includes('not found') || error.message?.includes('404')) {
				console.error('🔍 SPECIFIC: Tenant not found in database');
				toast({
					title: 'Tenant Not Found',
					description: `Tenant ID "${getCurrentSessionContext()?.tenant_id}" not found in database. Please contact administrator.`,
					status: 'error',
					duration: 8000,
					isClosable: true,
				});
			} else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
				console.error('🔍 SPECIFIC: Network error');
				toast({
					title: 'Network Error',
					description: 'Cannot connect to server. Please check your connection.',
					status: 'error',
					duration: 5000,
					isClosable: true,
				});
			} else {
				console.error('🔍 SPECIFIC: Unknown error');
				toast({
					title: 'Load Failed',
					description: `Failed to load tenant: ${error.message}`,
					status: 'error',
					duration: 5000,
					isClosable: true,
				});
			}
		} finally {
			console.log('🏁 ========== TENANT LOADING COMPLETED ==========');
			setIsLoading(false);
		}
	}, [toast]);



	useEffect(() => {
		loadTenantData();
	}, [loadTenantData]);

	// Listen for messages from the iframe
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data.type === 'REQUEST_TENANT_SETTINGS') {
				// Send settings to the iframe
				const iframe = document.querySelector('iframe');
				if (iframe && iframe.contentWindow) {
					iframe.contentWindow.postMessage({
						type: 'TENANT_SETTINGS_UPDATE',
						settings: settings
					}, '*');
				}
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [settings]);

	useEffect(() => {
		const iframe = document.querySelector('iframe');
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.postMessage({
				type: 'TENANT_SETTINGS_UPDATE',
				settings: settings
			}, '*');
		}
	}, [settings]);

	const handleSettingChange = (key: keyof TenantSettingsType, value: any) => {
		setSettings(prev => ({
			...prev,
			[key]: value,
		}));
	};

	const handleNestedSettingChange = (parent: keyof TenantSettingsType, key: string, value: any) => {
		setSettings(prev => ({
			...prev,
			[parent]: {
				...(prev[parent] as any) || {},
				[key]: value,
			},
		}));
	};

	const handleImageUpload = async (field: 'banner_image_url' | 'logo_url', file: File) => {
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

		try {
			const imageUrl = await uploadToCloudinary(file);
			handleSettingChange(field, imageUrl);
			toast({
				title: 'Image Uploaded',
				description: 'Image successfully uploaded',
				status: 'success',
				duration: 3000,
				isClosable: true,
			});
		} catch (error: any) {
			toast({
				title: 'Upload Failed',
				description: error.message,
				status: 'error',
				duration: 5000,
				isClosable: true,
			});
		}
	};

	const handleSave = async () => {
		console.log('🎯 ========== SAVE BUTTON CLICKED ==========');
		console.log('🕒 Timestamp:', new Date().toISOString());
		console.log('📝 Current tenant:', tenant);
		console.log('🔑 Tenant ID:', tenant?.id);

		// Check if we have a tenant ID (even if it's a fallback)
		if (!tenant?.id) {
			console.log('❌ No tenant ID available');
			toast({
				title: 'Cannot Save',
				description: 'No tenant data available. Please refresh the page.',
				status: 'error',
				duration: 5000,
				isClosable: true,
			});
			return;
		}

		try {
			console.log('🔄 ========== SAVE PROCESS STARTED ==========');
			console.log('📤 Preparing to save settings for tenant:', tenant.id);
			setIsSaving(true);

			// Log the exact payload being sent
			const savePayload = {
				customer_page_settings: settings
			};
			console.log('📦 Save payload:', JSON.stringify(savePayload, null, 2));

			console.log('🌐 Making API call to updateTenantSettings...');
			const startTime = Date.now();

			// Try to save the settings
			const response = await updateTenantSettings(tenant.id, settings);

			const endTime = Date.now();

			console.log('✅ ========== SAVE SUCCESSFUL ==========');
			console.log('⏱️ API call duration:', `${endTime - startTime}ms`);
			console.log('📨 API Response:', response);

			toast({
				title: 'Settings Saved',
				description: 'Customer page settings updated successfully',
				status: 'success',
				duration: 3000,
				isClosable: true,
			});

			// Refresh the iframe to show saved changes
			console.log('🔄 Refreshing iframe preview...');
			setIframeKey(prev => prev + 1);
			setIsIframeLoading(true);

			console.log('🎉 ========== SAVE PROCESS COMPLETED ==========');

		} catch (error: any) {
			console.error('💥 ========== SAVE FAILED ==========');
			console.error('❌ Error details:', error);
			console.error('📝 Error message:', error.message);

			// More specific error handling
			if (error.message?.includes('not found') || error.message?.includes('404')) {
				toast({
					title: 'Tenant Not Found',
					description: 'The tenant does not exist in the database. Using local settings.',
					status: 'warning',
					duration: 5000,
					isClosable: true,
				});
			} else {
				toast({
					title: 'Save Failed',
					description: error.message || 'Failed to save settings',
					status: 'error',
					duration: 5000,
					isClosable: true,
				});
			}
		} finally {
			console.log('🏁 ========== SAVE PROCESS FINISHED ==========');
			setIsSaving(false);
		}
	};

	const handleReset = () => {
		setSettings(DEFAULT_SETTINGS);
		toast({
			title: 'Settings Reset',
			description: 'All settings reset to default values',
			status: 'info',
			duration: 3000,
			isClosable: true,
		});
	};

	const applyCardStylePreset = (preset: any) => {
		setSettings(prev => ({
			...prev,
			card_style: preset.cardStyle,
			button_style: preset.buttonStyle,
			card_shadow: preset.shadow,
			card_border_width: preset.border === '1px solid' ? 1 : 0,
		}));
	};

	if (isLoading) {
		return (
			<Center minH="400px">
				<Spinner size="xl" />
			</Center>
		);
	}

	return (
		<Box
			p={0}
			position="relative"
			minH="100vh"
			bg="gray.50"
		>
			{/* Settings Panel - Fixed on left */}
			<Box
				position="fixed"
				left={{ base: 0, md: "280px" }}
				top={0}
				bottom={0}
				width="400px"
				bg="white"
				shadow="lg"
				zIndex={10}
				overflowY="auto"
			>
				<Card height="100%" borderRadius="none" shadow="none">
					<CardHeader pb={3} borderBottom="1px solid" borderColor="gray.200">
						<Flex justify="space-between" align="center">
							<Heading size="md">Design Settings</Heading>
						</Flex>
					</CardHeader>
					<CardBody>
						<Tabs variant="enclosed" onChange={setActiveTab}>
							<TabList>
								<Tab><FaImage /> Brand</Tab>
								<Tab><FaPalette /> Colors</Tab>
								<Tab><FaFont /> Fonts</Tab>
								<Tab><FaCube /> Cards</Tab>
							</TabList>

							<TabPanels>
								{/* Brand Settings Tab */}
								<TabPanel>
									<VStack spacing={4} align="stretch">
										<FormControl>
											<FormLabel>Logo</FormLabel>
											<VStack align="start" spacing={3}>
												{settings.logo_url && (
													<Image
														src={settings.logo_url}
														alt="Logo preview"
														maxH="80px"
														borderRadius="md"
													/>
												)}
												<Input
													type="file"
													accept="image/*"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) handleImageUpload('logo_url', file);
													}}
													size="sm"
												/>
												<HStack w="full">
													<FormControl>
														<FormLabel fontSize="sm">Size</FormLabel>
														<Select
															value={settings.logo_size || 'medium'}
															onChange={(e) => handleSettingChange('logo_size', e.target.value)}
															size="sm"
														>
															<option value="small">Small</option>
															<option value="medium">Medium</option>
															<option value="large">Large</option>
															<option value="custom">Custom</option>
														</Select>
													</FormControl>
													{settings.logo_size === 'custom' && (
														<FormControl>
															<FormLabel fontSize="sm">Width (px)</FormLabel>
															<NumberInput
																value={settings.logo_custom_width || 120}
																onChange={(value) => handleSettingChange('logo_custom_width', parseInt(value))}
																min={50}
																max={300}
																size="sm"
															>
																<NumberInputField />
															</NumberInput>
														</FormControl>
													)}
												</HStack>
											</VStack>
										</FormControl>

										{/* Logo Position & Margins */}
										<FormControl>
											<FormLabel>Logo Position & Margins</FormLabel>
											<VStack align="start" spacing={3}>
												<Select
													value={settings.logo_position || 'top-left'}
													onChange={(e) => handleSettingChange('logo_position', e.target.value)}
													size="sm"
												>
													{LOGO_POSITIONS.map(position => (
														<option key={position.value} value={position.value}>
															{position.label}
														</option>
													))}
												</Select>

												<SimpleGrid columns={2} spacing={3} width="full">
													<FormControl>
														<FormLabel fontSize="sm">Top Margin</FormLabel>
														<NumberInput
															value={settings.logo_margin_top || 4}
															onChange={(value) => handleSettingChange('logo_margin_top', parseInt(value) || 0)}
															min={0}
															max={100}
															size="sm"
														>
															<NumberInputField />
															<NumberInputStepper>
																<NumberIncrementStepper />
																<NumberDecrementStepper />
															</NumberInputStepper>
														</NumberInput>
													</FormControl>

													<FormControl>
														<FormLabel fontSize="sm">Bottom Margin</FormLabel>
														<NumberInput
															value={settings.logo_margin_bottom || 0}
															onChange={(value) => handleSettingChange('logo_margin_bottom', parseInt(value) || 0)}
															min={0}
															max={100}
															size="sm"
														>
															<NumberInputField />
															<NumberInputStepper>
																<NumberIncrementStepper />
																<NumberDecrementStepper />
															</NumberInputStepper>
														</NumberInput>
													</FormControl>

													<FormControl>
														<FormLabel fontSize="sm">Left Margin</FormLabel>
														<NumberInput
															value={settings.logo_margin_left || 4}
															onChange={(value) => handleSettingChange('logo_margin_left', parseInt(value) || 0)}
															min={0}
															max={100}
															size="sm"
														>
															<NumberInputField />
															<NumberInputStepper>
																<NumberIncrementStepper />
																<NumberDecrementStepper />
															</NumberInputStepper>
														</NumberInput>
													</FormControl>

													<FormControl>
														<FormLabel fontSize="sm">Right Margin</FormLabel>
														<NumberInput
															value={settings.logo_margin_right || 0}
															onChange={(value) => handleSettingChange('logo_margin_right', parseInt(value) || 0)}
															min={0}
															max={100}
															size="sm"
														>
															<NumberInputField />
															<NumberInputStepper>
																<NumberIncrementStepper />
																<NumberDecrementStepper />
															</NumberInputStepper>
														</NumberInput>
													</FormControl>
												</SimpleGrid>
											</VStack>
										</FormControl>

										<FormControl>
											<FormLabel>Banner</FormLabel>
											<VStack align="start" spacing={3}>
												<HStack w="full">
													<FormControl>
														<FormLabel fontSize="sm">Show Banner</FormLabel>
														<Switch
															isChecked={settings.show_banner}
															onChange={(e) => handleSettingChange('show_banner', e.target.checked)}
															size="sm"
														/>
													</FormControl>
													<FormControl>
														<FormLabel fontSize="sm">Show Text</FormLabel>
														<Switch
															isChecked={settings.show_banner_text}
															onChange={(e) => handleSettingChange('show_banner_text', e.target.checked)}
															size="sm"
														/>
													</FormControl>
												</HStack>
												{settings.show_banner && (
													<>
														<FormControl>
															<FormLabel fontSize="sm">Banner Image</FormLabel>
															<VStack align="start" spacing={2}>
																{settings.banner_image_url && (
																	<Image
																		src={settings.banner_image_url}
																		alt="Banner preview"
																		maxH="60px"
																		borderRadius="md"
																	/>
																)}
																<Input
																	type="file"
																	accept="image/*"
																	onChange={(e) => {
																		const file = e.target.files?.[0];
																		if (file) handleImageUpload('banner_image_url', file);
																	}}
																	size="sm"
																/>
															</VStack>
														</FormControl>

														{/* Banner Height Control */}
														<FormControl>
															<FormLabel fontSize="sm">Banner Height</FormLabel>
															<NumberInput
																value={settings.banner_height || 300}
																onChange={(value) => handleSettingChange('banner_height', parseInt(value) || 300)}
																min={100}
																max={600}
																size="sm"
															>
																<NumberInputField />
																<NumberInputStepper>
																	<NumberIncrementStepper />
																	<NumberDecrementStepper />
																</NumberInputStepper>
															</NumberInput>
															<Text fontSize="xs" color="gray.600">px</Text>
														</FormControl>

														{settings.show_banner_text && (
															<FormControl>
																<FormLabel fontSize="sm">Banner Text</FormLabel>
																<Input
																	value={settings.banner_text || ''}
																	onChange={(e) => handleSettingChange('banner_text', e.target.value)}
																	placeholder="Welcome to Our Restaurant"
																	size="sm"
																/>
															</FormControl>
														)}

														{/* Overlay Settings */}
														<FormControl>
															<FormLabel fontSize="sm">Overlay Color</FormLabel>
															<HStack>
																<Input
																	type="color"
																	value={settings.banner_overlay_color || '#000000'}
																	onChange={(e) => handleSettingChange('banner_overlay_color', e.target.value)}
																	w="60px"
																	h="32px"
																	p={1}
																/>
																<Text fontSize="xs">{settings.banner_overlay_color}</Text>
															</HStack>
														</FormControl>

														<FormControl>
															<FormLabel fontSize="sm">Overlay Opacity</FormLabel>
															<Slider
																value={settings.banner_overlay_opacity || 0.3}
																onChange={(value) => handleSettingChange('banner_overlay_opacity', value)}
																min={0}
																max={1}
																step={0.1}
																size="sm"
															>
																<SliderTrack>
																	<SliderFilledTrack />
																</SliderTrack>
																<SliderThumb />
															</Slider>
															<Text fontSize="xs" color="gray.600">
																{Math.round((settings.banner_overlay_opacity || 0.3) * 100)}%
															</Text>
														</FormControl>

														{/* Overlay Blur Control */}
														<FormControl>
															<FormLabel fontSize="sm">Overlay Blur</FormLabel>
															<Slider
																value={settings.banner_overlay_blur || 0}
																onChange={(value) => handleSettingChange('banner_overlay_blur', value)}
																min={0}
																max={20}
																step={1}
																size="sm"
															>
																<SliderTrack>
																	<SliderFilledTrack />
																</SliderTrack>
																<SliderThumb />
															</Slider>
															<Text fontSize="xs" color="gray.600">
																{settings.banner_overlay_blur || 0}px
															</Text>
														</FormControl>
													</>
												)}
											</VStack>
										</FormControl>

										{/* Debug Button - Remove in production */}
										<Button
											onClick={() => {
												console.log('Current Settings:', settings);
												console.log('Tenant ID:', tenant?.id);
											}}
											variant="outline"
											size="sm"
											colorScheme="gray"
										>
											Debug Settings
										</Button>
									</VStack>
								</TabPanel>

								{/* Color Settings Tab */}
								<TabPanel>
									<VStack spacing={4} align="stretch">
										<SimpleGrid columns={2} spacing={3}>
											<FormControl>
												<FormLabel fontSize="sm">Primary</FormLabel>
												<HStack>
													<Input
														type="color"
														value={settings.primary_color || '#38A169'}
														onChange={(e) => handleSettingChange('primary_color', e.target.value)}
														w="60px"
														h="32px"
														p={1}
													/>
													<Text fontSize="xs">{settings.primary_color}</Text>
												</HStack>
											</FormControl>
											<FormControl>
												<FormLabel fontSize="sm">Secondary</FormLabel>
												<HStack>
													<Input
														type="color"
														value={settings.secondary_color || '#2D3748'}
														onChange={(e) => handleSettingChange('secondary_color', e.target.value)}
														w="60px"
														h="32px"
														p={1}
													/>
													<Text fontSize="xs">{settings.secondary_color}</Text>
												</HStack>
											</FormControl>
											<FormControl>
												<FormLabel fontSize="sm">Background</FormLabel>
												<HStack>
													<Input
														type="color"
														value={settings.background_color || '#F7FAFC'}
														onChange={(e) => handleSettingChange('background_color', e.target.value)}
														w="60px"
														h="32px"
														p={1}
													/>
													<Text fontSize="xs">{settings.background_color}</Text>
												</HStack>
											</FormControl>
											<FormControl>
												<FormLabel fontSize="sm">Card BG</FormLabel>
												<HStack>
													<Input
														type="color"
														value={settings.card_background_color || '#FFFFFF'}
														onChange={(e) => handleSettingChange('card_background_color', e.target.value)}
														w="60px"
														h="32px"
														p={1}
													/>
													<Text fontSize="xs">{settings.card_background_color}</Text>
												</HStack>
											</FormControl>
											<FormControl>
												<FormLabel fontSize="sm">Text</FormLabel>
												<HStack>
													<Input
														type="color"
														value={settings.text_color || '#2D3748'}
														onChange={(e) => handleSettingChange('text_color', e.target.value)}
														w="60px"
														h="32px"
														p={1}
													/>
													<Text fontSize="xs">{settings.text_color}</Text>
												</HStack>
											</FormControl>
											<FormControl>
												<FormLabel fontSize="sm">Accent</FormLabel>
												<HStack>
													<Input
														type="color"
														value={settings.accent_color || '#ED8936'}
														onChange={(e) => handleSettingChange('accent_color', e.target.value)}
														w="60px"
														h="32px"
														p={1}
													/>
													<Text fontSize="xs">{settings.accent_color}</Text>
												</HStack>
											</FormControl>
										</SimpleGrid>
									</VStack>
								</TabPanel>

								{/* Typography Settings Tab */}
								<TabPanel>
									<VStack spacing={4} align="stretch">
										<FormControl>
											<FormLabel fontSize="sm">Font Family</FormLabel>
											<Select
												value={settings.font_family || 'Inter, sans-serif'}
												onChange={(e) => handleSettingChange('font_family', e.target.value)}
												size="sm"
											>
												{GOOGLE_FONTS.map(font => (
													<option key={font.value} value={font.value}>
														{font.label}
													</option>
												))}
											</Select>
										</FormControl>

										<FormControl>
											<FormLabel fontSize="sm">Font Weight</FormLabel>
											<Select
												value={settings.font_weight || 'normal'}
												onChange={(e) => handleSettingChange('font_weight', e.target.value)}
												size="sm"
											>
												<option value="normal">Normal</option>
												<option value="medium">Medium</option>
												<option value="bold">Bold</option>
											</Select>
										</FormControl>

										<HStack>
											<FormControl>
												<FormLabel fontSize="sm">Heading Size</FormLabel>
												<Select
													value={settings.heading_font_size || '2rem'}
													onChange={(e) => handleSettingChange('heading_font_size', e.target.value)}
													size="sm"
												>
													<option value="1.5rem">Small</option>
													<option value="2rem">Medium</option>
													<option value="2.5rem">Large</option>
													<option value="3rem">X-Large</option>
												</Select>
											</FormControl>
											<FormControl>
												<FormLabel fontSize="sm">Body Size</FormLabel>
												<Select
													value={settings.body_font_size || '1rem'}
													onChange={(e) => handleSettingChange('body_font_size', e.target.value)}
													size="sm"
												>
													<option value="0.875rem">Small</option>
													<option value="1rem">Medium</option>
													<option value="1.125rem">Large</option>
												</Select>
											</FormControl>
										</HStack>
									</VStack>
								</TabPanel>

								{/* Card Settings Tab */}
								<TabPanel>
									<VStack spacing={4} align="stretch">
										<FormControl>
											<FormLabel fontSize="sm">Style Presets</FormLabel>
											<SimpleGrid columns={2} spacing={2}>
												{CARD_STYLE_PRESETS.map(preset => (
													<Button
														key={preset.id}
														size="sm"
														variant="outline"
														onClick={() => applyCardStylePreset(preset)}
														fontSize="xs"
														height="auto"
														py={2}
														whiteSpace="normal"
													>
														{preset.label}
													</Button>
												))}
											</SimpleGrid>
										</FormControl>

										<FormControl>
											<FormLabel fontSize="sm">Card Style</FormLabel>
											<Select
												value={settings.card_style || 'raised'}
												onChange={(e) => handleSettingChange('card_style', e.target.value)}
												size="sm"
											>
												<option value="flat">Flat</option>
												<option value="raised">Raised</option>
												<option value="border">Bordered</option>
												<option value="gradient">Gradient</option>
											</Select>
										</FormControl>

										<HStack>
											<FormControl>
												<FormLabel fontSize="sm">Shadow</FormLabel>
												<Select
													value={settings.card_shadow || 'md'}
													onChange={(e) => handleSettingChange('card_shadow', e.target.value)}
													size="sm"
												>
													<option value="none">None</option>
													<option value="sm">Small</option>
													<option value="md">Medium</option>
													<option value="lg">Large</option>
													<option value="xl">X-Large</option>
												</Select>
											</FormControl>
											<FormControl>
												<FormLabel fontSize="sm">Border Radius</FormLabel>
												<NumberInput
													value={settings.card_border_radius || 12}
													onChange={(value) => handleSettingChange('card_border_radius', parseInt(value))}
													min={0}
													max={24}
													size="sm"
												>
													<NumberInputField />
													<NumberInputStepper>
														<NumberIncrementStepper />
														<NumberDecrementStepper />
													</NumberInputStepper>
												</NumberInput>
											</FormControl>
										</HStack>

										<FormControl>
											<FormLabel fontSize="sm">Button Style</FormLabel>
											<Select
												value={settings.button_style || 'rounded'}
												onChange={(e) => handleSettingChange('button_style', e.target.value)}
												size="sm"
											>
												<option value="rounded">Rounded</option>
												<option value="square">Square</option>
												<option value="pill">Pill</option>
											</Select>
										</FormControl>
									</VStack>
								</TabPanel>
							</TabPanels>
						</Tabs>

						<Divider my={4} />

						{/* Debug Section */}
						<VStack spacing={3} align="stretch" mt={4}>
							<Button
								onClick={async () => {
									console.log('🔍 Current Settings:', settings);
									console.log('🔍 Tenant ID:', tenant?.id);
									console.log('🔍 Full Tenant:', tenant);

									// Test the save payload
									const testPayload = {
										customer_page_settings: settings
									};
									console.log('🔍 Save Payload:', testPayload);

									// Test API call directly
									try {
										const testResponse = await updateTenantSettings(tenant?.id, settings);
										console.log('🔍 Test API Response:', testResponse);
									} catch (error) {
										console.error('🔍 Test API Error:', error);
									}
								}}
								variant="outline"
								size="sm"
								colorScheme="gray"
							>
								Debug Settings & Test Save
							</Button>

							<Button
								onClick={async () => {
									// Test loading current settings
									try {
										const currentTenant = await getTenant(tenant?.id);
										console.log('🔍 Current Tenant from API:', currentTenant);
										console.log('🔍 Current Settings from API:', currentTenant?.customer_page_settings);
									} catch (error) {
										console.error('🔍 Load Test Error:', error);
									}
								}}
								variant="outline"
								size="sm"
								colorScheme="blue"
							>
								Test Load Current Settings
							</Button>
						</VStack>

						<VStack spacing={3} align="stretch">
							<Button
								leftIcon={<FaUndo />}
								onClick={handleReset}
								variant="outline"
								size="sm"
							>
								Reset to Defaults
							</Button>
							<Button
								leftIcon={<FaSave />}
								onClick={handleSave}
								colorScheme="green"
								size="sm"
								isLoading={isSaving}
								loadingText="Saving..."
							>
								Save Changes
							</Button>
						</VStack>
					</CardBody>
				</Card>
			</Box>

			{/* Main Preview Area */}
			<Box
				ml={{ base: 0, md: "96" }}
				minH="100vh"
				bg="gray.50"
				display="flex"
				flexDirection="column"
			>
				{/* Preview Controls */}
				<Box p={4} bg="white" borderBottom="1px solid" borderColor="gray.200">
					<Flex justify="space-between" align="center">
						<Heading size="md">Live Preview</Heading>
						<HStack>
							<IconButton
								icon={<FaMobile />}
								aria-label="Mobile preview"
								variant={previewMode === 'mobile' ? 'solid' : 'outline'}
								onClick={() => setPreviewMode('mobile')}
								size="sm"
							/>
							<IconButton
								icon={<FaDesktop />}
								aria-label="Desktop preview"
								variant={previewMode === 'desktop' ? 'solid' : 'outline'}
								onClick={() => setPreviewMode('desktop')}
								size="sm"
							/>
						</HStack>
					</Flex>
				</Box>

				{/* Preview Content */}
				<Box flex="1" p={4} display="flex" alignItems="center" justifyContent="center">
					{/* Device Frame - Fixed 16:9 Container */}
					<Box
						position="relative"
						bg="white"
						width={previewMode === 'mobile' ? "90%" : "80%"}
						maxWidth={previewMode === 'mobile' ? "375px" : "1200px"}
						height="0"
						paddingBottom={previewMode === 'mobile' ? "56.25%" : "56.25%"}
						{...previewMode === 'mobile' ? {
							borderRadius: "24px",
							border: "12px solid #333",
							boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
						} : {
							border: "1px solid #333",
							borderRadius: "8px",
							boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
						}}
						overflow="hidden"
					>
						{/* Loading state */}
						{isIframeLoading && (
							<Center position="absolute" top={0} left={0} right={0} bottom={0} bg="white" zIndex={5}>
								<VStack>
									<Spinner size="xl" />
									<Text>Loading Preview...</Text>
								</VStack>
							</Center>
						)}

						{/* Actual Customer Page Preview - Using iframe with zoom */}
						<Box position="absolute" top={0} left={0} width="100%" height="100%">
							<iframe
								key={iframeKey}
								src={`/customer-menu?preview=true`} // Remove tenantId, use logged-in user's tenant
								width="100%"
								height="100%"
								style={{
									border: 'none',
									zoom: previewMode === 'mobile' ? '0.7' : '0.8',
								}}
								onLoad={() => setIsIframeLoading(false)}
								onError={() => setIsIframeLoading(false)}
							/>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}