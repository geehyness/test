import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to Resto Admin!</h1>
      <p className="text-lg text-gray-600 mb-8">
        Your central hub for efficient restaurant management. Use the sidebar to navigate through various sections and manage your data.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example Dashboard Cards (replace with actual data/components) */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Sales Today</h2>
          <p className="text-3xl font-bold text-green-600">$1,234.56</p>
          <p className="text-sm text-gray-500 mt-1">5% increase from yesterday</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Active Orders</h2>
          <p className="text-3xl font-bold text-blue-600">15</p>
          <p className="text-sm text-gray-500 mt-1">3 new orders in the last hour</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Low Stock Items</h2>
          <p className="text-3xl font-bold text-red-600">7</p>
          <p className="text-sm text-gray-500 mt-1">Action required for inventory</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">New Customers This Week</h2>
          <p className="text-3xl font-bold text-purple-600">28</p>
          <p className="text-sm text-gray-500 mt-1">Growing customer base</p>
        </div>
      </div>

      <div className="mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Links</h2>
        <ul className="list-disc list-inside text-blue-600">
          <li className="mb-2"><a href="/sales" className="hover:underline">View All Sales</a></li>
          <li className="mb-2"><a href="/foods" className="hover:underline">Manage Food Items</a></li>
          <li className="mb-2"><a href="/employees" className="hover:underline">Check Employee Attendance</a></li>
          <li className="mb-2"><a href="/settings" className="hover:underline">Adjust Settings</a></li>
        </ul>
      </div>
    </div>
  );
}
