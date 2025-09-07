'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Switch, // For boolean fields
  Textarea, // For larger text inputs
  NumberInput, // For number inputs
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';

interface CRUDFormProps {
  entity: string;
  fields: string[];
  initialData: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => void;
}

export default function CRUDForm({
  entity,
  fields,
  initialData,
  onSubmit,
}: CRUDFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Initialize form data with initialData when component mounts or initialData changes
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Handle specific input types if needed, e.g., number, boolean
    let processedValue: any = value;
    if (type === 'number') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) { // Handle empty string for number input
        processedValue = '';
      }
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: processedValue,
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  };

  const handleNumberInputChange = (valueAsString: string, valueAsNumber: number, name: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: valueAsNumber,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Helper to determine input type based on field name or convention
  const getFieldType = (fieldName: string) => {
    if (fieldName.includes('id') || fieldName.includes('price') || fieldName.includes('quantity') || fieldName.includes('total') || fieldName.includes('amount')) {
      return 'number';
    }
    if (fieldName.includes('is_') || fieldName.includes('has_') || fieldName.includes('active') || fieldName.includes('revoked')) {
      return 'boolean';
    }
    if (fieldName.includes('description') || fieldName.includes('address') || fieldName.includes('payload') || fieldName.includes('exception')) {
      return 'textarea';
    }
    if (fieldName.includes('password') || fieldName.includes('token')) {
      return 'password';
    }
    if (fieldName.includes('email')) {
      return 'email';
    }
    if (fieldName.includes('date') || fieldName.includes('created_at') || fieldName.includes('updated_at') || fieldName.includes('expires_at')) {
      return 'datetime-local'; // Or 'date' depending on precision needed
    }
    return 'text';
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={6} borderWidth="1px" borderRadius="lg" shadow="md" bg="white">
      <VStack spacing={4} align="stretch">
        {fields.map((field) => {
          // Skip 'id' field for 'new' mode, but allow it for 'edit' mode if it's part of initialData
          if (field === 'id' && !initialData.id) {
            return null;
          }

          const fieldType = getFieldType(field);
          const label = field.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

          return (
            <FormControl key={field} id={field}>
              <FormLabel fontWeight="semibold">{label}</FormLabel>
              {fieldType === 'boolean' ? (
                <Switch
                  name={field}
                  isChecked={!!formData[field]} // Ensure boolean value
                  onChange={handleSwitchChange}
                  colorScheme="blue"
                  size="lg" // Larger switch
                />
              ) : fieldType === 'textarea' ? (
                <Textarea
                  name={field}
                  value={formData[field] || ''}
                  onChange={handleChange}
                  placeholder={`Enter ${label}`}
                  size="md"
                  rounded="md"
                  focusBorderColor="blue.400"
                />
              ) : fieldType === 'number' ? (
                <NumberInput
                  value={formData[field] === undefined ? '' : formData[field]}
                  onChange={(valueAsString, valueAsNumber) => handleNumberInputChange(valueAsString, valueAsNumber, field)}
                  min={0} // Example min value
                  focusBorderColor="blue.400"
                >
                  <NumberInputField name={field} rounded="md" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              ) : (
                <Input
                  name={field}
                  type={fieldType}
                  value={formData[field] || ''}
                  onChange={handleChange}
                  placeholder={`Enter ${label}`}
                  size="md"
                  rounded="md"
                  focusBorderColor="blue.400"
                />
              )}
            </FormControl>
          );
        })}
      </VStack>

      <HStack spacing={4} mt={8} justifyContent="flex-end"> {/* Align buttons to the right */}
        <Button colorScheme="gray" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button colorScheme="blue" type="submit">
          Save
        </Button>
      </HStack>
    </Box>
  );
}
