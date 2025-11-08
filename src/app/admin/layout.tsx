// src/app/admin/layout.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BottomNavigation from '@/components/admin/BottomNavigation';
import {
  Box,
  Flex,
  useMediaQuery,
  IconButton,
  Heading,
} from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLargerThanMd] = useMediaQuery('(min-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(isLargerThanMd);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(isLargerThanMd);
  }, [isLargerThanMd]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (!isLargerThanMd) {
      setSidebarOpen(false);
    }
  }, [pathname, isLargerThanMd]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Flex>
      <Navbar isOpen={sidebarOpen} ref={sidebarRef} />

      <Box
        flex="1"
        ml={{ base: 0, md: '250px' }}
        pb={{ base: '60px', md: 0 }} // Padding for bottom navigation on mobile
        transition="margin-left 0.3s ease-in-out"
      >
        {/* Mobile Header */}
        <Flex
          as="header"
          align="center"
          justify="space-between"
          p={4}
          bg="white"
          borderBottomWidth="1px"
          borderColor="gray.200"
          display={{ base: 'flex', md: 'none' }}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            onClick={handleToggleSidebar}
            variant="outline"
          />
          <Heading as="h1" size="md">
            Admin
          </Heading>
          <Box w="40px" /> {/* Spacer */}
        </Flex>

        <Box as="main" p={{ base: 4, md: 8 }}>
          {children}
        </Box>
      </Box>

      <BottomNavigation />
    </Flex>
  );
}