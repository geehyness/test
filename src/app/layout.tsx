'use client'; // This component uses client-side hooks like useState and needs to be client-side

import React, { useState } from 'react';
import Link from 'next/link'; // Still use Next.js Link for routing
import '@/app/globals.css'; // Keep your global CSS for now
import Navbar from './components/Navbar'; // Your Navbar component will be refactored next
import { ChakraProvider, Box, Flex, Button, Heading } from '@chakra-ui/react'; // Import Chakra UI components
import { Menu } from 'lucide-react'; // Keep lucide-react for icons, as they are not tied to styling

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body>
        {/* Wrap your entire application with ChakraProvider */}
        <ChakraProvider>
          {/* Mobile Header and Menu Button */}
          <Flex
            display={{ base: 'flex', md: 'none' }} // Hidden on medium screens and up
            p={4}
            bg="gray.800"
            color="white"
            justify="space-between"
            align="center"
            shadow="md"
          >
            <Heading as="h2" size="xl" color="yellow.400">
              Resto Admin
            </Heading>
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              p={2}
              rounded="md"
              _focus={{ outline: 'none', ring: 2, ringColor: 'insetWhite' }} // Chakra's focus styles
              aria-label="Toggle sidebar"
              variant="unstyled" // No default button styles
            >
              <Menu size={24} /> {/* lucide-react icon */}
            </Button>
          </Flex>

          <Flex
            direction={{ base: 'column', md: 'row' }} // Column on base, row on md and up
            h="100vh" // Full viewport height
            bg="gray.100" // Light gray background
            fontFamily="sans-serif" // Default font, can be customized via theme
          >
            {/* Sidebar */}
            <Box
              position={{ base: 'fixed', md: 'relative' }} // Fixed on mobile, relative on desktop
              insetY={0}
              left={0}
              zIndex={50} // High z-index for mobile overlay
              w={{ base: '64', md: '64' }} // Width 64 (256px)
              bg="gray.800" // Dark sidebar background
              transform={{ base: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', md: 'translateX(0)' }} // Slide in/out
              transition="transform 0.3s ease-in-out" // Smooth transition
              shadow={{ base: 'lg', md: 'none' }} // Add shadow on mobile sidebar
            >
              <Navbar /> {/* Your Navbar component */}
            </Box>

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
              <Box
                position="fixed"
                inset={0}
                zIndex={40}
                display={{ base: 'block', md: 'none' }} // Only show on mobile
                bg="rgba(51, 51, 51, 0.2)" // Custom overlay color with transparency
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true" // Hide from accessibility tree
              />
            )}

            {/* Main Content Area */}
            <Box flex={1} p={{ base: 4, md: 6 }} overflowY="auto">
              {children}
            </Box>
          </Flex>
        </ChakraProvider>
      </body>
    </html>
  );
}