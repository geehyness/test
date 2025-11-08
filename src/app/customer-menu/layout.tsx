// src/app/customer-menu/layout.tsx
'use client';

import React from 'react';
// FIX: Remove extendTheme to use default theme and prevent errors
import { ChakraProvider } from '@chakra-ui/react';
import '@/app/globals.css';

export default function CustomerMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Restaurant Menu</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {/* FIX: Removed theme prop to use default theme */}
        <ChakraProvider>
          {children}
        </ChakraProvider>
      </body>
    </html>
  );
}