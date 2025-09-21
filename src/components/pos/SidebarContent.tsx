// src/components/SidebarContent.tsx
"use client";

import {
    Box,
    CloseButton,
    Flex,
    useColorModeValue,
    Text,
    Icon,
    Link,
    VStack,
    Collapse,
} from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import {
    FiCompass,
    FiSettings,
    FiChevronDown,
    FiChevronUp,
} from "react-icons/fi";
import {
    FaUserTie,
    FaUtensils,
    FaBoxOpen,
    FaChartLine,
    FaBuilding,
    FaRegListAlt,
    FaClock,
    FaUsers,
    FaDollarSign,
    FaIdCard,
    FaBook,
    FaClipboardList,
    FaStore,
    FaCreditCard,
    FaUserFriends,
    FaCalendarAlt,
    FaListAlt,
} from "react-icons/fa";
import { IconType } from "react-icons";
import NextLink from 'next/link';
import { usePOSStore } from "@/lib/usePOSStore";

interface NavItemProps {
    icon?: IconType;
    children: React.ReactNode;
    href: string;
}

const NavItem = ({ icon, children, href, ...rest }: NavItemProps) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            as={NextLink}
            href={href}
            style={{ textDecoration: "none" }}
            _focus={{ boxShadow: "none" }}
            bg={isActive ? "var(--primary-green)" : "transparent"}
            color={isActive ? "white" : "var(--dark-gray-text)"}
            fontWeight={isActive ? "bold" : "normal"}
            {...rest}
        >
            <Flex
                align="center"
                p="4"
                mx="4"
                borderRadius="lg"
                role="group"
                cursor="pointer"
                _hover={{
                    bg: "var(--primary-green)",
                    color: "white",
                }}
            >
                {icon && (
                    <Icon
                        mr="4"
                        fontSize="16"
                        _groupHover={{
                            color: "white",
                        }}
                        as={icon}
                    />
                )}
                {children}
            </Flex>
        </Link>
    );
};

const mainLinks = [
    { name: "Dashboard", href: "/pos/dashboard", icon: FiCompass },
    { name: "Management", href: "/pos/management", icon: FaRegListAlt },
];

const managementSections = [
    {
        name: "HR Management",
        icon: FaUserTie,
        roles: ['admin', 'manager', 'hr'],
        entities: [
            { name: "Employees", path: "/pos/management/employees", icon: FaUserFriends, roles: ['admin', 'manager', 'hr'] },
            { name: "Shifts", path: "/pos/management/shifts", icon: FaClock, roles: ['admin', 'manager', 'hr'] },
            { name: "Timesheets", path: "/pos/management/timesheets", icon: FaClipboardList, roles: ['admin', 'manager', 'hr'] },
            { name: "Payroll", path: "/pos/management/payrolls", icon: FaDollarSign, roles: ['admin', 'manager'] },
        ],
    },
    {
        name: "Company",
        icon: FaBuilding,
        roles: ['admin'],
        entities: [{ name: "Company Info", path: "/pos/management/companies", icon: FaBuilding, roles: ['admin'] }],
    },
    {
        name: "Menu Management",
        icon: FaUtensils,
        roles: ['admin', 'manager', 'supply-chain'],
        entities: [
            { name: "Foods", path: "/pos/management/foods", icon: FaUtensils, roles: ['admin', 'manager', 'supply-chain'] },
            { name: "Categories", path: "/pos/management/categories", icon: FaListAlt, roles: ['admin', 'manager', 'supply-chain'] },
            { name: "Recipes", path: "/pos/management/recipes", icon: FaBook, roles: ['admin', 'manager', 'supply-chain'] },
        ],
    },
    {
        name: "Supply Chain",
        icon: FaBoxOpen,
        roles: ['admin', 'manager', 'supply-chain'],
        entities: [
            { name: "Inventory Products", path: "/pos/management/inventory_products", icon: FaBoxOpen, roles: ['admin', 'manager', 'supply-chain'] },
            { name: "Inventory Categories", path: "/pos/management/inv_categories", icon: FaListAlt, roles: ['admin', 'manager', 'supply-chain'] },
            { name: "Suppliers", path: "/pos/management/suppliers", icon: FaUserTie, roles: ['admin', 'manager', 'supply-chain'] },
            { name: "Stock Adjustments", path: "/pos/management/stock_adjustments", icon: FaClipboardList, roles: ['admin', 'manager', 'supply-chain'] },
        ],
    },
    {
        name: "Customers & Tables",
        icon: FaUsers,
        roles: ['admin', 'manager'],
        entities: [
            { name: "Customers", path: "/pos/management/customers", icon: FaUserFriends, roles: ['admin', 'manager'] },
            { name: "Reservations", path: "/pos/management/reservations", icon: FaCalendarAlt, roles: ['admin', 'manager'] },
            { name: "Tables", path: "/pos/management/tables", icon: FaListAlt, roles: ['admin', 'manager'] },
        ],
    },
    {
        name: "Reports & Analytics",
        icon: FaChartLine,
        roles: ['admin', 'manager'],
        entities: [
            { name: "Access Reports", path: "/pos/admin/reports", icon: FaChartLine, roles: ['admin'] },
            { name: "Sales Reports", path: "/pos/management/reports", icon: FaChartLine, roles: ['admin', 'manager'] },
        ],
    },
    {
        name: "System Settings",
        icon: FaClock,
        roles: ['admin'],
        entities: [
            { name: "Access Roles", path: "/pos/management/access_roles", icon: FaIdCard, roles: ['admin'] },
            { name: "Payment Methods", path: "/pos/management/payment_methods", icon: FaCreditCard, roles: ['admin'] },
            { name: "Stores", path: "/pos/management/stores", icon: FaStore, roles: ['admin'] },
        ],
    },
];

const SidebarContent = ({ onClose, ...rest }: any) => {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const pathname = usePathname();
    const { currentStaff } = usePOSStore();

    // Get user role, defaulting to an empty string if not available
    const userRole = useMemo(() => {
        return currentStaff?.mainAccessRole?.name?.toLowerCase() || '';
    }, [currentStaff]);

    // Memoize filtered sections to prevent re-filtering on every render
    const filteredSections = useMemo(() => {
        return managementSections.filter(section =>
            section.roles.includes(userRole) ||
            section.entities.some(entity => entity.roles.includes(userRole))
        );
    }, [userRole]);

    // Initialize open sections based on the current pathname and user role
    useMemo(() => {
        const initialOpenState: Record<string, boolean> = {};
        filteredSections.forEach((section) => {
            const isSectionActive = section.entities.some((entity) =>
                pathname.startsWith(entity.path) && entity.roles.includes(userRole)
            );
            initialOpenState[section.name] = isSectionActive;
        });
        setOpenSections(initialOpenState);
    }, [pathname, filteredSections, userRole]);

    const toggleSection = (sectionName: string) => {
        setOpenSections((prev) => ({
            ...prev,
            [sectionName]: !prev[sectionName],
        }));
    };

    return (
        <Box
            transition="3s ease"
            bg={"white"}
            borderRight="1px"
            borderRightColor={useColorModeValue("gray.200", "gray.200")}
            w={{ base: "full", md: 200 }}
            pos="fixed"
            h="full"
            overflowY="auto"
            {...rest}
        >
            {/* Fixed Header */}
            <Box position="sticky" top={0} bg={"white"} zIndex={10} borderBottom="1px" borderBottomColor={useColorModeValue("gray.200", "gray.200")}>
                <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
                    <Text
                        fontSize="2xl"
                        fontFamily="monospace"
                        fontWeight="bold"
                        color="var(--primary-green)"
                    >
                        Resto Admin
                    </Text>
                    <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
                </Flex>

                {/* User Info */}
                {currentStaff && (
                    <Box px="4" py="2" mb="4">
                        <Text fontSize="sm" fontWeight="bold" color="gray.600">
                            {currentStaff.first_name} {currentStaff.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            {currentStaff.mainAccessRole?.name}
                        </Text>
                    </Box>
                )}
            </Box>

            {/* Scrollable Content */}
            <Box overflowY="auto" pb={20}>
                {/* Main Links */}
                <VStack align="stretch" spacing={1} mt={4}>
                    <Text
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                        color="gray.500"
                        px={4}
                        mt={2}
                        mb={1}
                    >
                        Point of Sale
                    </Text>
                    {mainLinks.map((link) => (
                        <NavItem key={link.name} icon={link.icon} href={link.href}>
                            {link.name}
                        </NavItem>
                    ))}
                </VStack>

                {/* Management Links - Filtered by role */}
                <VStack align="stretch" spacing={1} mt={4}>
                    {filteredSections.map((section) => (
                        <Box key={section.name}>
                            <Flex
                                align="center"
                                p="4"
                                mx="4"
                                borderRadius="lg"
                                role="group"
                                cursor="pointer"
                                _hover={{
                                    bg: "gray.100",
                                }}
                                onClick={() => toggleSection(section.name)}
                            >
                                <Icon as={section.icon} mr={2} color="gray.500" />
                                <Text
                                    fontSize="xs"
                                    fontWeight="bold"
                                    textTransform="uppercase"
                                    color="gray.500"
                                    flex="1"
                                >
                                    {section.name}
                                </Text>
                                <Icon
                                    as={openSections[section.name] ? FiChevronUp : FiChevronDown}
                                    fontSize="16"
                                    color="gray.500"
                                />
                            </Flex>
                            <Collapse in={openSections[section.name]} animateOpacity>
                                <VStack align="stretch" spacing={1} pl={8} mt={2}>
                                    {section.entities
                                        .filter(entity => entity.roles.includes(userRole))
                                        .map((entity) => (
                                            <NavItem
                                                key={entity.name}
                                                href={entity.path}
                                                icon={entity.icon || FiSettings}
                                            >
                                                <Text fontSize={"s"}>
                                                    {entity.name}
                                                </Text>
                                            </NavItem>
                                        ))}
                                </VStack>
                            </Collapse>
                        </Box>
                    ))}
                </VStack>
            </Box>

            {/* Fixed Footer */}
            <Box position="sticky" bottom={0} bg={"white"} zIndex={10} borderTop="1px" borderTopColor={useColorModeValue("gray.200", "gray.200")} p={4} pb={12}>
                <Text fontSize="xs" color="gray.500" textAlign="center">
                    © {new Date().getFullYear()} Resto Admin
                </Text>
            </Box>
        </Box>
    );
};

export default SidebarContent;