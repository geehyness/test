'use client';
import React, { useState, useMemo } from 'react';
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
  HStack, // Added for pagination controls
} from '@chakra-ui/react'; // Chakra UI Table, Input, Flex, Button, Text, IconButton
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'; // Chakra UI icons

// Define a flexible column type for better control over rendering
interface Column {
  accessorKey: string; // The key in your data object (e.g., 'id', 'name')
  header: string | React.ReactNode; // The header text or a React component
  cell?: (row: any) => React.ReactNode; // Optional custom cell renderer
}

export default function DataTable({
  columns,
  data,
}: {
  columns: Column[]; // Use the new Column interface
  data: any[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items per page

  // Memoize filtered data for performance
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Calculate pagination details
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <Box className="data-table-container">
      <Flex className="data-table-header-flex">
        <Input
          className="data-table-search-input"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          width={{ base: 'full', md: 'auto' }} // This specific responsive prop is kept for direct Chakra control
        />
        {/* You can add filters here later if needed */}
      </Flex>

      <Box className="data-table-scroll-box">
        <Table variant="simple" size="md">
          <Thead className="data-table-thead">
            <Tr>
              {columns.map((col) => (
                <Th key={col.accessorKey} className="data-table-th">
                  {col.header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <Tr key={row.id || idx} className="data-table-tr">
                  {columns.map((col) => (
                    <Td key={`${row.id || idx}-${col.accessorKey}`} className="data-table-td">
                      {col.cell ? col.cell(row) : String(row[col.accessorKey] ?? '')}
                    </Td>
                  ))}
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={columns.length} textAlign="center" py={4} color="gray.500">
                  No data found.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      <Flex className="data-table-pagination-flex">
        <Text className="data-table-pagination-text-sm">
          Showing {paginatedData.length} of {filteredData.length} entries
        </Text>
        <HStack className="data-table-pagination-hstack">
          <IconButton
            aria-label="Previous page"
            icon={<ChevronLeftIcon />}
            onClick={handlePreviousPage}
            isDisabled={currentPage === 1}
            size="sm"
            variant="outline"
            colorScheme="gray"
          />
          <Text className="data-table-pagination-text-medium">
            Page {currentPage} of {totalPages}
          </Text>
          <IconButton
            aria-label="Next page"
            icon={<ChevronRightIcon />}
            onClick={handleNextPage}
            isDisabled={currentPage === totalPages || totalPages === 0}
            size="sm"
            variant="outline"
            colorScheme="gray"
          />
        </HStack>
      </Flex>
    </Box>
  );
}
