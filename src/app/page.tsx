// src/app/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Spinner } from '@chakra-ui/react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // This redirect is a fallback. The primary redirection is handled
    // server-side in next.config.js for better performance and SEO.
    const appMode = process.env.NEXT_PUBLIC_APP_MODE || 'pos';
    if (appMode === 'admin') {
      router.replace('/admin');
    } else {
      router.replace('/pos');
    }
  }, [router]);

  return (
    <Center h="100vh">
      <Spinner size="xl" />
    </Center>
  );
}
