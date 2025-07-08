/* src/app/page.tsx */
'use client'; // This directive is crucial for using client-side hooks like useState and needs to be client-side

import React from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  Flex,
  Spacer,
  Button,
  Icon,
  Avatar,
  VStack,
  HStack,
  Progress, // Though not used in the provided snippet, kept for completeness if needed
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
      rating: 4.5,
      avatar: 'https://placehold.co/100x100/E0E0E0/000000?text=JJ',
    },
    {
      name: 'Michael Scott',
      role: 'Manager | All shifts',
      status: 'Off Shift',
      rating: 3.8,
      avatar: 'https://placehold.co/100x100/E0E0E0/000000?text=MS',
    },
    {
      name: 'Pam Beesly',
      role: 'Hostess | Morning shift',
      status: 'On Shift',
      rating: 4.2,
      avatar: 'https://placehold.co/100x100/E0E0E0/000000?text=PB',
    },
  ];

  const reviews = [
    {
      platform: 'Facebook',
      icon: FaFacebook,
      user: 'John Doe',
      avatar: 'https://placehold.co/100x100/E0E0E0/000000?text=JD',
      rating: 5,
      reviewText: 'Great food and service!',
    },
    {
      platform: 'Yelp',
      icon: FaYelp,
      user: 'Jane Smith',
      avatar: 'https://placehold.co/100x100/E0E0E0/000000?text=JS',
      rating: 4,
      reviewText: 'Good experience overall, a bit slow on service.',
    },
  ];

  return (
    <Box p={8} bg="var(--light-gray-bg)" minH="100vh"> {/* Using light-gray-bg for the overall page background */}
      <Heading as="h1" size="xl" mb={6} color="var(--text-color-dark)" className="font-semibold">
        Resto Admin Dashboard
      </Heading>

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {summaryData.map((item, index) => (
          <Card key={index} p={6} rounded="lg" shadow="md" bg="var(--background-color-light)"> {/* Card background to white */}
            <Flex align="center" mb={4}>
              <Text fontSize="lg" fontWeight="medium" color="var(--medium-gray-text)"> {/* Medium gray for titles */}
                {item.title}
              </Text>
              <Spacer />
              {item.change === 'up' && <Icon as={ChevronUpIcon} w={6} h={6} color="var(--primary-green)" />} {/* Green for 'up' */}
              {item.change === 'down' && <Icon as={ChevronDownIcon} w={6} h={6} color="red.500" />} {/* Red for 'down' (can be customized) */}
            </Flex>
            <Text textAlign="center" fontSize="3xl" fontWeight="bold" color="var(--text-color-dark)">
              {item.value}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Crew Members Section */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4} color="var(--dark-gray-text)" className="font-semibold">
          Crew Members
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {crewMembers.map((member, index) => (
            <Card key={index} p={6} rounded="lg" shadow="md" bg="var(--background-color-light)">
              <Flex align="center">
                <Avatar src={member.avatar} name={member.name} size="lg" mr={4} />
                <Box>
                  <Text fontWeight="semibold" fontSize="lg" color="var(--text-color-dark)">
                    {member.name}
                  </Text>
                  <Text fontSize="sm" color="var(--medium-gray-text)">
                    {member.role}
                  </Text>
                  <Text fontSize="sm" color={member.status === 'On Shift' ? 'var(--primary-green)' : 'red.500'}>
                    {member.status}
                  </Text>
                </Box>
                <Spacer />
                <VStack spacing={0.5}>
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      as={StarIcon}
                      color={i < Math.floor(member.rating) ? 'yellow.400' : 'gray.300'} // Keeping yellow for stars for contrast
                      w={4}
                      h={4}
                    />
                  ))}
                  <Text fontSize="sm" color="var(--medium-gray-text)">
                    {member.rating.toFixed(1)}
                  </Text>
                </VStack>
              </Flex>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {/* Sales and Revenue Section */}
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4} color="var(--dark-gray-text)" className="font-semibold">
          Sales & Revenue
        </Heading>
        <Card p={6} rounded="lg" shadow="md" bg="var(--background-color-light)">
          <Text fontSize="lg" fontWeight="medium" color="var(--medium-gray-text)" mb={2}>
            Total Revenue
          </Text>
          <Text textAlign="center" fontSize="3xl" fontWeight="bold" color="var(--text-color-dark)">
            $134,100
          </Text>
        </Card>
      </Box>

      {/* Review Sections */}
      {reviews.map((review, index) => (
        <Card key={index} p={6} rounded="lg" shadow="md" mb={6} bg="var(--background-color-light)">
          <Flex align="center" mb={4}>
            <Icon as={review.icon} w={6} h={6} color="var(--primary-green)" mr={2} /> {/* Green for platform icons */}
            <Heading as="h3" size="md" color="var(--dark-gray-text)" className="font-medium">
              {review.platform} Review
            </Heading>
            <Spacer />
            <Button variant="link" color="var(--primary-green)" size="sm" className="font-medium"> {/* Green link button */}
              Read review
            </Button>
          </Flex>
          <Flex align="center">
            <Avatar src={review.avatar} name={review.user} size="md" mr={4} />
            <Box>
              <Text fontWeight="semibold" color="var(--text-color-dark)">{review.user}</Text>
              <HStack spacing={0.5}>
                {[...Array(5)].map((_, i) => (
                  <Icon
                    key={i}
                    as={StarIcon}
                    color={i < review.rating ? 'yellow.400' : 'gray.300'} // Keeping yellow for stars for contrast
                    w={4}
                    h={4}
                  />
                ))}
              </HStack>
            </Box>
          </Flex>
        </Card>
      ))}
    </Box>
  );
}
