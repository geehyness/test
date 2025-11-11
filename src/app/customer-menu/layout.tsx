// src/app/customer-menu/layout.tsx
'use client';

import React from 'react';
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
        {/* FIX: Removed invalid 'value' prop from ChakraProvider */}
        <ChakraProvider>
          {children}
        </ChakraProvider>
      </body>
    </html>
  );