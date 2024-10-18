'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { Chat } from "@/components/custom/chat";
import { generateUUID } from "@/lib/utils";

export default function ClientPage() {
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
    const id = generateUUID();
    return <Chat key={id} id={id} initialMessages={[]} />;
  }

  return null;
}