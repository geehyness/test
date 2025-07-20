// src/app/pos/components/POSHeader.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Flex,
  Box,
  Text,
  Avatar,
  Spacer,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem as ChakraMenuItem,
  Icon,
  HStack,
  Image as ChakraImage // Import Image as ChakraImage here
} from '@chakra-ui/react';
import { ChevronDownIcon, SettingsIcon, ExternalLinkIcon } from '@chakra-ui/icons'; // Using Chakra icons, ExternalLinkIcon for logout
import { useRouter } from 'next/navigation';
import { usePOSStore } from '../lib/usePOSStore'; // Import the store to get staff info

export default function POSHeader() {
  const router = useRouter();
  const { currentStaff, logoutStaff } = usePOSStore(); // Assuming currentStaff and logoutStaff are in your store

  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };

    updateDateTime(); // Set immediately on mount
    const intervalId = setInterval(updateDateTime, 1000); // Update every second

    return () => clearInterval(intervalId); // Clear interval on unmount
  }, []);

  const handleLogout = () => {
    logoutStaff(); // Clear staff session from store
    router.push('/pos/login'); // Redirect to login page
  };

  return (
    <Flex
      as="header"
      position="fixed"
      top="0"
      left="0"
      width="100%"
      bg="var(--background-color-light)"
      height="70px" /* Increased height for better visual */
      align="center"
      px={6} /* Increased padding */
      borderBottom="1px solid"
      borderColor="var(--border-color)"
      zIndex={100} /* Ensure it's on top */
      boxShadow="sm" /* Subtle shadow */
    >
      {/* Restaurant Logo/Name */}
      <Box display="flex" alignItems="center">
        <ChakraImage
          src="/c2.png" /* Your restaurant logo */
          alt="Restaurant Logo"
          width="40px"
          height="40px"
          objectFit="contain"
          mr={3}
        />
        <Text fontSize="xl" fontWeight="bold" color="var(--primary-green)" fontFamily="var(--font-lexend-deca)">
          Resto POS
        </Text>
      </Box>

      <Spacer />

      {/* Date and Time */}
      <Box textAlign="right" mr={6} display={{ base: 'none', md: 'block' }}>
        <Text fontSize="md" fontWeight="medium" color="var(--dark-gray-text)">{currentTime}</Text>
        <Text fontSize="sm" color="var(--medium-gray-text)">{currentDate}</Text>
      </Box>

      {/* Staff Profile and Logout */}
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost" rounded="full" px={2}>
          <HStack>
            <Avatar size="sm" name={currentStaff?.name || "POS Staff"} src={currentStaff?.avatar_url || "https://placehold.co/100x100/E0E0E0/000000?text=PS"} />
            <Text fontWeight="semibold" color="var(--dark-gray-text)" display={{ base: 'none', md: 'block' }}>
              {currentStaff?.name || "POS Staff"}
            </Text>
          </HStack>
        </MenuButton>
        <MenuList rounded="md" shadow="lg" bg="var(--background-color-light)" borderColor="var(--border-color)">
          <ChakraMenuItem
            onClick={() => router.push('/settings')} // Example: Link to staff settings
            color="var(--dark-gray-text)"
            _hover={{ bg: 'var(--light-gray-bg)' }}
            icon={<Icon as={SettingsIcon} />}
          >
            Settings
          </ChakraMenuItem>
          <ChakraMenuItem
            onClick={handleLogout}
            color="red.500"
            _hover={{ bg: 'red.50', color: 'red.600' }}
            icon={<Icon as={ExternalLinkIcon} />} // Changed to ExternalLinkIcon for logout
          >
            Log Out
          </ChakraMenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
}
