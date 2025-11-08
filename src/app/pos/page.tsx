// src/app/pos/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '@/lib/usePOSStore';
import { Center, Spinner } from '@chakra-ui/react';

export default function POSRootPage() {
  const router = useRouter();
  const { currentStaff, _hasHydrated } = usePOSStore();

  useEffect(() => {
    // This effect waits for the user's session to be loaded from storage.
    if (_hasHydrated) {
      // If the user is logged in and has a designated landing page for their role, redirect them there.
      if (currentStaff && currentStaff.mainAccessRole?.landing_page) {
        router.replace(currentStaff.mainAccessRole.landing_page);
      } else {
        // If not logged in, redirect to the login page.
        router.replace('/pos/login');
      }
    }
  }, [_hasHydrated, currentStaff, router]);

  // Display a loading spinner while checking the authentication status.
  return (
    <Center h="100vh">
      <Spinner size="xl" />
    </Center>
  );
}
