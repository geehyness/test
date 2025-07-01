'use client'; // This component uses client-side hooks like useState

import React, { useState } from 'react';
import Link from 'next/link';
import './globals.css';
import { entities } from './config/entities';
import Navbar from './components/Navbar'; // Import the Navbar component
import { Menu } from 'lucide-react'; // Import a menu icon for mobile toggle

export const metadata = {
  title: 'Resto Admin Dashboard',
  description: 'Efficiently manage your restaurant operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // resources are still needed to pass to Navbar if it uses them
  // const resources = Object.keys(entities); // Keep if Navbar needs it, otherwise can remove

  return (
    <html lang="en">
      {/* The body will be a flex container. On small screens, it's column-wise. On medium/larger, it's row-wise. */}
      <body className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">

        {/* Mobile Header and Menu Button */}
        <div className="md:hidden p-4 bg-gray-800 text-white flex justify-between items-center shadow-md">
          <h2 className="text-2xl font-bold text-yellow-400">Resto Admin</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" /> {/* Menu icon */}
          </button>
        </div>

        {/* Sidebar Navigation */}
        {/*
          - fixed inset-y-0 left-0: Positions the sidebar absolutely
          - z-50: Ensures it's on top of other content
          - w-64: Fixed width for the sidebar
          - transform: Enables CSS transforms for sliding animation
          - ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}: Controls the slide-in/out on mobile
          - md:relative md:translate-x-0: On medium screens and up, it becomes relative and always visible
          - transition-transform duration-300 ease-in-out: Smooth animation
        */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
          <Navbar />
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {/*
          - fixed inset-0: Covers the entire viewport
          - bg-black bg-opacity-50: Semi-transparent black background
          - z-40: Below the sidebar but above other content
          - md:hidden: Hidden on medium screens and up
          - onClick: Closes the sidebar when clicked
        */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true" // Hide from accessibility tree as it's just an overlay
          ></div>
        )}

        {/* Main Content Area */}
        {/*
          - flex-1: Takes up remaining space
          - p-4: Smaller padding on mobile
          - md:p-6: Larger padding on medium screens and up
          - overflow-y-auto: Allows vertical scrolling if content overflows
        */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
