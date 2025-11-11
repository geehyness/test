// src/components/pos/POSHeader.tsx - ENHANCED VERSION
"use client";

import {
  Avatar,
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useColorModeValue,
  Image as ChakraImage,
  Skeleton,
  Badge,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { FiChevronDown, FiMenu, FiLogOut, FiUser, FiSettings } from "react-icons/fi";
import { usePOSStore } from "../../lib/usePOSStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface POSHeaderProps {
  onOpen: () => void;
  sidebarOpen?: boolean;
  [key: string]: any;
}

export const POSHeader = ({ onOpen, sidebarOpen, ...rest }: POSHeaderProps) => {
  const { currentStaff, logoutStaff, _hasHydrated, currentTimesheetId } = usePOSStore();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle logout with confirmation and loading state
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Show confirmation for active sessions
      if (currentTimesheetId) {
        // You could add a confirmation dialog here for active timesheets
        console.warn("User is logging out with active timesheet:", currentTimesheetId);
      }

      await logoutStaff();

      toast({
        title: "Logged out successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      router.push("/pos/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an issue logging out. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfile = () => {
    // Navigate to user profile or settings
    router.push("/pos/management/employees");
  };

  const handleSettings = () => {
    // Navigate to settings page
    router.push("/pos/management/tenant_settings");
  };

  // Display store name with loading state
  const displayStoreName = () => {
    if (!_hasHydrated) {
      return (
        <Skeleton height="20px" width="120px" borderRadius="md" />
      );
    }
    return currentStaff?.storeName ?? "Unknown Store";
  };

  // Display user name with loading state
  const displayUserName = () => {
    if (!_hasHydrated) {
      return (
        <Skeleton height="16px" width="100px" borderRadius="md" />
      );
    }
    return currentStaff ? `${currentStaff.first_name} ${currentStaff.last_name || ''}`.trim() : "Not Logged In";
  };

  // Display user role with loading state
  const displayUserRole = () => {
    if (!_hasHydrated) {
      return (
        <Skeleton height="14px" width="80px" borderRadius="md" mt="1" />
      );
    }
    return currentStaff?.mainAccessRole?.name || "No Role";
  };

  // Check if user is on management page
  const isManagementPage = pathname?.includes("/management");

  return (
    <Flex
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg="white"
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent="space-between"
      position="sticky"
      top={0}
      zIndex={1000}
      backdropFilter="blur(10px)"
      {...rest}
    >
      {/* Left Section - Menu & Logo */}
      <HStack spacing={4} flex="1">
        {/* Menu Button - Only show when sidebar is closed on desktop, always on mobile */}
        <IconButton
          display={{
            base: "flex",
            md: sidebarOpen ? "none" : "flex"
          }}
          onClick={onOpen}
          variant="ghost"
          aria-label="open menu"
          icon={<FiMenu />}
          size="sm"
        />

        {/* Logo and Store Name */}
        <HStack spacing={3}>
          <ChakraImage
            src="/c2.png"
            alt="Carte Logo"
            width="auto"
            height="20px"
            objectFit="contain"
            fallback={
              <Box
                width="80px"
                height="20px"
                bg="gray.200"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="xs" color="gray.500">LOGO</Text>
              </Box>
            }
          />

          <Box display={{ base: "none", md: "block" }}>
            <Text fontSize="xl" fontWeight="bold" color="var(--primary-green)">
              {displayStoreName()}
            </Text>
            {isManagementPage && (
              <Badge
                colorScheme="blue"
                fontSize="xs"
                mt={1}
                variant="subtle"
              >
                Management Mode
              </Badge>
            )}
          </Box>
        </HStack>
      </HStack>

      {/* Center Section - Page Title (optional) */}
      <Flex
        flex="1"
        justifyContent="center"
        display={{ base: "none", lg: "flex" }}
      >
        {/* You can add dynamic page titles here based on the current route */}
        <Text fontSize="md" color="gray.600" fontWeight="medium">
          {isManagementPage ? "Management Console" : "Point of Sale"}
        </Text>
      </Flex>

      {/* Right Section - User Menu */}
      <HStack spacing={{ base: 2, md: 4 }} justify="flex-end" flex="1">
        {/* Clock Status Badge */}
        {currentTimesheetId && (
          <Tooltip label="Currently clocked in">
            <Badge
              colorScheme="green"
              variant="solid"
              fontSize="xs"
              display={{ base: "none", sm: "flex" }}
            >
              Clocked In
            </Badge>
          </Tooltip>
        )}

        {/* User Menu */}
        <Menu>
          <MenuButton
            py={2}
            transition="all 0.3s"
            _focus={{ boxShadow: "outline" }}
            _hover={{ bg: "gray.50" }}
            borderRadius="md"
          >
            <HStack spacing={2}>
              <Avatar
                size="sm"
                src="/pic.png"
                name={currentStaff?.first_name}
                bg="blue.500"
                color="white"
              />

              <VStack
                display={{ base: "none", md: "flex" }}
                alignItems="flex-start"
                spacing="0"
                ml="1"
              >
                <Text fontSize="sm" color="gray.800" fontWeight="medium" lineHeight="1.2">
                  {displayUserName()}
                </Text>
                <Text fontSize="xs" color="gray.500" lineHeight="1.2">
                  {displayUserRole()}
                </Text>
              </VStack>

              <Box display={{ base: "none", md: "flex" }} color="gray.500">
                <FiChevronDown />
              </Box>
            </HStack>
          </MenuButton>

          <MenuList
            bg="white"
            borderColor="gray.200"
            boxShadow="lg"
            minW="200px"
            zIndex={1500}
          >
            {/* User Info Section */}
            <Box px={3} py={2} borderBottomWidth="1px" borderColor="gray.100">
              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                {displayUserName()}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {displayUserRole()}
              </Text>
              {currentStaff?.storeName && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {currentStaff.storeName}
                </Text>
              )}
            </Box>

            <MenuItem
              icon={<FiUser size={14} />}
              onClick={handleProfile}
              _focus={{ bg: "blue.50" }}
            >
              My Profile
            </MenuItem>

            <MenuItem
              icon={<FiSettings size={14} />}
              onClick={handleSettings}
              _focus={{ bg: "blue.50" }}
            >
              Settings
            </MenuItem>

            <MenuDivider />

            <MenuItem
              icon={<FiLogOut size={14} />}
              onClick={handleLogout}
              isDisabled={isLoggingOut}
              color="red.500"
              _focus={{ bg: "red.50" }}
              _hover={{ bg: "red.50" }}
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};