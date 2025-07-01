'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CRUDForm from '../../components/CRUDForm'; // Path adjusted
import { entities } from '../../config/entities';
import { fetchItemData, createItem, updateItem } from '../../lib/api'; // Import API functions

export default function ResourceDetailPage() {
  const { resource, id } = useParams() as { resource: string; id: string };
  const router = useRouter();
  const cfg = entities[resource];

  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = id !== 'new';

  useEffect(() => {
    const loadItemData = async () => {
      if (isEditMode) {
        setLoading(true);
        setError(null);
        try {
          const item = await fetchItemData(resource, id);
          if (item) {
            setInitialData(item);
          } else {
            setError(`Item with ID ${id} not found for ${cfg?.label || resource}.`);
          }
        } catch (err) {
          console.error(`Failed to fetch item ${id} for ${resource}:`, err);
          setError(`Failed to load item. ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // No data to load for new items
      }
    };

    if (cfg) {
      loadItemData();
    }
  }, [resource, id, isEditMode, cfg]);

  if (!cfg) {
    return <p className="text-red-500 text-xl font-semibold">Unknown resource: {resource}</p>;
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        await updateItem(resource, id, formData);
        console.log('Item updated successfully:', formData);
      } else {
        await createItem(resource, formData);
        console.log('Item created successfully:', formData);
      }
      router.push(`/${resource}`); // Navigate back to the list page
    } catch (err) {
      console.error('Form submission failed:', err);
      setError(`Failed to save item. ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
        {isEditMode ? `Edit ${cfg.label.slice(0, -1)} #${id}` : `New ${cfg.label.slice(0, -1)}`}
      </h1>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600 text-xl">Loading form...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!loading && !error && (
        <CRUDForm
          entity={resource}
          fields={cfg.fields}
          initialData={initialData}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
