// src/app/layout.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import '@/app/globals.css';
import SidebarContent from '@/components/pos/SidebarContent';
import { POSHeader } from '@/components/pos/POSHeader';
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
import Link from 'next/link';
import { usePOSStore } from '@/lib/usePOSStore';

interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLargerThanMd] = useMediaQuery('(min-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(isLargerThanMd);
  const navbarRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { currentStaff, _hasHydrated, logAccessAttempt } = usePOSStore();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Default role pages for redirects
  const defaultRolePages: Record<string, string> = useMemo(() => ({
    'admin': '/pos/admin',
    'manager': '/pos/management',
    'server': '/pos/server',
    'kitchen': '/pos/kitchen',
    'cashier': '/pos',
    'default': '/pos',
  }), []);

  // Define pages where the sidebar should NOT be visible
  const hideSidebar =
    pathname.startsWith('/pos/login') ||
    pathname.startsWith('/pos/kitchen') ||
    pathname.startsWith('/pos/server') ||
    pathname.startsWith('/pos/kiosk') || // ADDED: Hide sidebar for kiosk
    pathname === '/pos';

  // Define pages where the POSHeader should NOT be visible
  const hidePOSHeader =
    pathname.startsWith('/pos/login') ||
    pathname.startsWith('/pos/kiosk'); // ADDED: Hide header for kiosk

  // Role-based access control
  useEffect(() => {
    if (!_hasHydrated) {
      console.log('RootLayout: Waiting for state hydration...');
      return;
    }

    // ADD: Skip auth check for kiosk page
    if (pathname.startsWith('/pos/kiosk')) {
      console.log('RootLayout: Kiosk page detected, skipping auth check');
      setIsAuthChecked(true);
      return;
    }

    const rolePaths: Record<string, string[]> = {
      'admin': ['/pos', '/pos/management', '/pos/kitchen', '/pos/server', '/pos/admin', '/pos/admin/reports', '/pos/management/employees', '/pos/management/users', '/pos/management/access_roles', '/pos/management/inventory_products', '/pos/management/inventory', '/pos/management/suppliers', '/pos/management/foods', '/pos/management/categories', '/pos/management/tables', '/pos/management/reports', '/pos/management/shifts'],
      'manager': ['/pos/management', '/pos/kitchen', '/pos/server', '/pos/management/foods', '/pos/management/categories', '/pos/management/tables', '/pos/management/employees'],
      'server': ['/pos/server'],
      'kitchen': ['/pos/kitchen'],
      'cashier': ['/pos'],
      'supply-chain': ['/pos/management/inventory_products', '/pos/management/inventory', '/pos/management/suppliers', '/pos/management/foods'],
      'hr': ['/pos/management', '/pos/management/employees', '/pos/management/access_roles']
    };

    if (!currentStaff && pathname !== '/pos/login') {
      console.log('RootLayout: No staff logged in, redirecting to /pos/login.');
      router.replace('/pos/login');
      setIsAuthChecked(true);
      return;
    }

    if (currentStaff && pathname === '/pos/login') {
      console.log('RootLayout: Staff logged in on /pos/login, redirecting to default page.');
      const roleName = currentStaff.mainAccessRole?.name?.toLowerCase() || 'default';
      const defaultPage = defaultRolePages[roleName] || defaultRolePages['default'];
      router.replace(defaultPage);
      setIsAuthChecked(false);
      return;
    }

    if (currentStaff && pathname !== '/pos/login') {
      const roleName = currentStaff.mainAccessRole?.name?.toLowerCase() || 'default';
      const allowedPaths = rolePaths[roleName] || [];

      if (!allowedPaths.some(allowedPath => pathname.startsWith(allowedPath))) {
        console.log('RootLayout: Unauthorized access attempt for', pathname, 'by role', roleName);
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

      console.log('RootLayout: Authentication check passed for', pathname);
      setIsUnauthorized(false);
      setIsAuthChecked(true);
    }
  }, [currentStaff, pathname, router, logAccessAttempt, _hasHydrated, defaultRolePages]);

  useEffect(() => {
    if (isLargerThanMd) {
      setSidebarOpen(true);
    }
  }, [isLargerThanMd]);

  // Handle click outside of the sidebar on mobile
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!isLargerThanMd && sidebarOpen && event.target instanceof Node && navbarRef.current && !navbarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [sidebarOpen, isLargerThanMd]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const shouldPadLeft = !hideSidebar;
  const headerHeight = "90px";

  const showMainContent = _hasHydrated && (currentStaff || pathname === '/pos/login' || pathname.startsWith('/pos/kiosk'));

  return (
    <>
      <body>
        <ChakraProvider>
          {showMainContent ? (
            <Flex direction="row" minH="100vh" bg="var(--light-gray-bg)">
              {/* Conditional rendering for desktop sidebar */}
              {!hideSidebar && (
                <SidebarContent
                  onClose={() => setSidebarOpen(false)}
                  display={{ base: "none", md: "block" }}
                />
              )}

              {/* Conditional rendering for mobile sidebar */}
              {sidebarOpen && !hideSidebar && (
                <Box
                  as="nav"
                  ref={navbarRef}
                  pos="fixed"
                  top="0"
                  left="0"
                  h="100%"
                  zIndex="200"
                  transition="transform 0.3s ease-in-out"
                  transform={{
                    base: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                    md: "translateX(0)",
                  }}
                  bg="white"
                  borderRightWidth="1px"
                  display={{ base: "block", md: "none" }}
                >
                  <SidebarContent onClose={() => setSidebarOpen(false)} />
                </Box>
              )}

              <Box flex="1" ml={{ base: 0, md: !hideSidebar ? '250px' : 0 }}>
                {/* Conditional rendering for POSHeader */}
                {!hidePOSHeader && (
                  <Box
                    position="fixed"
                    top="0"
                    left={{ base: 0, md: !hideSidebar ? '250px' : 0 }}
                    right="0"
                    zIndex="100"
                  >
                    <POSHeader onOpen={() => setSidebarOpen(true)} />
                  </Box>
                )}

                <Box
                  as="main"
                  flex="1"
                  minH="calc(100vh - 60px)"
                  pt={{
                    base: !hidePOSHeader ? headerHeight : '60px',
                    md: !hidePOSHeader ? headerHeight : 6
                  }}
                >
                  <VStack spacing={3} position="sticky" top="10px" zIndex={30} width="full">
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
                          <AlertTitle>{notification.type === 'info' ? 'New Order!' : 'Notification'}</AlertTitle>
                          <AlertDescription display="block">{notification.message}</AlertDescription>
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
                  {children}
                </Box>
              </Box>
            </Flex>
          ) : (
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              zIndex="9999"
              bg="rgba(255, 255, 255, 1)"
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
              bg="rgba(255, 255, 255, 1)"
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
                <Link href={defaultRolePages[currentStaff?.mainAccessRole?.name?.toLowerCase() || 'default']} passHref>
                  <ChakraLink color="blue.500">
                    Go to my dashboard
                  </ChakraLink>
                </Link>
              </VStack>
            </Box>
          )}
        </ChakraProvider>
      </body>
    </>
  );
}