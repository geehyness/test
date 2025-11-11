// src/app/pos/layout.tsx - ENHANCED VERSION
"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import SidebarContent from "@/components/pos/SidebarContent";
import { POSHeader } from "@/components/pos/POSHeader";
import BottomNavigation from "@/components/pos/BottomNavigation";
import {
  Box,
  Flex,
  useMediaQuery,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  Button,
} from "@chakra-ui/react";
import { usePOSStore } from "@/lib/usePOSStore";
import ErrorBoundary from "@/components/ErrorBoundary";

// Loading fallback component
const LoadingFallback = () => (
  <Flex
    minH="100vh"
    align="center"
    justify="center"
    direction="column"
    bg="gray.50"
  >
    <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
    <Text mt={4} color="gray.600" fontSize="lg">
      Loading POS System...
    </Text>
  </Flex>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <Flex minH="100vh" align="center" justify="center" direction="column" p={4}>
    <Text fontSize="xl" fontWeight="bold" color="red.500" mb={2}>
      Something went wrong
    </Text>
    <Text color="gray.600" textAlign="center" mb={4}>
      {error.message || "An unexpected error occurred"}
    </Text>
    <Button colorScheme="blue" onClick={resetErrorBoundary}>
      Try Again
    </Button>
  </Flex>
);

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // State management
  const [isLargerThanMd, setIsLargerThanMd] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Store hydration check
  const { _hasHydrated, currentStaff } = usePOSStore();

  // Media query with safe SSR handling
  const [mediaQuery] = useMediaQuery("(min-width: 768px)", {
    ssr: true,
    fallback: false,
  });

  // Update media query state safely
  useEffect(() => {
    setIsLargerThanMd(mediaQuery);
  }, [mediaQuery]);

  // Initialize component after mount
  useEffect(() => {
    setMounted(true);
    setSidebarOpen(mediaQuery);

    // Log layout initialization for debugging
    console.log("POS Layout mounted", {
      pathname,
      mediaQuery,
      hasHydrated: _hasHydrated,
      currentStaff: !!currentStaff
    });
  }, [mediaQuery, pathname, _hasHydrated, currentStaff]);

  // Route-based visibility logic
  const hideSidebar = React.useMemo(() => {
    return (
      pathname?.includes("/pos/login") ||
      pathname?.includes("/pos/kiosk") ||
      pathname === "/pos" ||
      pathname === "/pos/"
    );
  }, [pathname]);

  const hidePOSHeader = React.useMemo(() => {
    return (
      pathname?.includes("/pos/login") ||
      pathname?.includes("/pos/kiosk")
    );
  }, [pathname]);

  const hideBottomNav = React.useMemo(() => {
    return (
      pathname?.includes("/pos/login") ||
      pathname?.includes("/pos/kiosk") ||
      pathname?.includes("/pos/management") // Hide in management pages
    );
  }, [pathname]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (!isLargerThanMd) {
      setSidebarOpen(false);
    }
  }, [pathname, isLargerThanMd]);

  // Click outside handler for sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !isLargerThanMd &&
        sidebarOpen &&
        navbarRef.current &&
        !navbarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen && !isLargerThanMd) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen, isLargerThanMd]);

  // Handle store hydration errors
  useEffect(() => {
    if (mounted && _hasHydrated && !currentStaff && !pathname?.includes("/pos/login")) {
      console.warn("No staff logged in, but not on login page");
      // You might want to redirect to login here
      // router.push('/pos/login');
    }
  }, [mounted, _hasHydrated, currentStaff, pathname]);

  // Don't render until mounted and store is hydrated for authenticated routes
  if (!mounted) {
    return <LoadingFallback />;
  }

  // Show loading state while store is hydrating for authenticated pages
  if (!hidePOSHeader && !_hasHydrated) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
      )}
    >
      <Flex
        minH="100vh"
        bg="gray.50"
        position="relative"
        overflow="hidden"
      >
        {/* Sidebar */}
        {!hideSidebar && (
          <Box
            position={{ base: "fixed", md: "relative" }}
            top={0}
            left={0}
            bottom={0}
            zIndex={{ base: 1400, md: "auto" }}
            transform={{
              base: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
              md: "translateX(0)"
            }}
            transition="transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out"
            boxShadow={{
              base: sidebarOpen ? "2xl" : "none",
              md: "none"
            }}
          >
            <SidebarContent
              isOpen={sidebarOpen}
              ref={navbarRef}
              onClose={() => setSidebarOpen(false)}
            />
          </Box>
        )}

        {/* Main Content Area */}
        <Box
          flex="1"
          minW="0" // Prevent flexbox overflow
          ml={{
            base: 0,
            md: hideSidebar ? 0 : (sidebarOpen ? '280px' : 0)
          }}
          pb={{
            base: hideBottomNav ? 0 : '80px', // Increased for better mobile handling
            md: 0
          }}
          transition="all 0.3s ease-in-out"
          width={{
            base: '100%',
            md: hideSidebar ? '100%' : (sidebarOpen ? 'calc(100% - 280px)' : '100%')
          }}
          position="relative"
        >
          {/* Header */}
          {!hidePOSHeader && (
            <POSHeader
              onOpen={() => setSidebarOpen(true)}
              sidebarOpen={sidebarOpen}
            />
          )}

          {/* Main Content */}
          <Box
            as="main"
            pt={{
              base: hidePOSHeader ? 0 : '80px',
              md: hidePOSHeader ? 0 : '80px'
            }}
            px={{ base: 2, md: 4 }}
            minH={{
              base: hideBottomNav ? "100vh" : "calc(100vh - 80px)",
              md: "100vh"
            }}
            overflow="auto"
          >
            <Suspense fallback={
              <Flex
                justify="center"
                align="center"
                h="200px"
                direction="column"
              >
                <Spinner
                  size="xl"
                  thickness="4px"
                  speed="0.65s"
                  color="blue.500"
                  emptyColor="gray.200"
                />
                <Text mt={4} color="gray.600">
                  Loading content...
                </Text>
              </Flex>
            }>
              {children}
            </Suspense>
          </Box>
        </Box>

        {/* Bottom Navigation */}
        {!hideBottomNav && (
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            zIndex={1300}
            bg="white"
            borderTop="1px solid"
            borderColor="gray.200"
            display={{ base: "block", md: "none" }}
          >
            <BottomNavigation />
          </Box>
        )}

        {/* Mobile Overlay */}
        {sidebarOpen && !isLargerThanMd && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            zIndex={1300}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </Flex>
    </ErrorBoundary>
  );
}