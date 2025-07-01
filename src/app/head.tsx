// src/app/head.tsx
// This file is a Server Component by default and can export metadata.

export const metadata = {
  title: 'Resto Admin Dashboard', // Updated title for clarity
  description: 'Efficiently manage your restaurant operations.',
};

// You can optionally add a Head component here if you need to render specific <head> tags
// that are not covered by the metadata object.
// For most cases, the metadata export is sufficient.
export default function Head() {
  return (
    <>
      {/* Any additional <head> tags can go here if needed */}
    </>
  );
}
