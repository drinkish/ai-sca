'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { Chat } from "@/components/custom/chat";
import { generateUUID } from "@/lib/utils";

export default function ClientPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      if (status === 'loading') return;
      if (!session) {
        router.push('/login');
      } else if (session.user?.subscriptionStatus !== 'active') {
        router.push('/subscription');
      } else {
        setIsLoading(false);
      }
    }, [session, status, router]);
  
    if (isLoading) {
      return <div>Loading...</div>;
    }
  
    const id = generateUUID();
    return <Chat key={id} id={id} initialMessages={[]} />;
  }