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
  chakra, // Import chakra for icon styling
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'; // Import sort icons

// Define a flexible column type for better control over rendering
interface Column {
  accessorKey: string;
  header: string | React.ReactNode;
  cell?: (row: any) => React.ReactNode;
  isSortable?: boolean; // New prop to indicate if a column is sortable
}

export default function DataTable({
  columns,
  data,
}: {
  columns: Column[];
  data: any[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Memoize filtered and sorted data for performance
  const processedData = useMemo(() => {
    // 1. Filter Data
    const filtered = data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // 2. Sort Data
    if (sortColumn && sortDirection) {
      // Create a shallow copy to avoid modifying the original array directly
      // and ensure stable sort if needed, though Array.prototype.sort is stable in modern JS
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
        return 0; // Values are equal
      });
    }

    return filtered; // Return just filtered if no sorting is applied
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Calculate pagination details
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, itemsPerPage]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleItemsPerPageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleSort = (accessorKey: string) => {
    if (sortColumn === accessorKey) {
      // Toggle sort direction if clicking the same column
      setSortDirection((prev) => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return null; // Cycle through asc, desc, none
        return 'asc';
      });
    } else {
      // Set new column to sort ascending
      setSortColumn(accessorKey);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on new sort
  };

  return (
    <Box className="chakra-datatable" p={0}>
      {/* Custom Controls */}
      <Flex mb={4} justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <HStack>
          <Text color="var(--dark-gray-text)" className="font-medium">
            Show
          </Text>
          <Select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            width="80px"
            size="sm"
            rounded="md"
            borderColor="var(--border-color)"
            color="var(--dark-gray-text)"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Select>
          <Text color="var(--dark-gray-text)" className="font-medium">
            entries
          </Text>
        </HStack>
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          width={{ base: '100%', md: '250px' }}
          rounded="md"
          borderColor="var(--border-color)"
          focusBorderColor="var(--primary-green)"
          size="md"
          color="var(--dark-gray-text)"
        />
      </Flex>

      {/* DataTable */}
      <Box overflowX="auto" border="1px" borderColor="var(--border-color)" rounded="md">
        <Table variant="simple" colorScheme="gray" size="md">
          <Thead bg="var(--light-gray-bg)">
            <Tr>
              {columns.map((column, index) => (
                <Th
                  key={column.accessorKey || index}
                  color="var(--dark-gray-text)"
                  textTransform="capitalize"
                  py={3}
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
                        ) : (
                          // Optional: Show a "neutral" sort icon when not sorted
                          // <Icon as={TriangleDownIcon} transform="rotate(180deg)" color="gray.400" />
                          null // Changed from '' to null
                        )}
                      </chakra.span>
                    )}
                  </Flex>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <Tr key={row.id || rowIndex} _hover={{ bg: 'var(--light-gray-bg)' }}>
                  {columns.map((column, colIndex) => (
                    <Td key={column.accessorKey + '-' + rowIndex} color="var(--medium-gray-text)">
                      {column.cell ? column.cell(row) : String(row[column.accessorKey])}
                    </Td>
                  ))}
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={columns.length} textAlign="center" py={4} color="var(--medium-gray-text)">
                  No data found.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination Controls */}
      <Flex justifyContent="space-between" alignItems="center" mt={4} px={2}>
        <Text color="var(--dark-gray-text)" className="font-medium">
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
            borderColor="var(--border-color)"
            color="var(--dark-gray-text)"
            _hover={{ bg: 'var(--light-gray-bg)' }}
            rounded="md"
          />
          <Text color="var(--dark-gray-text)" className="font-medium">
            Page {totalPages === 0 ? 0 : currentPage} of {totalPages === 0 ? 0 : totalPages}
          </Text>
          <IconButton
            aria-label="Next page"
            icon={<ChevronRightIcon />}
            onClick={handleNextPage}
            isDisabled={currentPage === totalPages || totalPages === 0}
            size="sm"
            variant="outline"
            borderColor="var(--border-color)"
            color="var(--dark-gray-text)"
            _hover={{ bg: 'var(--light-gray-bg)' }}
            rounded="md"
          />
        </HStack>
      </Flex>
    </Box>
  );
}