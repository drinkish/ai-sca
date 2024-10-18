'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useEffect } from 'react';

export function withAuth(WrappedComponent: React.ComponentType) {
  return function ProtectedRoute(props: any) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return;
      if (!session) router.push('/login');
      if (session?.user?.subscriptionStatus !== 'active') router.push('/subscription');
    }, [session, status, router]);

    if (status === 'loading') {
      return <div>Loading...</div>;
    }

    if (session?.user?.subscriptionStatus === 'active') {
      return <WrappedComponent {...props} />;
    }

    return null;
  };
}