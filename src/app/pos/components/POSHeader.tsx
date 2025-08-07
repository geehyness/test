// src/app/pos/components/POSHeader.tsx
"use client";

import {
  Avatar,
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiChevronDown, FiMenu } from "react-icons/fi";
import { usePOSStore } from "../lib/usePOSStore";
import { useRouter } from "next/navigation";

interface POSHeaderProps {
  onOpen: () => void;
  [key: string]: any;
}

export const POSHeader = ({ onOpen, ...rest }: POSHeaderProps) => {
  // Corrected: Destructure _hasHydrated from the store
  const { currentStaff, logoutStaff, _hasHydrated } = usePOSStore();
  const router = useRouter();

  const handleLogout = () => {
    logoutStaff();
    router.push("/");
  };

  const displayStoreName = () => {
    // Show 'Loading...' only until hydration is complete
    if (!_hasHydrated) {
      return "Loading...";
    }
    // After hydration, display the storeName or 'Unknown Store'
    return currentStaff?.storeName ?? "Unknown Store";
  };

  return (
    <Flex
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <Flex
        alignItems="center"
        justifyContent="flex-start"
        flex="1"
        display={{ base: "none", md: "flex" }}
      >
        <Text fontSize="xl" fontWeight="bold" color="var(--primary-green)">
          {displayStoreName()}
        </Text>
      </Flex>

      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <HStack spacing={{ base: "0", md: "6" }}>
        <Menu>
          <MenuButton
            py={2}
            transition="all 0.3s"
            _focus={{ boxShadow: "none" }}
          >
            <HStack>
              <Avatar
                size={"sm"}
                src={
                  "https://images.unsplash.com/photo-1619946794135-5bc917a0f0dc?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=359&q=80"
                }
              />
              <VStack
                display={{ base: "none", md: "flex" }}
                alignItems="flex-start"
                spacing="1px"
                ml="2"
              >
                <Text fontSize="sm">
                  {currentStaff ? currentStaff.first_name : "Loading..."}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  {currentStaff?.mainAccessRole?.name || "No Role"}
                </Text>
              </VStack>
              <Box display={{ base: "none", md: "flex" }}>
                <FiChevronDown />
              </Box>
            </HStack>
          </MenuButton>
          <MenuList
            bg={useColorModeValue("white", "gray.900")}
            borderColor={useColorModeValue("gray.200", "gray.700")}
          >
            <MenuItem>Profile</MenuItem>
            <MenuItem>Settings</MenuItem>
            <MenuItem>Billing</MenuItem>
            <MenuDivider />
            <MenuItem onClick={handleLogout}>Sign out</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};