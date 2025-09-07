/* src/app/layout.tsx */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/app/globals.css';
import Navbar from '../components/Navbar';
import {
  ChakraProvider,
  Box,
  Flex,
  Button,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  VStack,
  useMediaQuery,
  Spacer
} from '@chakra-ui/react';
import { Menu } from 'lucide-react';

interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLargerThanMd] = useMediaQuery('(min-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(isLargerThanMd);
  const navbarRef = useRef<HTMLDivElement>(null); // Ref for the Navbar component

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const pathname = usePathname();

  // This variable determines if the current page is a POS-related page
  // It now includes any path starting with '/pos' or '/customer-menu'
  const isPOSPage = pathname.startsWith('/customer-menu') || pathname.startsWith('/pos');

  useEffect(() => {
    // Only set sidebarOpen based on screen size if it's not a POS page
    if (!isPOSPage) {
      setSidebarOpen(isLargerThanMd);
    } else {
      setSidebarOpen(false); // Ensure sidebar is closed on POS pages
    }
  }, [isLargerThanMd, isPOSPage]);

  useEffect(() => {
    const handleNewOrderNotification = (event: Event) => {
      const customEvent = event as CustomEvent<AppNotification>;
      setNotifications((prev) => [...prev, customEvent.detail]);
      setTimeout(() => {
        dismissNotification(customEvent.detail.id);
      }, 5000);
    };

    window.addEventListener('newOrderNotification', handleNewOrderNotification);

    return () => {
      window.removeEventListener('newOrderNotification', handleNewOrderNotification);
    };
  }, []);

  // Effect to handle clicks outside the sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !isLargerThanMd && // Only apply on mobile (when not larger than md)
        sidebarOpen &&
        navbarRef.current &&
        !navbarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, isLargerThanMd]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <html lang="en">
      <head>
        {/* Temporarily add this for DataTables CSS */}
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.datatables.net/2.0.8/css/dataTables.dataTables.min.css"
        />
      </head>
      <body>
        <ChakraProvider>
          <Flex>
            {/* Conditionally render Navbar based on isPOSPage */}
            {!isPOSPage && (
              <Navbar isOpen={sidebarOpen} ref={navbarRef} />
            )}

            {/* Main Content Area - Adjusted width calculation and background */}
            <Box
              // Adjust margin-left based on sidebarOpen and isPOSPage
              ml={{
                base: 0,
                md: isPOSPage ? '0' : (sidebarOpen ? '250px' : '0')
              }}
              transition="margin-left 0.3s ease-in-out"
              flex="1"
              // Explicitly calculate width on desktop to subtract sidebar width
              width={{
                base: '100%',
                md: isPOSPage ? '100%' : (sidebarOpen ? 'calc(100% - 250px)' : '100%')
              }}
              p={{ base: 0, md: 6 }}
              bg="var(--light-gray-bg)"
            >
              {/* Header / Topbar - Visible only on mobile and not on POS page */}
              <Flex
                as="header"
                position="fixed"
                top="0"
                left={{
                  base: 0,
                  md: isPOSPage ? '0' : (sidebarOpen ? '250px' : '0')
                }}
                width={{
                  base: '100%',
                  md: isPOSPage ? '100%' : (sidebarOpen ? 'calc(100% - 250px)' : '100%')
                }}
                bg="var(--background-color-light)"
                height="60px"
                align="center"
                px={4}
                pr={6}
                borderBottom="1px solid"
                borderColor="var(--border-color)"
                zIndex={10}
                transition="all 0.3s ease-in-out"
                display={{ base: isPOSPage ? 'none' : 'flex', md: 'none' }} // Hide on desktop and POS page
              >
                <Button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  variant="ghost"
                  aria-label="Toggle Menu"
                  mr={4}
                  color="#333"
                >
                  <Menu size={24} />
                </Button>


                <Heading as="h1" size="md" color="var(--dark-gray-text)" fontFamily="var(--font-lexend-deca)">
                  Resto Admin Dashboard
                </Heading>
                <Spacer />
                {sidebarOpen && (
                  <CloseButton onClick={() => setSidebarOpen(false)} />
                )}
              </Flex>

              <Box
                as="main"
                flex="1"
                minH="calc(100vh - 60px)"
                pt={{ base: isPOSPage ? 0 : '60px', md: isPOSPage ? 0 : 6 }}
              >
                <VStack spacing={3} position="sticky" top="10px" zIndex={30} width="full">
                  {notifications.map((notification) => (
                    <Alert
                      key={notification.id}
                      status={notification.type}
                      variant="left-accent"
                      rounded="md"
                      shadow="md"
                      width="full"
                      maxWidth="600px"
                    >
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle>{notification.type === 'info' ? 'New Order!' : 'Notification'}</AlertTitle>
                        <AlertDescription display="block">{notification.message}</AlertDescription>
                      </Box>
                      <CloseButton
                        position="absolute"
                        right="8px"
                        top="8px"
                        onClick={() => dismissNotification(notification.id)}
                      />
                    </Alert>
                  ))}
                </VStack>

                {children}
              </Box>
            </Box>
          </Flex>
        </ChakraProvider>
      </body>
    </html>
  );
}
