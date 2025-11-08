// src/app/pos/layout.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import SidebarContent from "@/components/pos/SidebarContent";
import { POSHeader } from "@/components/pos/POSHeader";
import BottomNavigation from "@/components/pos/BottomNavigation";
import {
  Box,
  Flex,
  useMediaQuery,
} from "@chakra-ui/react";

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLargerThanMd] = useMediaQuery("(min-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(isLargerThanMd);
  const navbarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const hideSidebar =
    pathname.startsWith("/pos/login") ||
    pathname.startsWith("/pos/kiosk") ||
    pathname === "/pos" ||
    pathname === "/pos/";

  const hidePOSHeader =
    pathname.startsWith("/pos/login") || pathname.startsWith("/pos/kiosk");

  useEffect(() => {
    setSidebarOpen(isLargerThanMd);
  }, [isLargerThanMd]);

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

  return (
    <Flex>
      {!hideSidebar && (
        <SidebarContent
          isopen={sidebarOpen}
          ref={navbarRef}
          onClose={() => setSidebarOpen(false)}
          display={{ base: sidebarOpen ? 'block' : 'none', md: 'block' }}
        />
      )}
      <Box
        flex="1"
        ml={{ base: 0, md: hideSidebar ? 0 : '280px' }}
        pb={{ base: '60px', md: 0 }} // Padding for bottom nav
        transition="margin-left 0.3s ease-in-out"
        width={{
          base: '100%',
          md: hideSidebar ? '100%' : 'calc(100% - 280px)'
        }}
      >
        {!hidePOSHeader && (
          <POSHeader
            onOpen={() => setSidebarOpen(true)}
            display={{ base: "flex", md: hideSidebar ? 'flex' : 'none' }}
          />
        )}

        <Box
          as="main"
          pt={{ base: hidePOSHeader ? 0 : '80px', md: 0 }}
        >
          {children}
        </Box>
      </Box>
      {!hideSidebar && <BottomNavigation />}
    </Flex>
  );
}