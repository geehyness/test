/* src/app/components/DataTable.tsx */
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
  HStack,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

// Define a flexible column type for better control over rendering
interface Column {
  accessorKey: string;
  header: string | React.ReactNode;
  cell?: (row: any) => React.ReactNode;
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

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <Box className="data-table-container">
      {/* Search Input */}
      <Flex mb={4} justifyContent="flex-end">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          width="fit-content"
          size="md"
          rounded="md"
          borderColor="var(--border-color)" // Use border color
          _hover={{ borderColor: 'var(--primary-green)' }} // Green on hover
          focusBorderColor="var(--primary-green)" // Green on focus
          color="var(--dark-gray-text)" // Dark gray text
          className="font-regular"
        />
      </Flex>

      {/* Table Container with Scroll */}
      <Box overflowX="auto" border="1px solid var(--border-color)" rounded="md" shadow="sm"> {/* Added border and shadow for card-like feel */}
        <Table variant="simple" size="md">
          <Thead bg="var(--light-gray-bg)"> {/* Light gray background for table header */}
            <Tr>
              {columns.map((column) => (
                <Th
                  key={column.accessorKey}
                  py={3}
                  px={4}
                  textAlign="left"
                  color="var(--dark-gray-text)" // Dark gray text for headers
                  className="font-semibold" // Semi-bold font for headers
                  textTransform="capitalize"
                  borderBottom="2px solid var(--border-color)" // Border below header
                >
                  {column.header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <Tr key={rowIndex} _hover={{ bg: 'var(--light-gray-bg)' }}> {/* Light gray background on row hover */}
                  {columns.map((col) => (
                    <Td
                      key={`${row.id}-${col.accessorKey}`}
                      py={3}
                      px={4}
                      color="var(--medium-gray-text)" // Medium gray text for data cells
                      className="font-regular"
                      borderBottom="1px solid var(--border-color)" // Border between rows
                    >
                      {col.cell ? col.cell(row) : String(row[col.accessorKey] ?? '')}
                    </Td>
                  ))}
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={columns.length} textAlign="center" py={4} color="var(--medium-gray-text)" className="font-regular">
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
          Showing {paginatedData.length} of {filteredData.length} entries
        </Text>
        <HStack spacing={2}>
          <IconButton
            aria-label="Previous page"
            icon={<ChevronLeftIcon />}
            onClick={handlePreviousPage}
            isDisabled={currentPage === 1}
            size="sm"
            variant="outline"
            borderColor="var(--border-color)" // Border color for buttons
            color="var(--dark-gray-text)" // Dark gray text for buttons
            _hover={{ bg: 'var(--light-gray-bg)' }} // Light gray background on hover
            rounded="md"
          />
          <Text color="var(--dark-gray-text)" className="font-medium">
            Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
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