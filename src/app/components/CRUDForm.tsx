'use client';
import React, { useState, useEffect } from 'react';
// Removed useRouter and useParams as submission logic is now handled by parent via onSubmit
// import { useRouter, useParams } from 'next/navigation';
// Removed api import as CRUD operations are handled by parent's onSubmit

export default function CRUDForm({
  entity, // Still useful for context, but not directly used for API calls here
  fields,
  initialData = {},
  onSubmit, // New prop: function to call on form submission
}: {
  entity: string;
  fields: string[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void; // Define onSubmit prop type
}) {
  const [form, setForm] = useState<Record<string, any>>({});

  // Initialize form state with initialData whenever it changes
  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Safely destructure 'checked' only if the target is an HTMLInputElement
    // and its type is 'checkbox'. Otherwise, default checked to undefined.
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked; // Type assertion for safety

    // Handle boolean inputs (checkboxes) and other input types
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call the onSubmit prop with the current form data
    onSubmit(form);
  };

  // Helper to determine input type based on field name
  const getInputType = (field: string): string => {
    const lowerField = field.toLowerCase();
    if (lowerField.includes('password')) return 'password';
    if (lowerField.includes('email')) return 'email';
    if (lowerField.includes('date') || lowerField.endsWith('_at')) return 'datetime-local'; // For timestamp/date fields
    if (lowerField.includes('phone')) return 'tel';
    if (lowerField.includes('amount') || lowerField.includes('price') || lowerField.includes('total') || lowerField.includes('balance') || lowerField.includes('quantity')) return 'number';
    if (lowerField.startsWith('is_') || lowerField.startsWith('has_')) return 'checkbox';
    if (lowerField.includes('description') || lowerField.includes('note') || lowerField.includes('message') || lowerField.includes('content') || lowerField.includes('exception') || lowerField.includes('payload') || lowerField.includes('license') || lowerField.includes('redirect') || lowerField.includes('scopes') || lowerField.includes('config') || lowerField.includes('request') || lowerField.includes('response') || lowerField.includes('abilities') || lowerField.includes('extras')) return 'textarea';
    return 'text';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
      {fields.length === 0 && (
        <p className="text-gray-500 text-center">
          No fields defined—add them in app/config/entities.ts
        </p>
      )}
      {fields.map((f) => {
        const inputType = getInputType(f);
        const isCheckbox = inputType === 'checkbox';
        const isTextArea = inputType === 'textarea';

        // Skip 'id', 'created_at', 'updated_at' for direct editing in most cases
        if (f === 'id' || f === 'created_at' || f === 'updated_at' || f === 'email_verified_at' || f === 'last_used_at' || f === 'expires_at' || f === 'failed_at' || f === 'changed_at' || f === 'redeemed_at' || f === 'sent_at' || f === 'paid_at' || f === 'summary_date' || f === 'date' || f === 'time' || f === 'from' || f === 'to' || f === 'start_date' || f === 'end_date' || f === 'pay_date' || f === 'expiry_date' || f === 'reserved_at' || f === 'available_at') {
          return null;
        }

        return (
          <div key={f} className={`flex ${isCheckbox ? 'flex-row-reverse justify-end items-center space-x-2' : 'flex-col'} `}>
            <label htmlFor={f} className={`block mb-1 capitalize text-gray-700 font-medium ${isCheckbox ? 'mr-2' : ''}`}>
              {f.replace(/_/g, ' ')}
            </label>
            {isTextArea ? (
              <textarea
                id={f}
                name={f}
                value={form[f] ?? ''} // Use value for controlled component
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                rows={4}
              />
            ) : (
              <input
                id={f}
                name={f}
                type={inputType}
                checked={isCheckbox ? (form[f] ?? false) : undefined} // Use checked for checkboxes
                value={isCheckbox ? undefined : (form[f] ?? '')} // Use value for other types
                onChange={handleChange}
                className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm
                  ${isCheckbox ? 'w-auto h-auto p-0 m-0' : ''}`}
                step={inputType === 'number' ? 'any' : undefined} // Allow decimals for number inputs
              />
            )}
          </div>
        );
      })}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="px-8 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 text-lg font-semibold"
        >
          Save
        </button>
      </div>
    </form>
  );
}
