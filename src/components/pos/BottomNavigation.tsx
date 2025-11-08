// src/components/pos/BottomNavigation.tsx
'use client';

import React from 'react';
import { Flex, Box, Icon, Text, Link } from '@chakra-ui/react';
import { FaThLarge, FaClipboardList, FaUtensils, FaBell } from 'react-icons/fa';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

const NavItem = ({ href, icon, label }: { href: string, icon: React.ElementType, label: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link as={NextLink} href={href} flex="1">
      <Flex
        direction="column"
        align="center"
        justify="center"
        h="100%"
        color={isActive ? 'green.500' : 'gray.500'}
        fontWeight={isActive ? 'bold' : 'normal'}
        transition="color 0.2s"
      >
        <Icon as={icon} boxSize={6} />
        <Text fontSize="xs" mt={1}>{label}</Text>
      </Flex>
    </Link>
  );
};

export default function BottomNavigation() {
  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      h="60px"
      bg="white"
      borderTopWidth="1px"
      borderColor="gray.200"
      display={{ base: 'block', md: 'none' }}
      zIndex={100}
    >
      <Flex h="100%">
        <NavItem href="/pos/dashboard" icon={FaThLarge} label="Dashboard" />
        <NavItem href="/pos/management" icon={FaClipboardList} label="Manage" />
        <NavItem href="/pos/kitchen" icon={FaUtensils} label="Kitchen" />
        <NavItem href="/pos/server" icon={FaBell} label="Server" />
      </Flex>
    </Box>
  );
}