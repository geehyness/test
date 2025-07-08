/* src/app/layout.tsx */
'use client'; // This component uses client-side hooks like useState and needs to be client-side

import React, { useState } from 'react';
import Link from 'next/link'; // Still use Next.js Link for routing
import '@/app/globals.css'; // Keep your global CSS
import Navbar from './components/Navbar'; // Your Navbar component
import { ChakraProvider, Box, Flex, Button, Heading } from '@chakra-ui/react'; // Import Chakra UI components
import { Menu } from 'lucide-react'; // Keep lucide-react for icons

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body>
        <ChakraProvider>
          {/* Main container for the entire application layout */}
          <Flex
            direction={{ base: 'column', md: 'row' }} // This helps organize children but sidebar is now out of flow
            minH="100vh" // Take full viewport height
            bg="var(--light-gray-bg)" // Apply page background here
          >
            {/* Mobile Header (visible only on mobile, positioned at the top of the column) */}
            <Flex
              display={{ base: 'flex', md: 'none' }}
              p={4}
              bg="var(--navbar-bg)" // Use navbar background color
              color="var(--navbar-main-item-inactive-text)" // Use navbar text color
              justify="space-between"
              align="center"
              shadow="md"
              width="full" // Ensure it takes full width on mobile
            >
              <Heading as="h2" size="xl" color="var(--navbar-heading-color)"> {/* Use navbar heading color */}
                Resto Admin
              </Heading>
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                p={2}
                rounded="md"
                _focus={{ outline: 'none', ring: 2, ringColor: 'var(--primary-green)' }} // Use primary green for focus ring
                bg="transparent"
                _hover={{ bg: 'var(--navbar-main-item-hover-bg)' }}
                color="var(--navbar-main-item-inactive-text)"
              >
                <Menu size={24} />
              </Button>
            </Flex>

            {/* Sidebar (now fixed on all screen sizes) */}
            <Box
              // Sidebar is now fixed on all screen sizes
              position="fixed"
              insetY={0}
              left={0}
              zIndex={50}
              w={{ base: '64', md: '64' }}
              bg="var(--navbar-bg)"
              transform={{ base: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', md: 'translateX(0)' }}
              transition="transform 0.3s ease-in-out"
              shadow={{ base: 'lg', md: 'none' }}
              // Set height to full viewport height and keep internal scrolling
              h="100vh"
              overflowY="auto"
            >
              <Navbar />
            </Box>

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && (
              <Box
                position="fixed"
                inset={0}
                zIndex={40}
                display={{ base: 'block', md: 'none' }}
                bg="rgba(0, 0, 0, 0.4)"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Main Content Area */}
            <Box
              // Add a margin on the left for desktop to avoid the fixed sidebar
              ml={{ base: 0, md: '64' }}
              flex={1} // Takes up remaining space in the flex container
              p={{ base: 4, md: 6 }}
              overflowY="auto" // Enable scrolling ONLY for the main content area
              // On mobile, padding-top accounts for the header
              pt={{ base: '60px', md: 6 }}
            >
              {children}
            </Box>
          </Flex>
        </ChakraProvider>
      </body>
    </html>
  );
}