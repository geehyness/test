// src/components/Navbar.tsx
'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Flex,
  Text,
  VStack,
  Image as ChakraImage
} from '@chakra-ui/react';

// Simplified menu for Admin dashboard
export const dashboardMenu = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Tenants', href: '/admin/tenants' },
  { name: 'Global Reports', href: '/admin/reports' },
  { name: 'Users', href: '/admin/users' },
  { name: 'System Settings', href: '/admin/settings' },
];

const Navbar = forwardRef<HTMLDivElement, { isOpen: boolean }>(({ isOpen }, ref) => {
  const pathname = usePathname();

  return (
    <Box
      as="nav"
      ref={ref}
      w="250px"
      bg="white"
      color="gray.600"
      p={4}
      height="100vh"
      position="fixed"
      left={0}
      top="0"
      zIndex={20}
      transform={isOpen ? 'translateX(0)' : 'translateX(-100%)'}
      transition="transform 0.3s ease-in-out"
      boxShadow="lg"
      display={{ base: isOpen ? 'block' : 'none', md: 'block' }}
      overflowY="auto"
    >
      <Box position="sticky" top="0" zIndex="10" bg="white" pb={4}>
        <Box mb={2} textAlign="center">
          <br />
          <ChakraImage
            src="/carte.png"
            alt="Carte Logo"
            width="150px"
            height="auto"
            objectFit="contain"
            mx="auto"
            mt={4}
          />
          <br />
          <Text
            fontSize="md"
            fontWeight="medium"
            color="gray.700"
            mt={2}
          >
            Admin Panel
          </Text>
        </Box>
        <hr style={{ borderColor: 'var(--navbar-submenu-border-color)' }} />
        <br />
      </Box>

      {/* FIX: Removed redundant `as` prop to fix `spacing` error */}
      <VStack align="stretch" spacing={1}>
        {dashboardMenu.map((menuItem) => (
          <Box as="li" key={menuItem.name} listStyleType="none">
            <Link href={menuItem.href} passHref>
              <Text
                as="span"
                display="block"
                px={4}
                py={2}
                rounded="md"
                transition="all 0.2s"
                fontSize="md"
                fontWeight={pathname === menuItem.href ? 'bold' : 'normal'}
                bg={pathname === menuItem.href ? 'green.50' : 'transparent'}
                color={pathname === menuItem.href ? 'green.700' : 'gray.700'}
                _hover={{ bg: 'green.100', color: 'green.800' }}
                cursor="pointer"
              >
                {menuItem.name}
              </Text>
            </Link>
          </Box>
        ))}
      </VStack>
    </Box>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;