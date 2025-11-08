// src/app/pos/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Button,
  Heading,
  Text,
  Image as ChakraImage,
  VStack,
  Input,
  FormControl,
  FormLabel,
  useToast,
  StackProps
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '../../../lib/usePOSStore';
import { loginEmployee } from '@/lib/api';

export default function POSLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const { loginStaff, currentStaff, _hasHydrated } = usePOSStore();

  // This effect handles users who are already logged in and land on this page.
  useEffect(() => {
    if (_hasHydrated && currentStaff?.mainAccessRole?.landing_page) {
      router.replace(currentStaff.mainAccessRole.landing_page);
    }
  }, [_hasHydrated, currentStaff, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Input validation
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Login Error',
        description: 'Please enter both email and password.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', { email });
      const employee = await loginEmployee(email, password);
      console.log('Login successful, employee data received:', employee);

      const staffWithRoles = await loginStaff(employee);

      if (staffWithRoles?.mainAccessRole?.landing_page) {
        router.replace(staffWithRoles.mainAccessRole.landing_page);
      } else {
        // Fallback redirection if landing_page is not defined
        toast({
          title: 'Configuration Warning',
          description: 'No landing page set for your role. Redirecting to dashboard.',
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
        router.replace('/pos/dashboard');
      }

    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: 'Login failed.',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="var(--background-color)"
    >
      <Box
        p={8}
        maxWidth="500px"
        width="full"
        bg="var(--background-color-light)"
        borderRadius="md"
        shadow="lg"
      >
        <VStack spacing={6} align="center">
          <ChakraImage
            src="https://placehold.co/150x150/2f4f4f/ffffff?text=POS+Logo"
            alt="POS System Logo"
            borderRadius="full"
            boxSize="150px"
            objectFit="cover"
            mb={4}
          />
          <Heading as="h1" size="xl" color="var(--primary-green)">
            Point of Sale
          </Heading>
          <Text fontSize="md" color="var(--dark-gray-text)">
            Staff Login
          </Text>

          <Box as="form" onSubmit={handleLogin} width="full">
            <VStack spacing={4}>
              <FormControl id="email" isRequired>
                <FormLabel color="var(--dark-gray-text)">Email address</FormLabel>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="lg"
                  rounded="md"
                  borderColor="var(--border-color)"
                  _focus={{ borderColor: "var(--primary-green)"}}
                  color="var(--dark-gray-text)"
                  autoComplete="username"
                />
              </FormControl>

              <FormControl id="password" isRequired>
                <FormLabel color="var(--dark-gray-text)">Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="lg"
                  rounded="md"
                  borderColor="var(--border-color)"
                  _focus={{ borderColor: "var(--primary-green)"}}
                  color="var(--dark-gray-text)"
                  autoComplete="current-password"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                width="full"
                mt={4}
                isLoading={isLoading}
                loadingText="Logging In..."
                bg="var(--primary-green)"
                color="white"
                _hover={{ bg: '#2a6b45' }} // Darker shade for hover
                rounded="md"
              >
                Log In
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
}