// src/app/layout.tsx - CORRECTED
'use client';

import React, { useEffect } from 'react';
import '@/app/globals.css';
import { ChakraProvider } from '@chakra-ui/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Carte POS & Admin</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#8FC73E" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {/* FIX: Removed invalid 'value' prop from ChakraProvider */}
        <ChakraProvider>
          {children}
        </ChakraProvider>
      </body>
    </html>
  );
}