// src/app/pos/layout.tsx
'use client';

import React from 'react';
import { ChakraProvider, Box, Flex } from '@chakra-ui/react';
import POSHeader from './components/POSHeader'; // Import the new POSHeader component

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChakraProvider>
      <Flex direction="column" minH="100vh" bg="var(--light-gray-bg)">
        {/* POS Specific Header */}
        <POSHeader />

        {/* Main content area for POS pages */}
        {/* Added padding-top to account for fixed header height */}
        <Box as="main" flex="1" p={4} pt="80px">
          {children}
        </Box>
      </Flex>
    </ChakraProvider>
  );
}