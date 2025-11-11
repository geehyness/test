// src/app/pos/management/[entityName]/ShiftManagementComponents/roleColors.ts
import { Employee } from '../ShiftManagement';

// Generate consistent colors based on role names
export const generateRoleColors = (employees: Employee[]): Record<string, string> => {
  const roleColors: Record<string, string> = {
    default: "#718096", // Gray for unknown roles
  };

  // Get all unique roles from employees
  const uniqueRoles = Array.from(
    new Set(employees.map((emp) => emp.role).filter(Boolean))
  );

  // Predefined color palette for common roles
  const colorPalette = [
    "#3182CE", // Blue
    "#38A169", // Green
    "#E53E3E", // Red
    "#D69E2E", // Yellow
    "#805AD5", // Purple
    "#DD6B20", // Orange
    "#319795", // Teal
    "#D53F8C", // Pink
    "#4A5568", // Gray blue
    "#0BC5EA", // Cyan
  ];

  // Assign colors to roles
  uniqueRoles.sort().forEach((role, index) => {
    if (role) {
      roleColors[role] = colorPalette[index % colorPalette.length];
    }
  });

  return roleColors;
};

// Get color based on employee role
export const getRoleColor = (
  roleColors: Record<string, string>,
  role?: string
): string => {
  if (!role) return roleColors.default;
  return roleColors[role] || roleColors.default;
};

// Convert hex color to Chakra UI color scheme
export const getChakraColorScheme = (hexColor: string): string => {
  const colorMap: Record<string, string> = {
    "#3182CE": "blue",
    "#38A169": "green", 
    "#E53E3E": "red",
    "#D69E2E": "yellow",
    "#805AD5": "purple",
    "#DD6B20": "orange",
    "#319795": "teal",
    "#D53F8C": "pink",
    "#4A5568": "gray",
    "#0BC5EA": "cyan",
    "#718096": "gray",
  };
  
  return colorMap[hexColor] || "gray";
};