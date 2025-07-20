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
  useToast // For notifications
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
// import { loginStaff } from '@/app/lib/api'; // Assuming you'll have an API function for login

export default function POSLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic client-side validation for demonstration
    if (!username || !password) {
      toast({
        title: 'Login Error',
        description: 'Please enter both username and password.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      // Replace with actual API call to your backend
      // const response = await loginStaff({ username, password });
      // if (response.success) {

      // Mock login for now
      if (username === 'staff' && password === 'password') {
        toast({
          title: 'Login Successful',
          description: 'Redirecting to POS Dashboard...',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        // Simulate a delay for async operation
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push('/pos/dashboard'); // Redirect to the main POS dashboard
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred during login.',
        status: 'error',
        duration: 3000,
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
      bg="var(--light-gray-bg)"
      backgroundImage="url('/login.jpg')" /* Assuming this is a background image for the login page */
      backgroundSize="cover"
      backgroundPosition="center"
    >
      <Box
        p={8}
        maxWidth="md"
        borderWidth="1px"
        borderRadius="lg"
        shadow="xl"
        bg="var(--background-color-light)"
        textAlign="center"
        py={10}
        px={8}
      >
        <VStack spacing={6}>
          <ChakraImage
            src="/c2.png" /* Your restaurant logo */
            alt="Restaurant Logo"
            width="100px"
            height="auto"
            objectFit="contain"
            mx="auto"
          />
          <Heading as="h2" size="xl" color="var(--primary-green)" fontFamily="var(--font-lexend-deca)">
            POS Login
          </Heading>
          <Text color="var(--dark-gray-text)">
            Enter your credentials to access the Point of Sale.
          </Text>

          <Box as="form" onSubmit={handleLogin} width="100%">
            <VStack spacing={4}>
              <FormControl id="username">
                <FormLabel color="var(--dark-gray-text)">Username</FormLabel>
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  size="lg"
                  rounded="md"
                  borderColor="var(--border-color)"
                  focusBorderColor="var(--primary-green)"
                  color="var(--dark-gray-text)"
                />
              </FormControl>

              <FormControl id="password">
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
                _hover={{ bg: 'darken(var(--primary-green), 10%)' }} /* Adjust hover color */
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