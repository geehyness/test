'use client';

import React from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Spacer,
  Button,
  Icon,
  Avatar,
  VStack,
  HStack,
  Progress,
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, StarIcon } from '@chakra-ui/icons'; // Chakra UI icons
import { FaFacebook, FaYelp } from 'react-icons/fa'; 

export default function Home() {
  // Mock data for the dashboard to match the image
  const summaryData = [
    {
      title: 'Takings',
      value: 'R 6,280',
      change: 'up', // 'up' or 'down'
      icon: ChevronUpIcon, // Chakra Icon
    },
    {
      title: 'Guests Goal',
      value: '131 | 170',
      change: 'none', // No specific icon for goal
      icon: null,
    },
    {
      title: 'Avg. Waiting Time',
      value: '22 min',
      change: 'up',
      icon: ChevronUpIcon,
    },
    {
      title: 'Customer Satisfaction',
      value: '4.00',
      change: 'up',
      icon: ChevronUpIcon,
    },
  ];

  const crewMembers = [
    {
      name: 'Jessica Jones',
      role: 'Waitress | Afternoon shift',
      status: 'On Shift',
      rating: 4.4,
      avatar: 'https://placehold.co/40x40/FF66B2/FFFFFF?text=JJ', // Placeholder image
    },
    {
      name: 'Loui Fermagerie',
      role: 'Waiter | Morning shift',
      status: 'Shift finished',
      rating: 3.7,
      avatar: 'https://placehold.co/40x40/66B2FF/FFFFFF?text=LF', // Placeholder image
    },
    // Add more mock crew members if needed
  ];

  const dailyActivityData = [
    { hour: '11', value: 30 },
    { hour: '12', value: 80 },
    { hour: '13', value: 50 },
    { hour: '14', value: 120 },
    { hour: '15', value: 70 },
    { hour: '16', value: 100 },
    { hour: '17', value: 150 },
    { hour: '18', value: 90 },
    { hour: '19', value: 180 }, // Peak
    { hour: '20', value: 130 },
    { hour: '21', value: 160 },
    { hour: '22', value: 110 },
  ];

  const reviews = [
    {
      platform: 'Facebook',
      user: 'Jessica Jones',
      avatar: 'https://placehold.co/40x40/FF66B2/FFFFFF?text=JJ',
      rating: 5,
      icon: FaFacebook,
    },
    {
      platform: 'Yelp',
      user: 'James Prince',
      avatar: 'https://placehold.co/40x40/66B2FF/FFFFFF?text=JP',
      rating: 4,
      icon: FaYelp,
    },
  ];


  return (
    <Box p={8} bg="gray.100" minH="100vh">
      {/* Header Section */}
      <Flex align="center" mb={8}>
        <Heading as="h1" size="xl" color="gray.800">
          Overview - Restaurant &quot;Soul&quot;
        </Heading>
        <Spacer />
        <Text fontSize="lg" color="gray.600" mr={4}>
          20.08.2018
        </Text>
        <Button colorScheme="blue" size="lg">
          Upgrade
        </Button>
      </Flex>

      {/* Summary Cards Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
        {summaryData.map((item, index) => (
          <Card key={index} p={6} rounded="lg" shadow="md" _hover={{ shadow: 'lg' }} transition="all 0.3s ease-in-out">
            <Flex align="center" mb={2}>
              <Text fontSize="md" color="gray.600" fontWeight="semibold">
                {item.title}
              </Text>
              {item.change === 'up' && <Icon as={ChevronUpIcon} color="green.500" ml={2} />}
              {item.change === 'down' && <Icon as={ChevronDownIcon} color="red.500" ml={2} />}
            </Flex>
            <Text fontSize="3xl" fontWeight="bold" color="gray.800">
              {item.value}
            </Text>
            {/* For Guests Goal, add a simple progress bar simulation */}
            {item.title === 'Guests Goal' && (
              <Progress value={(131 / 170) * 100} size="xs" colorScheme="blue" mt={2} rounded="full" />
            )}
          </Card>
        ))}
      </SimpleGrid>

      {/* Main Content Grid (Crew, Daily Activity, Monthly Takings, Reviews) */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Left Column */}
        <VStack spacing={6} align="stretch">
          {/* Crew Section */}
          <Card p={6} rounded="lg" shadow="md">
            <Flex align="center" mb={4}>
              <Heading as="h3" size="md" color="gray.700">
                Crew 20.08.2018
              </Heading>
              <Spacer />
              <Button variant="link" colorScheme="blue" size="sm">
                See more
              </Button>
            </Flex>
            <VStack align="stretch" spacing={4}>
              {crewMembers.map((member, index) => (
                <Flex key={index} align="center" pb={2} borderBottom={index < crewMembers.length - 1 ? '1px solid' : 'none'} borderColor="gray.100">
                  <Avatar src={member.avatar} name={member.name} size="md" mr={4} />
                  <Box>
                    <Text fontWeight="semibold" color="gray.800">{member.name}</Text>
                    <Text fontSize="sm" color="gray.500">{member.role}</Text>
                  </Box>
                  <Spacer />
                  <Text fontSize="sm" color="gray.600" mr={2}>{member.status}</Text>
                  <Text fontSize="sm" color="gray.600">{member.rating}</Text>
                </Flex>
              ))}
            </VStack>
          </Card>

          {/* Daily Activity Chart */}
          <Card p={6} rounded="lg" shadow="md">
            <Flex align="center" mb={4}>
              <Heading as="h3" size="md" color="gray.700">
                Daily Activity
              </Heading>
              <Text fontSize="sm" color="gray.500" ml={2}>
                Number of guests / hour
              </Text>
              <Spacer />
              <Text fontSize="sm" color="blue.500">
                11:00 - 22:00
              </Text>
            </Flex>
            <Box height="150px" width="full" display="flex" alignItems="flex-end" justifyContent="space-around">
              {dailyActivityData.map((data, index) => (
                <VStack key={index} spacing={1} flex="1" mx={0.5}>
                  <Box
                    height={`${data.value * 0.8}px`} // Scale height for visual representation
                    width="80%"
                    bg="blue.300"
                    rounded="sm"
                    _hover={{ bg: 'blue.400' }}
                    transition="background-color 0.2s ease-in-out"
                  />
                  <Text fontSize="xs" color="gray.500">{data.hour}</Text>
                </VStack>
              ))}
            </Box>
          </Card>
        </VStack>

        {/* Right Column */}
        <VStack spacing={6} align="stretch">
          {/* Monthly Takings Chart */}
          <Card p={6} rounded="lg" shadow="md">
            <Flex align="center" mb={4}>
              <Heading as="h3" size="md" color="gray.700">
                Monthly Takings
              </Heading>
              <Spacer />
              <Button variant="outline" size="sm" rightIcon={<ChevronDownIcon />}>
                August
              </Button>
            </Flex>
            {/* Simple Line Chart Simulation */}
            <Box height="150px" width="full" position="relative">
              <Box
                position="absolute"
                left="0"
                right="0"
                bottom="0"
                top="0"
                bg="linear-gradient(to top, rgba(66, 153, 225, 0.1) 0%, transparent 100%)"
                rounded="md"
              />
              <Box
                position="absolute"
                left="0"
                right="0"
                bottom="0"
                height="2px"
                bg="blue.400"
                transform="rotateX(180deg)"
                transformOrigin="bottom"
                style={{
                  clipPath: 'polygon(0% 100%, 10% 20%, 20% 80%, 30% 40%, 40% 90%, 50% 10%, 60% 70%, 70% 30%, 80% 60%, 90% 0%, 100% 100%)',
                }}
              />
              <Text position="absolute" top="10%" left="10%" fontSize="sm" fontWeight="bold" color="blue.500">
                $6,280
              </Text>
              <Text position="absolute" bottom="10%" left="30%" fontSize="sm" color="gray.500">
                16.08
              </Text>
            </Box>
            <Text textAlign="center" fontSize="sm" color="gray.600" mt={4}>
              TOTAL:
            </Text>
            <Text textAlign="center" fontSize="3xl" fontWeight="bold" color="gray.800">
              $134,100
            </Text>
          </Card>

          {/* Review Sections */}
          {reviews.map((review, index) => (
            <Card key={index} p={6} rounded="lg" shadow="md">
              <Flex align="center" mb={4}>
                <Icon as={review.icon} w={6} h={6} color="blue.500" mr={2} />
                <Heading as="h3" size="md" color="gray.700">
                  {review.platform} Review
                </Heading>
                <Spacer />
                <Button variant="link" colorScheme="blue" size="sm">
                  Read review
                </Button>
              </Flex>
              <Flex align="center">
                <Avatar src={review.avatar} name={review.user} size="md" mr={4} />
                <Box>
                  <Text fontWeight="semibold" color="gray.800">{review.user}</Text>
                  <HStack spacing={0.5}>
                    {[...Array(5)].map((_, i) => (
                      <Icon
                        key={i}
                        as={StarIcon}
                        color={i < review.rating ? 'yellow.400' : 'gray.300'}
                        w={4}
                        h={4}
                      />
                    ))}
                  </HStack>
                </Box>
              </Flex>
            </Card>
          ))}
        </VStack>
      </SimpleGrid>
    </Box>
  );
}