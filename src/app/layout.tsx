import React from 'react';
import Link from 'next/link'; // Keep Link for potential header links if needed
import './globals.css';
//import { entities } from './config/entities'; // Keep entities if you use them directly here
import Navbar from './components/Navbar'; // Import the new Navbar component

export const metadata = {
  title: 'Resto Admin Dashboard', // Updated title for clarity
  description: 'Efficiently manage your restaurant operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // resources are now handled by Navbar, so this can be removed if not used elsewhere
  // const resources = Object.keys(entities);

  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100 font-sans">
        {/* Sidebar Navigation */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
