// src/components/pos/POSHeader.tsx - CORRECTED
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
  Image as ChakraImage,
} from "@chakra-ui/react";
import { FiChevronDown, FiMenu } from "react-icons/fi";
import { usePOSStore } from "../../lib/usePOSStore";
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
      bg="white"
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent="space-between"
      {...rest}
    >
      {/* Container for the menu icon on mobile */}
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      {/* Main content area */}
      <Flex
        flex="1"
        alignItems="center"
        justifyContent={{ base: "center", md: "flex-start" }}
      >
        <ChakraImage
          src="/c2.png"
          alt="Carte Logo"
          width="auto"
          height="20px"
          objectFit="contain"
        />
        <Flex
          alignItems="center"
          justifyContent="flex-start"
          ml={4}
          display={{ base: "none", md: "flex" }}
        >
          <Text fontSize="xl" fontWeight="bold" color="var(--primary-green)">
            {displayStoreName()}
          </Text>
        </Flex>
      </Flex>

      <HStack
        spacing={{ base: "0", md: "6" }}
        display={{ base: "flex", md: "flex" }}
      >
        <Menu>
          <MenuButton
            py={2}
            transition="all 0.3s"
            _focus={{ boxShadow: "none" }}
          >
            <HStack>
              <Avatar size={"sm"} src={"/pic.png"} />
              <VStack
                display={{ base: "none", md: "flex" }}
                alignItems="flex-start"
                spacing="1px"
                ml="2"
              >
                <Text fontSize="sm" color="#333">
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
            <MenuItem onClick={handleLogout}>Sign out</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};