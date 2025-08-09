// src/app/pos/layout.tsx
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ChakraProvider, Box, Flex, Spinner, Center, VStack, Heading, Text, Link as ChakraLink, IconButton } from '@chakra-ui/react';
import { POSHeader } from './components/POSHeader';
import { usePOSStore } from './lib/usePOSStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
// Removed the Providers import as per your provided file's structure.

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentStaff, logAccessAttempt, _hasHydrated } = usePOSStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktopNavLockedOpen, setIsDesktopNavLockedOpen] = useState(false);

  const desktopSidebarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const desktopSidebarRef = useRef<HTMLDivElement>(null);
  const desktopToggleButtonRef = useRef<HTMLButtonElement>(null);

  console.log('POSLayout: Rendered. Current pathname:', pathname, 'currentStaff:', currentStaff ? currentStaff.id : 'None', '_hasHydrated:', _hasHydrated);

  // Change defaultRolePages to use Record<string, string> type
  const defaultRolePages: Record<string, string> = useMemo(() => ({
    'admin': '/pos/admin',
    'manager': '/pos/management',
    'server': '/pos/server',
    'kitchen': '/pos/kitchen',
    'cashier': '/pos/dashboard',
    'default': '/pos/dashboard',
  }), []);



  useEffect(() => {
    if (!_hasHydrated) {
      console.log('POSLayout useEffect: Waiting for state hydration...');
      if (pathname !== '/pos/login') {
        setIsAuthChecked(false);
      }
      return;
    }

    const rolePaths: Record<string, string[]> = {
      'admin': ['/pos/management', '/pos/dashboard', '/pos/kitchen', '/pos/server', '/pos/admin', '/pos/admin/reports', '/pos/management/employees', '/pos/management/users', '/pos/management/access_roles', '/pos/management/inventory_products', '/pos/management/inventory', '/pos/management/suppliers', '/pos/management/foods', '/pos/management/categories', '/pos/management/tables', '/pos/management/reports'],
      'manager': ['/pos/management', '/pos/dashboard', '/pos/kitchen', '/pos/server', '/pos/management/foods', '/pos/management/categories', '/pos/management/tables', '/pos/management/employees'],
      'server': ['/pos/server', '/pos/dashboard'],
      'kitchen': ['/pos/kitchen', '/pos/dashboard'],
      'cashier': ['/pos/dashboard'],
      'supply-chain': ['/pos/dashboard', '/pos/management', '/pos/management/inventory_products', '/pos/management/inventory', '/pos/management/suppliers', '/pos/management/foods'],
      'hr': ['/pos/dashboard', '/pos/management', '/pos/management/employees', '/pos/management/access_roles']
    };



    if (!currentStaff && pathname !== '/pos/login') {
      console.log('POSLayout useEffect: No staff logged in, redirecting to /pos/login.');
      router.replace('/pos/login');
      setIsAuthChecked(true);
      return;
    }

    if (currentStaff && pathname === '/pos/login') {
      console.log('POSLayout useEffect: Staff logged in on /pos/login, redirecting to default page.');
      const roleName = currentStaff.mainAccessRole?.name?.toLowerCase() || 'default';
      const defaultPage = defaultRolePages[roleName] || defaultRolePages['default'];
      router.replace(defaultPage);
      setIsAuthChecked(false);
      return;
    }

    if (currentStaff && pathname !== '/pos/login') {
      const roleName = currentStaff.mainAccessRole?.name?.toLowerCase() || 'default';
      const allowedPaths = rolePaths[roleName] || [];

      if (!allowedPaths.includes(pathname)) {
        console.log('POSLayout useEffect: Unauthorized access attempt for', pathname, 'by role', roleName, '.');
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

      console.log('POSLayout useEffect: Authentication check passed for', pathname);
      setIsUnauthorized(false);
      setIsAuthChecked(true);
    }
  }, [currentStaff, pathname, router, logAccessAttempt, _hasHydrated, defaultRolePages]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const accessiblePages = useMemo(() => {
    if (!currentStaff) {
      return [];
    }

    const pageNames: Record<string, string> = {
      '/pos/management': 'Management Dashboard',
      '/pos/dashboard': 'POS Dashboard',
      '/pos/kitchen': 'Kitchen Display',
      '/pos/server': 'Server View',
      '/pos/admin': 'Admin Home',
      '/pos/admin/reports': 'Access Reports',
      '/pos/login': 'Login',
      '/pos/management/employees': 'Employee Management',
      '/pos/management/access_roles': 'Access Roles',
      '/pos/management/inventory_products': 'Inventory Products',
      '/pos/management/suppliers': 'Suppliers',
      '/pos/management/foods': 'Foods',
      '/pos/management/categories': 'Food Categories',
      '/pos/management/tables': 'Tables',
    };

    // A more complete map of roles to allowed navigation paths
    const navPaths: Record<string, string[]> = {
      'admin': [
        '/pos/admin',
        '/pos/admin/reports',
        '/pos/dashboard',
        '/pos/management',
        '/pos/management/employees',
        '/pos/management/access_roles',
        '/pos/management/inventory_products',
        '/pos/management/suppliers',
        '/pos/management/foods',
        '/pos/management/categories',
        '/pos/management/tables',
        '/pos/server',
        '/pos/kitchen',
      ],
      'manager': [
        '/pos/dashboard',
        '/pos/management',
        '/pos/management/employees',
        '/pos/management/foods',
        '/pos/management/categories',
        '/pos/management/tables',
        '/pos/server',
        '/pos/kitchen',
      ],
      'server': ['/pos/dashboard', '/pos/server'],
      'kitchen': ['/pos/dashboard', '/pos/kitchen'],
      'cashier': ['/pos/dashboard'],
      'supply-chain': [
        '/pos/dashboard',
        '/pos/management',
        '/pos/management/inventory_products',
        '/pos/management/suppliers',
        '/pos/management/foods',
      ],
      'hr': [
        '/pos/dashboard',
        '/pos/management',
        '/pos/management/employees',
        '/pos/management/access_roles',
      ]
    };

    const roleName = currentStaff.mainAccessRole?.name.toLowerCase();
    if (roleName && navPaths[roleName]) {
      // Define categories and their paths
      // The order of paths within the array determines the display order in the navigation.
      const categories: { [key: string]: string[] } = {
        'Admin Tools': ['/pos/admin', '/pos/admin/reports'],
        'Operations': ['/pos/dashboard', '/pos/server', '/pos/kitchen'],
        'Management': [
          '/pos/management',
          '/pos/management/employees',
          '/pos/management/access_roles',
          '/pos/management/inventory_products',
          '/pos/management/suppliers',
          '/pos/management/foods',
          '/pos/management/categories',
          '/pos/management/tables',
        ],
      };

      const pagesByCategory: { [key: string]: { path: string; name: string }[] } = {};

      for (const category in categories) {
        pagesByCategory[category] = [];
        for (const path of categories[category]) {
          if (navPaths[roleName].includes(path)) {
            pagesByCategory[category].push({
              path,
              name: pageNames[path] || path,
            });
          }
        }
      }

      // Flatten the categorized pages into a single array for rendering,
      // maintaining category order and the explicit order defined above.
      const categorizedAndSortedPages: { category: string; pages: { path: string; name: string }[] }[] = [];
      for (const category in pagesByCategory) {
        if (pagesByCategory[category].length > 0) {
          categorizedAndSortedPages.push({
            category,
            pages: pagesByCategory[category],
          });
        }
      }

      return categorizedAndSortedPages;
    }
    return [];
  }, [currentStaff]);

  useEffect(() => {
    return () => {
      if (desktopSidebarTimeoutRef.current) {
        clearTimeout(desktopSidebarTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth >= 768 && (isNavHovered || isDesktopNavLockedOpen)) {
        if (
          desktopSidebarRef.current &&
          !desktopSidebarRef.current.contains(event.target as Node) &&
          desktopToggleButtonRef.current &&
          !desktopToggleButtonRef.current.contains(event.target as Node)
        ) {
          console.log('Click outside desktop sidebar detected, closing.');
          setIsNavHovered(false);
          setIsDesktopNavLockedOpen(false);
          if (desktopSidebarTimeoutRef.current) {
            clearTimeout(desktopSidebarTimeoutRef.current);
            desktopSidebarTimeoutRef.current = null;
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNavHovered, isDesktopNavLockedOpen]);

  const showHeaderAndSidePanel = _hasHydrated && currentStaff && pathname !== '/pos/login';
  const showMainContent = _hasHydrated && (currentStaff || pathname === '/pos/login');

  const headerHeight = "80px";
  const mainContentPaddingTop = showHeaderAndSidePanel ? headerHeight : "0";
  const sidebarWidth = "250px";
  const sidebarVisibleCollapsedWidth = "10px";
  const mobileSidebarVisibleWidth = "10px";
  const sidebarLeftGap = "20px";
  const sidebarTopGap = "10px";
  const sidebarBottomGap = "20px";
  const desktopButtonOffset = "10px";

  const sidebarExpandedLeft = sidebarLeftGap;
  const sidebarCollapsedLeft = `calc(${sidebarLeftGap} - ${sidebarWidth} + ${sidebarVisibleCollapsedWidth})`;
  const sidebarTop = `calc(${headerHeight} + ${sidebarTopGap})`;
  const sidebarHeight = `calc(100vh - ${sidebarTop} - ${sidebarBottomGap})`;

  const mobileNavOpenLeft = sidebarLeftGap;
  const mobileNavClosedLeft = `calc(${sidebarLeftGap} - ${sidebarWidth} + ${mobileSidebarVisibleWidth})`;

  const desktopToggleButtonLeft = isNavHovered
    ? `calc(${sidebarExpandedLeft} + ${sidebarWidth} + ${desktopButtonOffset})`
    : `calc(${sidebarLeftGap} + ${sidebarVisibleCollapsedWidth} + ${desktopButtonOffset})`;

  const mobileToggleButtonLeft = isMobileNavOpen
    ? `calc(${mobileNavOpenLeft} + ${sidebarWidth} + ${desktopButtonOffset})`
    : `calc(${mobileNavClosedLeft} + ${sidebarWidth} - ${mobileSidebarVisibleWidth} + ${desktopButtonOffset})`;

  const contentLeftPadding = `calc(${sidebarVisibleCollapsedWidth} + ${sidebarLeftGap} + 20px)`;
  const contentRightPadding = "20px";

  const handleMouseEnterDesktopNav = () => {
    if (desktopSidebarTimeoutRef.current) {
      clearTimeout(desktopSidebarTimeoutRef.current);
      desktopSidebarTimeoutRef.current = null;
    }
    if (!isDesktopNavLockedOpen) {
      setIsNavHovered(true);
    }
  };

  const handleMouseLeaveDesktopNav = () => {
    if (!isDesktopNavLockedOpen) {
      desktopSidebarTimeoutRef.current = setTimeout(() => {
        setIsNavHovered(false);
      }, 200);
    }
  };

  const handleDesktopToggleButtonClick = () => {
    if (isDesktopNavLockedOpen) {
      setIsNavHovered(false);
      setIsDesktopNavLockedOpen(false);
      if (desktopSidebarTimeoutRef.current) {
        clearTimeout(desktopSidebarTimeoutRef.current);
        desktopSidebarTimeoutRef.current = null;
      }
    } else {
      setIsNavHovered(true);
      setIsDesktopNavLockedOpen(true);
    }
  };

  return (
    <ChakraProvider> {/* Using ChakraProvider directly as per your provided file */}
      {showMainContent ? (
        <Flex direction="column" minH="100vh" bg="var(--light-gray-bg)">
          {showHeaderAndSidePanel && (
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              width="full"
              zIndex="100"
            >
              <POSHeader onOpen={() => setIsMobileNavOpen(true)} />
            </Box>
          )}

          {/* Mobile Nav Overlay */}
          {showHeaderAndSidePanel && isMobileNavOpen && (
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              zIndex="9"
              bg="rgba(0, 0, 0, 0.5)"
              display={{ base: 'block', md: 'none' }}
              onClick={() => {
                setIsMobileNavOpen(false);
              }}
            />
          )}

          {/* Mobile Sidebar Toggle Button (Hamburger/Close) */}
          {showHeaderAndSidePanel && (
            <IconButton
              aria-label={isMobileNavOpen ? "Close mobile navigation" : "Open mobile navigation"}
              icon={isMobileNavOpen ? <CloseIcon /> : <HamburgerIcon />}
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              size="md"
              bg="var(--background-color-light)"
              color="var(--primary-green)"
              shadow="md"
              borderRadius="md"
              position="fixed"
              top={sidebarTop}
              left={mobileToggleButtonLeft}
              transform="translateY(-50%)"
              p={2}
              zIndex={101}
              display={{ base: 'flex', md: 'none' }}
              transition="left 0.3s ease-in-out, transform 0.3s ease-in-out"
            />
          )}

          {/* Desktop Sidebar Toggle Button (Hamburger/Close) */}
          {showHeaderAndSidePanel && (
            <IconButton
              ref={desktopToggleButtonRef}
              aria-label={isNavHovered ? "Close desktop navigation" : "Open desktop navigation"}
              icon={isNavHovered ? <CloseIcon /> : <HamburgerIcon />}
              onClick={handleDesktopToggleButtonClick}
              size="md"
              bg="var(--background-color-light)"
              color="var(--primary-green)"
              shadow="md"
              borderRadius="md"
              position="fixed"
              top={sidebarTop}
              left={desktopToggleButtonLeft}
              transform="translateY(-50%)"
              p={2}
              zIndex={101}
              display={{ base: 'none', md: 'flex' }}
              transition="left 0.3s ease-in-out, transform 0.3s ease-in-out, background-color 0.2s ease-in-out"
              _hover={{ bg: "var(--light-gray-bg-hover)" }}
            />
          )}

          <Flex flex="1">
            {showHeaderAndSidePanel && (
              <Box
                ref={desktopSidebarRef}
                width={sidebarWidth}
                bg="var(--background-color-light)"
                p={4}
                pt="0"
                position="fixed"
                height={sidebarHeight}
                top={sidebarTop}
                shadow="lg"
                borderRadius="lg"
                flexShrink={0}
                zIndex={10}
                display={{ base: 'none', md: 'block' }}
                left={isNavHovered ? sidebarExpandedLeft : sidebarCollapsedLeft}
                transition="left 0.3s ease-in-out"
                onMouseEnter={handleMouseEnterDesktopNav}
                onMouseLeave={handleMouseLeaveDesktopNav}
              >
                {accessiblePages.length > 0 && ( // Conditional rendering for desktop heading
                  <Heading as="h2" size="md" mb={4} color="var(--dark-gray-text)" mt="20px">
                    Navigation
                  </Heading>
                )}
                <VStack align="stretch" spacing={2}>
                  {accessiblePages.map((categoryGroup) => (
                    <React.Fragment key={categoryGroup.category}>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="var(--primary-green)"
                        mt={categoryGroup.pages.length > 0 ? 4 : 0} // Add margin top for separation
                        mb={2}
                      >
                        {categoryGroup.category}
                      </Text>
                      {categoryGroup.pages.map((page) => (
                        <ChakraLink
                          key={page.path}
                          as={Link}
                          href={page.path}
                          p={2}
                          rounded="md"
                          _hover={{ bg: "var(--light-gray-bg)", color: "var(--primary-green)" }}
                          bg={pathname === page.path ? "var(--primary-green)" : "transparent"}
                          color={pathname === page.path ? "white" : "var(--dark-gray-text)"}
                        >
                          {page.name}
                        </ChakraLink>
                      ))}
                    </React.Fragment>
                  ))}
                </VStack>
              </Box>
            )}

            {showHeaderAndSidePanel && (
              <Box
                width={sidebarWidth}
                bg="var(--background-color-light)"
                p={4}
                pt="0"
                position="fixed"
                height={sidebarHeight}
                top={sidebarTop}
                shadow="lg"
                borderRadius="lg"
                flexShrink={0}
                zIndex={100}
                display={{ base: 'block', md: 'none' }}
                left={isMobileNavOpen ? mobileNavOpenLeft : mobileNavClosedLeft}
                transition="left 0.3s ease-in-out"
              >
                {accessiblePages.length > 0 && ( // Conditional rendering for mobile heading
                  <Heading as="h2" size="md" mb={4} color="var(--dark-gray-text)" mt="20px">
                    Navigation
                  </Heading>
                )}
                <VStack align="stretch" spacing={2}>
                  {accessiblePages.map((categoryGroup) => (
                    <React.Fragment key={categoryGroup.category}>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="var(--primary-green)"
                        mt={categoryGroup.pages.length > 0 ? 4 : 0} // Add margin top for separation
                        mb={2}
                      >
                        {categoryGroup.category}
                      </Text>
                      {categoryGroup.pages.map((page) => (
                        <ChakraLink
                          key={page.path}
                          as={Link}
                          href={page.path}
                          p={2}
                          rounded="md"
                          _hover={{ bg: "var(--light-gray-bg)", color: "var(--primary-green)" }}
                          bg={pathname === page.path ? "var(--primary-green)" : "transparent"}
                          color={pathname === page.path ? "white" : "var(--dark-gray-text)"} >
                          {page.name}
                        </ChakraLink>
                      ))}
                    </React.Fragment>
                  ))}
                </VStack>
              </Box>
            )}

            <Box
              as="main"
              flex="1"
              p={4}
              pt={mainContentPaddingTop}
              pl={{ base: 4, md: contentLeftPadding }}
              pr={{ base: 4, md: contentRightPadding }}
            >
              {children}
            </Box>
          </Flex>
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
  );
}