// src/app/layout.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import "@/app/globals.css";
import SidebarContent from "@/components/pos/SidebarContent";
import { POSHeader } from "@/components/pos/POSHeader";
import {
  ChakraProvider,
  Box,
  Flex,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  VStack,
  useMediaQuery,
  Spinner,
  Text,
  Link as ChakraLink,
} from "@chakra-ui/react";
import Link from "next/link";
import { usePOSStore } from "@/lib/usePOSStore";

interface AppNotification {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLargerThanMd] = useMediaQuery("(min-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(isLargerThanMd);
  const navbarRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { currentStaff, _hasHydrated, logAccessAttempt } = usePOSStore();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Default role pages for redirects
  const defaultRolePages: Record<string, string> = useMemo(
    () => ({
      admin: "/pos/admin",
      manager: "/pos/management",
      server: "/pos/server",
      kitchen: "/pos/kitchen",
      cashier: "/pos",
      "kiosk-user": "/pos/kiosk",
      default: "/pos",
    }),
    []
  );

  // Define pages where the sidebar should NOT be visible
  const hideSidebar =
    pathname.startsWith("/pos/login") ||
    pathname.startsWith("/pos/kitchen") ||
    pathname.startsWith("/pos/server") ||
    pathname.startsWith("/pos/kiosk") ||
    pathname === "/pos";

  // Define pages where the POSHeader should NOT be visible
  const hidePOSHeader =
    pathname.startsWith("/pos/login") || pathname.startsWith("/pos/kiosk");

  // Role-based access control
  useEffect(() => {
    if (!_hasHydrated) {
      console.log("RootLayout: Waiting for state hydration...");
      return;
    }

    // Skip auth check for kiosk page
    if (pathname.startsWith("/pos/kiosk")) {
      console.log("RootLayout: Kiosk page detected, skipping auth check");
      setIsAuthChecked(true);
      return;
    }

    const rolePaths: Record<string, string[]> = {
      admin: [
        "/pos",
        "/pos/management",
        "/pos/kitchen",
        "/pos/server",
        "/pos/admin",
        "/pos/admin/reports",
        "/pos/management/employees",
        "/pos/management/users",
        "/pos/management/access_roles",
        "/pos/management/inventory_products",
        "/pos/management/inventory",
        "/pos/management/suppliers",
        "/pos/management/foods",
        "/pos/management/categories",
        "/pos/management/tables",
        "/pos/management/reports",
        "/pos/management/shifts",
      ],
      manager: [
        "/pos/management",
        "/pos/kitchen",
        "/pos/server",
        "/pos/management/foods",
        "/pos/management/categories",
        "/pos/management/tables",
        "/pos/management/employees",
      ],
      server: ["/pos/server"],
      kitchen: ["/pos/kitchen"],
      cashier: ["/pos"],
      "kiosk-user": ["/pos/kiosk"],
      "supply-chain": [
        "/pos/management/inventory_products",
        "/pos/management/inventory",
        "/pos/management/suppliers",
        "/pos/management/foods",
      ],
      hr: [
        "/pos/management",
        "/pos/management/employees",
        "/pos/management/access_roles",
      ],
    };

    if (!currentStaff && pathname !== "/pos/login") {
      console.log("RootLayout: No staff logged in, redirecting to /pos/login.");
      router.replace("/pos/login");
      setIsAuthChecked(true);
      return;
    }

    if (currentStaff && pathname === "/pos/login") {
      console.log(
        "RootLayout: Staff logged in on /pos/login, redirecting to default page."
      );
      const roleName =
        currentStaff.mainAccessRole?.name?.toLowerCase() || "default";
      const defaultPage =
        defaultRolePages[roleName] || defaultRolePages["default"];
      router.replace(defaultPage);
      setIsAuthChecked(false);
      return;
    }

    if (currentStaff && pathname !== "/pos/login") {
      const roleName =
        currentStaff.mainAccessRole?.name?.toLowerCase() || "default";
      const allowedPaths = rolePaths[roleName] || [];

      if (
        !allowedPaths.some((allowedPath) => pathname.startsWith(allowedPath))
      ) {
        console.log(
          "RootLayout: Unauthorized access attempt for",
          pathname,
          "by role",
          roleName
        );
        logAccessAttempt(
          currentStaff.id,
          `${currentStaff.first_name} ${currentStaff.last_name}`,
          roleName,
          pathname
        );
        setIsUnauthorized(true);
        setIsAuthChecked(true);
        return;
      }

      console.log("RootLayout: Authentication check passed for", pathname);
      setIsUnauthorized(false);
      setIsAuthChecked(true);
    }
  }, [
    currentStaff,
    pathname,
    router,
    logAccessAttempt,
    _hasHydrated,
    defaultRolePages,
  ]);

  useEffect(() => {
    if (isLargerThanMd) {
      setSidebarOpen(true);
    }
  }, [isLargerThanMd]);

  // Handle click outside of the sidebar on mobile
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        !isLargerThanMd &&
        sidebarOpen &&
        event.target instanceof Node &&
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [sidebarOpen, isLargerThanMd]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const showMainContent =
    _hasHydrated &&
    (currentStaff ||
      pathname === "/pos/login" ||
      pathname.startsWith("/pos/kiosk"));

  return (
    <>
      <ChakraProvider>
        {showMainContent ? (
          <Box minH="100vh" bg="white" position="relative">
            {/* Sidebar - Fixed on left with no padding */}
            {!hideSidebar && (
              <>
                {/* Desktop Sidebar */}
                <Box
                  position="fixed"
                  left="0"
                  top="0"
                  h="100vh"
                  w="280px" // Updated from 200px to 280px
                  bg="white"
                  borderRight="1px"
                  borderRightColor="gray.200"
                  zIndex="100"
                  display={{ base: "none", md: "block" }}
                >
                  <SidebarContent onClose={() => setSidebarOpen(false)} />
                </Box>

                {/* Mobile Sidebar */}
                {sidebarOpen && (
                  <Box
                    as="nav"
                    ref={navbarRef}
                    position="fixed"
                    top="0"
                    left="0"
                    h="100vh"
                    w="100%"
                    zIndex="200"
                    bg="white"
                    display={{ base: "block", md: "none" }}
                  >
                    <SidebarContent onClose={() => setSidebarOpen(false)} />
                  </Box>
                )}
              </>
            )}

            {/* Main Content Area - Starts where sidebar ends */}
            <Box
              ml={{ base: 0, md: !hideSidebar ? "280px" : 0 }} // Updated from 200px to 280px
              minH="100vh"
              bg="white"
              position="relative"
            >
              {/* Top Bar - Only show in mobile view */}
              {!hidePOSHeader && (
                <Box
                  position="fixed"
                  top="0"
                  left={{ base: 0, md: !hideSidebar ? "280px" : 0 }}
                  right="0"
                  height="80px"
                  bg="white"
                  borderBottom="1px"
                  borderBottomColor="gray.200"
                  zIndex="90"
                  display={{ base: "block", md: "none" }} // Only show on mobile
                >
                  <POSHeader onOpen={() => setSidebarOpen(true)} />
                </Box>
              )}

              {/* Page Content - Remove right padding and ensure full width */}
              <Box
                pt={{ base: !hidePOSHeader ? "80px" : "0", md: "0" }} // Only add padding on mobile                minH="100vh"
                bg="white"
                width="100%" // Ensure full width
                maxWidth="100%" // Prevent any max-width constraints
                px={0} // Remove horizontal padding
                mx={0} // Remove margins
              >
                {/* Notifications */}
                <VStack
                  spacing={3}
                  position="sticky"
                  top="90px"
                  zIndex={30}
                  width="full"
                  px={4}
                >
                  {notifications.map((notification) => (
                    <Alert
                      key={notification.id}
                      status={notification.type}
                      variant="left-accent"
                      rounded="md"
                      shadow="md"
                      width="full"
                      maxWidth="600px"
                    >
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle>
                          {notification.type === "info"
                            ? "New Order!"
                            : "Notification"}
                        </AlertTitle>
                        <AlertDescription display="block">
                          {notification.message}
                        </AlertDescription>
                      </Box>
                      <CloseButton
                        position="absolute"
                        right="8px"
                        top="8px"
                        onClick={() => dismissNotification(notification.id)}
                      />
                    </Alert>
                  ))}
                </VStack>

                {/* Page Content - Remove all padding */}
                <Box width="100%" px={0} mx={0}>
                  {children}
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            zIndex="9999"
            bg="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Spinner
              size="xl"
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="var(--primary-green)"
            />
          </Box>
        )}

        {isUnauthorized && (
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            zIndex="9998"
            bg="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <VStack spacing={4}>
              <Heading as="h2" size="xl" color="red.500">
                Unauthorized Access
              </Heading>
              <Text fontSize="lg" color="gray.600">
                You do not have permission to view this page.
              </Text>
              <Link
                href={
                  defaultRolePages[
                    currentStaff?.mainAccessRole?.name?.toLowerCase() as keyof typeof defaultRolePages
                  ] || defaultRolePages.default
                }
                passHref
              >
                <ChakraLink color="blue.500">Go to my dashboard</ChakraLink>
              </Link>
            </VStack>
          </Box>
        )}
      </ChakraProvider>
    </>
  );
}
