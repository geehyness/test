// src/app/layout.tsx
'use client';

import React, { useEffect } from 'react';
import '@/app/globals.css';
// FIX: Removed extendTheme. Default theme will be used by ChakraProvider.
import { ChakraProvider } from '@chakra-ui/react';

function AppSelector({ children }: { children: React.ReactNode }) {
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || 'pos';

  // This component will simply pass children through, 
  // as the routing is now handled by redirects in next.config.ts
  // and separate layouts in /admin and /pos directories.
  return <>{children}</>;
}

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
        {/* FIX: Wrap children in ChakraProvider to resolve context errors */}
        {/* FIX: Removed theme prop which was causing an error. */}
        <ChakraProvider>
          <AppSelector>{children}</AppSelector>
        </ChakraProvider>
      </body>
    </html>
  );
}