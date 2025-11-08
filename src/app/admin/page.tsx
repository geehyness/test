// src/app/admin/page.tsx
'use client';

import React from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  // FIX: Import Card and its parts
  Card,
  CardBody,
  Flex,
  Spacer,
  Button,
  Icon,
  // FIX: Import Avatar
  Avatar,
  VStack,
  HStack,
  // FIX: Import Stat and its parts
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, StarIcon } from '@chakra-ui/icons';
import { FaFacebook, FaYelp } from 'react-icons/fa';

export default function AdminDashboard() {
  // Mock data for the dashboard to match the image
  const summaryData = [
    {
      title: 'Total Tenants',
      value: '12',
      change: 'up',
      icon: ChevronUpIcon,
    },
    {
      title: 'Total Revenue',
      value: 'R 1.2M',
      change: 'up',
      icon: ChevronUpIcon,
    },
    {
      title: 'Avg. Tenant Revenue',
      value: 'R 100k',
      change: 'down',
      icon: ChevronDownIcon,
    },
    {
      title: 'New Tenants (Month)',
      value: '2',
      change: 'up',
      icon: ChevronUpIcon,
    },
  ];

  const recentTenants = [
    { name: 'The Burger Joint', plan: 'Pro', joined: '2 days ago', avatar: '🍔' },
    { name: 'Sushi Palace', plan: 'Standard', joined: '1 week ago', avatar: '🍣' },
    { name: 'Cafe Central', plan: 'Pro', joined: '3 weeks ago', avatar: '☕' },
  ];

  return (
    <Box p={{ base: 0, md: 8 }} bg="var(--light-gray-bg)" minH="100vh">
      <Heading as="h1" size="xl" mb={6} color="var(--text-color-dark)">
        Admin Dashboard
      </Heading>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>
        {summaryData.map((item, index) => (
          <Card key={index} p={6} rounded="lg" shadow="md" bg="white">
            <CardBody>
              <Flex align="center" mb={4}>
                <Text fontSize="md" fontWeight="medium" color="gray.500">
                  {item.title}
                </Text>
                <Spacer />
                {item.change === 'up' && <Icon as={ChevronUpIcon} w={6} h={6} color="green.500" />}
                {item.change === 'down' && <Icon as={ChevronDownIcon} w={6} h={6} color="red.500" />}
              </Flex>
              <Text textAlign="center" fontSize="3xl" fontWeight="bold" color="var(--text-color-dark)">
                {item.value}
              </Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4} color="var(--dark-gray-text)">
          Recent Tenants
        </Heading>
        <VStack spacing={4} align="stretch">
          {recentTenants.map((tenant, index) => (
            <Card key={index} p={4} rounded="lg" shadow="md" bg="white">
              <CardBody>
                <Flex align="center">
                  <Avatar bg="gray.200" name={tenant.name} mr={4} getInitials={() => tenant.avatar} />
                  <Box>
                    <Text fontWeight="semibold" fontSize="lg" color="var(--text-color-dark)">
                      {tenant.name}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Plan: {tenant.plan}
                    </Text>
                  </Box>
                  <Spacer />
                  <Text fontSize="sm" color="gray.500">
                    {tenant.joined}
                  </Text>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </VStack>
      </Box>

      {/* Placeholder for future reports/analytics */}
      <Box>
        <Heading as="h2" size="lg" mb={4} color="var(--dark-gray-text)">
          Platform Analytics
        </Heading>
        <Card p={6} rounded="lg" shadow="md" bg="white">
          <CardBody>
            <Text fontSize="lg" fontWeight="medium" color="gray.500" mb={2}>
              More detailed charts and reports coming soon.
            </Text>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
}