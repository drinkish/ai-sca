// In lib/withAuth.tsx

'use client'; // 1. Mark as Client Component

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // 2. Use next/navigation
import { useEffect } from 'react';
import React from 'react'; // Ensure React is imported

// Define the type for WrappedComponent for better TypeScript support
type WrappedComponentType = React.ComponentType<any>;

export function withAuth(WrappedComponent: WrappedComponentType) {
  return function ProtectedRoute(props: any) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return; // Do nothing while loading

      if (!session) {
        router.replace('/login'); // Redirect to login if not authenticated
      } else if (session.user?.subscriptionStatus !== 'active') {
        router.replace('/subscription'); // Redirect if subscription is not active
      }
    }, [session, status, router]);

    if (status === 'loading') {
      return <div>Loading...</div>; // Show loading state
    }

    if (session?.user?.subscriptionStatus === 'active') {
      return <WrappedComponent {...props} />; // Render the protected component
    }

    return null; // Render nothing if redirecting
  };
}