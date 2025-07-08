/* src/app/layout.tsx */
'use client'; // This component uses client-side hooks like useState and needs to be client-side

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Still use Next.js Link for routing
import { usePathname } from 'next/navigation'; // Import usePathname hook
import '@/app/globals.css'; // Keep your global CSS
import Navbar from './components/Navbar'; // Your Navbar component
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
  VStack, // Added for stacking notifications
} from '@chakra-ui/react'; // Import Chakra UI components
import { Menu } from 'lucide-react'; // Keep lucide-react for icons

// Define a type for your notifications
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const pathname = usePathname(); // Get the current pathname

  // Determine if the current page is a customer menu page
  const isCustomerMenuPage = pathname.startsWith('/customer-menu');

  // Effect to handle incoming custom events for notifications
  useEffect(() => {
    const handleNewOrderNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { tableId, items } = customEvent.detail;

      const itemNames = items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ');
      const message = `Table ${tableId} has ordered: ${itemNames}.`;

      const newNotification: AppNotification = {
        id: Date.now().toString(), // Unique ID for the notification
        message: message,
        type: 'info', // Or 'success' if you prefer
      };

      setNotifications((prevNotifications) => [...prevNotifications, newNotification]);

      // Automatically dismiss the notification after 5 seconds
      setTimeout(() => {
        setNotifications((prevNotifications) =>
          prevNotifications.filter((n) => n.id !== newNotification.id)
        );
      }, 5000);
    };

    // Add event listener for custom 'newOrderPlaced' event
    window.addEventListener('newOrderPlaced', handleNewOrderNotification as EventListener);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('newOrderPlaced', handleNewOrderNotification as EventListener);
    };
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((n) => n.id !== id)
    );
  };

  return (
    <html lang="en">
      <body>
        <ChakraProvider>
          {/* Main container for the entire application layout */}
          <Flex
            direction={{ base: 'column', md: 'row' }}
            minH="100vh"
            bg="var(--light-gray-bg)"
          >
            {/* Mobile Header (visible only on mobile, positioned at the top of the column) */}
            <Flex
              // Hide mobile header on customer menu page
              display={{ base: isCustomerMenuPage ? 'none' : 'flex', md: 'none' }}
              p={4}
              bg="var(--navbar-bg)"
              color="var(--navbar-main-item-inactive-text)"
              justify="space-between"
              align="center"
              shadow="md"
              width="full"
              position="fixed"
              zIndex={40}
            >
              <Heading as="h2" size="xl" color="var(--navbar-heading-color)">
                Resto Admin
              </Heading>
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                p={2}
                rounded="md"
                _focus={{ outline: 'none', ring: 2, ringColor: 'var(--primary-green)' }}
                bg="transparent"
                _hover={{ bg: 'var(--navbar-main-item-hover-bg)' }}
                color="var(--navbar-main-item-inactive-text)"
              >
                <Menu size={24} />
              </Button>
            </Flex>

            {/* Sidebar (now fixed on all screen sizes) */}
            <Box
              // Hide sidebar completely on customer menu page for desktop, and control mobile view
              position="fixed"
              insetY={0}
              left={0}
              zIndex={50}
              w={{ base: '64', md: isCustomerMenuPage ? '0' : '64' }} // Width 0 on customer menu for desktop
              bg="var(--navbar-bg)"
              // Slide out animation for mobile, but always hidden on desktop for customer menu
              transform={{
                base: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                md: isCustomerMenuPage ? 'translateX(-100%)' : 'translateX(0)',
              }}
              transition="transform 0.3s ease-in-out"
              shadow={{ base: 'lg', md: isCustomerMenuPage ? 'none' : 'none' }}
              // Set height to full viewport height and keep internal scrolling
              h="100vh"
              overflowY="auto"
              // Hide content and padding on customer menu page
              p={isCustomerMenuPage ? 0 : undefined} // Remove padding when hidden
            >
              {!isCustomerMenuPage && <Navbar />} {/* Only render Navbar if not customer menu page */}
            </Box>

            {/* Overlay for mobile when sidebar is open */}
            {sidebarOpen && !isCustomerMenuPage && ( // Also hide overlay on customer menu page
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
              // Adjust margin left for desktop when sidebar is hidden
              ml={{ base: 0, md: isCustomerMenuPage ? '0' : '64' }}
              flex={1} // Takes up remaining space in the flex container
              p={{ base: 4, md: 6 }}
              overflowY="auto" // Enable scrolling ONLY for the main content area
              // On mobile, padding-top accounts for the header, remove it for customer menu
              pt={{ base: isCustomerMenuPage ? 0 : '60px', md: isCustomerMenuPage ? 0 : 6 }}
            >
              {/* Notifications Display */}
              <VStack spacing={3} position="sticky" top="10px" zIndex={30} width="full">
                {notifications.map((notification) => (
                  <Alert
                    key={notification.id}
                    status={notification.type}
                    variant="left-accent"
                    rounded="md"
                    shadow="md"
                    width="full"
                    maxWidth="600px" // Limit width for better appearance
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
          </Flex>
        </ChakraProvider>
      </body>
    </html>
  );
}