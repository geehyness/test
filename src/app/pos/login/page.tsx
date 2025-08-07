// src/app/pos/login/page.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  Image as ChakraImage,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '../lib/usePOSStore';
import { loginEmployee } from '@/app/lib/api';

export default function POSLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const { loginStaff } = usePOSStore();

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
      const employee = await loginEmployee(email, password);

      // Await the state update from Zustand before proceeding
      await loginStaff(employee);

      // The redirection is now handled by the POSLayout component,
      // which listens for the currentStaff state change.
      // We no longer need to get the state here or push to a specific route.

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
                  focusBorderColor="var(--primary-green)"
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
                  focusBorderColor="var(--primary-green)"
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
