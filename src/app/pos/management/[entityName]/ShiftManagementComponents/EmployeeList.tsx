// src/app/pos/management/[entityName]/ShiftManagementComponents/EmployeeList.tsx

"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Heading,
  VStack,
  Text,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Collapse,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import {
  SearchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { Employee } from "../ShiftManagement";
import { generateRoleColors, getChakraColorScheme } from "./roleColors";

interface EmployeeListProps {
  employees: Employee[];
  onEmployeeClick: (employee: Employee) => void;
}

const EmployeeListItem: React.FC<{
  employee: Employee;
  onClick: (employee: Employee) => void;
  roleColors: Record<string, string>;
}> = ({ employee, onClick, roleColors }) => {
  const roleColor = roleColors[employee.role] || roleColors.default;
  const colorScheme = getChakraColorScheme(roleColor);

  return (
    <Box
      p={2}
      borderWidth="1px"
      borderRadius="lg"
      cursor="pointer"
      bg="white"
      mb={2}
      boxShadow="sm"
      _hover={{ bg: "gray.50" }}
      onClick={() => onClick(employee)}
    >
      <Text fontWeight="bold" fontSize="sm">
        {employee.name}
      </Text>
      <Badge colorScheme={colorScheme} fontSize="xs">
        {employee.role || "No Role"}
      </Badge>
      <Text fontSize="xs" color="gray.500" mt={1}>
        ID: {employee.id}
      </Text>
    </Box>
  );
};

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onEmployeeClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedRoles, setCollapsedRoles] = useState<Record<string, boolean>>(
    {}
  );

  // Generate consistent role colors
  const roleColors = useMemo(() => generateRoleColors(employees), [employees]);

  // Initialize all roles as collapsed by default when employees change
  useEffect(() => {
    if (employees && Array.isArray(employees)) {
      const uniqueRoles = Array.from(
        new Set(employees.map((emp) => emp.role || "Other").filter(Boolean))
      );

      const initialCollapsedState: Record<string, boolean> = {};
      uniqueRoles.forEach((role) => {
        initialCollapsedState[role] = true; // All roles collapsed by default
      });

      setCollapsedRoles(initialCollapsedState);
    }
  }, [employees]);

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return [];
    if (!searchTerm.trim()) return employees;

    return employees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Group filtered employees by role
  const groups = useMemo(() => {
    return filteredEmployees.reduce<Record<string, Employee[]>>((acc, e) => {
      const role = e.role || "Other";
      if (!acc[role]) acc[role] = [];
      acc[role].push(e);
      return acc;
    }, {});
  }, [filteredEmployees]);

  // Toggle role collapse state
  const toggleRoleCollapse = (role: string) => {
    setCollapsedRoles((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  // Add null/undefined check
  if (!employees || !Array.isArray(employees)) {
    return (
      <Box width="100%" display="flex" flexDirection="column" height="100%">
        <Heading size="sm" mb={3}>
          Employees
        </Heading>
        <Text fontSize="sm">No employees available</Text>
      </Box>
    );
  }

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      height="100%"
      overflow="hidden"
    >
      <Heading size="sm" mb={3}>
        Employees ({filteredEmployees.length})
      </Heading>

      {/* Search Input */}
      <InputGroup mb={4} size="sm">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          bg="white"
        />
      </InputGroup>

      <VStack
        align="stretch"
        spacing={2}
        flex="1"
        overflowY="auto"
        minHeight="0"
        css={{
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#c1c1c1",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#a8a8a8",
          },
        }}
      >
        {Object.keys(groups).map((role) => {
          const isCollapsed = collapsedRoles[role] !== false; // Default to true
          const roleColor = roleColors[role] || roleColors.default;
          const colorScheme = getChakraColorScheme(roleColor);

          return (
            <Box key={role}>
              <HStack
                spacing={2}
                cursor="pointer"
                onClick={() => toggleRoleCollapse(role)}
                _hover={{ bg: "gray.50" }}
                p={1}
                borderRadius="md"
              >
                <IconButton
                  aria-label={isCollapsed ? "Expand" : "Collapse"}
                  icon={
                    isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />
                  }
                  size="xs"
                  variant="ghost"
                />
                <Badge colorScheme={colorScheme} fontSize="xs" flex="1">
                  {role} ({groups[role].length})
                </Badge>
              </HStack>

              <Collapse in={!isCollapsed} animateOpacity>
                <Box ml={6} mt={1}>
                  {groups[role].map((emp) => (
                    <EmployeeListItem
                      key={emp.id}
                      employee={emp}
                      onClick={onEmployeeClick}
                      roleColors={roleColors}
                    />
                  ))}
                </Box>
              </Collapse>
            </Box>
          );
        })}

        {Object.keys(groups).length === 0 && searchTerm && (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            No employees found matching "{searchTerm}"
          </Text>
        )}

        {Object.keys(groups).length === 0 && !searchTerm && (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            No employees available
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default EmployeeList;
