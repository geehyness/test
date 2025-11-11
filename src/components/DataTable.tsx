/* src/app/components/DataTable.tsx */
'use client';
import React, { useState, useMemo, ChangeEvent } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Input,
  Flex,
  Button,
  Text,
  IconButton,
  HStack,
  Select,
  chakra,
  Badge,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FaEdit, FaTrash } from 'react-icons/fa';

// Enhanced Column interface with backward compatibility
interface Column {
  accessorKey: string;
  header: string | React.ReactNode;
  cell?: (row: any) => React.ReactNode;
  isSortable?: boolean;
  width?: string; // New: column width control
}

// Enhanced props interface with backward compatibility
interface EnhancedDataTableProps {
  columns: Column[];
  data: any[];
  // Enhanced features (optional for backward compatibility)
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  // Original props maintained for backward compatibility
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export default function DataTable({
  columns,
  data,
  // Enhanced features
  onEdit,
  onDelete,
  isLoading = false,
  // Optional controlled search (for backward compatibility)
  searchTerm: externalSearchTerm,
  onSearchChange,
}: EnhancedDataTableProps) {
  // State management (use internal state if not controlled)
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Use controlled search if provided, otherwise use internal state
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchTerm(value);
    }
    setCurrentPage(1);
  };

  // Enhanced cell rendering function
  const renderCell = (row: any, column: Column) => {
    // Use custom cell renderer if provided
    if (column.cell) {
      return column.cell(row);
    }

    const value = row[column.accessorKey];

    // Enhanced data type handling
    if (typeof value === 'boolean') {
      return (
        <Badge colorScheme={value ? 'green' : 'red'} size="sm">
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    // Handle date strings
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }

    // Handle null/undefined
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  };

  // Memoize filtered and sorted data for performance
  const processedData = useMemo(() => {
    if (isLoading) return [];

    // 1. Filter Data
    const filtered = data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // 2. Sort Data
    if (sortColumn && sortDirection) {
      return [...filtered].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Handle null/undefined values by placing them at the end
        if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

        // Numeric comparison
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // String comparison (case-insensitive)
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, isLoading]);

  // Calculate pagination details
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleSort = (accessorKey: string) => {
    if (sortColumn === accessorKey) {
      setSortDirection((prev) => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return null;
        return 'asc';
      });
    } else {
      setSortColumn(accessorKey);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Enhanced styling with color mode support
  const borderColor = useColorModeValue('var(--border-color)', 'gray.600');
  const bgColor = useColorModeValue('var(--light-gray-bg)', 'gray.700');
  const hoverBgColor = useColorModeValue('var(--light-gray-bg)', 'gray.600');
  const textColor = useColorModeValue('var(--dark-gray-text)', 'gray.200');

  // Loading state
  if (isLoading) {
    return (
      <Box className="chakra-datatable" p={0}>
        <Box p={4} textAlign="center" border="1px" borderColor={borderColor} rounded="md">
          <Text color={textColor}>Loading data...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="chakra-datatable" p={0}>
      {/* Custom Controls */}
      <Flex mb={4} justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <HStack>
          <Text color={textColor} className="font-medium">
            Show
          </Text>
          <Select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            width="80px"
            size="sm"
            rounded="md"
            borderColor={borderColor}
            color={textColor}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Select>
          <Text color={textColor} className="font-medium">
            entries
          </Text>
        </HStack>
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
          width={{ base: '100%', md: '250px' }}
          rounded="md"
          borderColor={borderColor}
          _focus={{ borderColor: "var(--primary-green)" }}
          size="md"
          color={textColor}
        />
      </Flex>

      {/* DataTable */}
      <Box overflowX="auto" border="1px" borderColor={borderColor} rounded="md">
        <Table variant="simple" colorScheme="gray" size="md">
          <Thead bg={bgColor}>
            <Tr>
              {columns.map((column, index) => (
                <Th
                  key={column.accessorKey || index}
                  color={textColor}
                  textTransform="capitalize"
                  py={3}
                  width={column.width} // New: width support
                  onClick={() => column.isSortable && handleSort(column.accessorKey)}
                  cursor={column.isSortable ? 'pointer' : 'default'}
                  _hover={column.isSortable ? { bg: 'var(--border-color)' } : {}}
                >
                  <Flex align="center">
                    <Text>{column.header}</Text>
                    {column.isSortable && (
                      <chakra.span pl="4">
                        {sortColumn === column.accessorKey ? (
                          sortDirection === 'asc' ? (
                            <ChevronUpIcon aria-label="sorted ascending" />
                          ) : (
                            <ChevronDownIcon aria-label="sorted descending" />
                          )
                        ) : null}
                      </chakra.span>
                    )}
                  </Flex>
                </Th>
              ))}
              {/* Enhanced: Actions column */}
              {(onEdit || onDelete) && (
                <Th
                  color={textColor}
                  textTransform="capitalize"
                  py={3}
                  width="120px"
                  textAlign="center"
                >
                  Actions
                </Th>
              )}
            </Tr>
          </Thead>
          <Tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <Tr key={row.id || rowIndex} _hover={{ bg: hoverBgColor }}>
                  {columns.map((column, colIndex) => (
                    <Td
                      key={column.accessorKey + '-' + rowIndex}
                      color={textColor}
                      maxW={column.width || "300px"}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {renderCell(row, column)}
                    </Td>
                  ))}
                  {/* Enhanced: Action buttons */}
                  {(onEdit || onDelete) && (
                    <Td>
                      <HStack spacing={2} justify="center">
                        {onEdit && (
                          <IconButton
                            aria-label="Edit"
                            icon={<FaEdit />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => onEdit(row)}
                          />
                        )}
                        {onDelete && (
                          <IconButton
                            aria-label="Delete"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => onDelete(row.id)}
                          />
                        )}
                      </HStack>
                    </Td>
                  )}
                </Tr>
              ))
            ) : (
              <Tr>
                <Td
                  colSpan={columns.length + ((onEdit || onDelete) ? 1 : 0)}
                  textAlign="center"
                  py={8}
                  color={textColor}
                >
                  {searchTerm ? 'No data found.' : 'No data available.'}
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination Controls */}
      <Flex justifyContent="space-between" alignItems="center" mt={4} px={2}>
        <Text color={textColor} className="font-medium">
          Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
        </Text>
        <HStack spacing={2}>
          <IconButton
            aria-label="Previous page"
            icon={<ChevronLeftIcon />}
            onClick={handlePreviousPage}
            isDisabled={currentPage === 1}
            size="sm"
            variant="outline"
            borderColor={borderColor}
            color={textColor}
            _hover={{ bg: hoverBgColor }}
            rounded="md"
          />
          <Text color={textColor} className="font-medium">
            Page {totalPages === 0 ? 0 : currentPage} of {totalPages === 0 ? 0 : totalPages}
          </Text>
          <IconButton
            aria-label="Next page"
            icon={<ChevronRightIcon />}
            onClick={handleNextPage}
            isDisabled={currentPage === totalPages || totalPages === 0}
            size="sm"
            variant="outline"
            borderColor={borderColor}
            color={textColor}
            _hover={{ bg: hoverBgColor }}
            rounded="md"
          />
        </HStack>
      </Flex>
    </Box>
  );
}