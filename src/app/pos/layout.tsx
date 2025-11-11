// src/app/pos/layout.tsx - IMPROVED VERSION
"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { usePathname } from "next/navigation";
import SidebarContent from "@/components/pos/SidebarContent";
import { POSHeader } from "@/components/pos/POSHeader";
import BottomNavigation from "@/components/pos/BottomNavigation";
import {
  Box,
  Flex,
  useMediaQuery,
  Spinner,
  Text,
} from "@chakra-ui/react";

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize with false to avoid hydration mismatch, then update after mount
  const [isLargerThanMd] = useMediaQuery("(min-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Set mounted state and initial sidebar state
  useEffect(() => {
    setMounted(true);
    setSidebarOpen(isLargerThanMd);
  }, [isLargerThanMd]);

  const hideSidebar =
    pathname?.includes("/pos/login") ||
    pathname?.includes("/pos/kiosk") ||
    pathname === "/pos" ||
    pathname === "/pos/";

  const hidePOSHeader =
    pathname?.includes("/pos/login") ||
    pathname?.includes("/pos/kiosk");

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen, isLargerThanMd]);

  // Don't render until mounted to avoid hydration mismatches
  if (!mounted) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Flex minH="100vh">
      {!hideSidebar && (
        <SidebarContent
          isOpen={sidebarOpen}
          ref={navbarRef}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      <Box
        flex="1"
        ml={{ base: 0, md: hideSidebar ? 0 : sidebarOpen ? '280px' : 0 }}
        pb={{ base: '60px', md: 0 }}
        transition="margin-left 0.3s ease-in-out"
        width={{
          base: '100%',
          md: hideSidebar ? '100%' : sidebarOpen ? 'calc(100% - 280px)' : '100%'
        }}
      >
        {!hidePOSHeader && (
          <POSHeader onOpen={() => setSidebarOpen(true)} />
        )}

        <Box
          as="main"
          pt={{ base: hidePOSHeader ? 0 : '80px', md: 0 }}
        >
          <Suspense fallback={
            <Flex justify="center" align="center" h="200px">
              <Spinner size="xl" />
              <Text ml={4}>Loading...</Text>
            </Flex>
          }>
            {children}
          </Suspense>
        </Box>
      </Box>
      {!hideSidebar && <BottomNavigation />}
    </Flex>
  );
}