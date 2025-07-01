'use client';
import React from 'react';

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
  return (
    <div className="overflow-x-auto rounded-lg shadow-md">
      <table className="min-w-full bg-white border-collapse">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessorKey}
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors duration-150">
              {columns.map((col) => (
                <td key={`${row.id || idx}-${col.accessorKey}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {/* If a custom cell renderer is provided, use it */}
                  {col.cell ? col.cell(row) : String(row[col.accessorKey] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
