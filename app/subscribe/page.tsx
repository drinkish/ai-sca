'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Link from 'next/link';

const SCAGeneratorClient: React.FC = () => {
  const { data: session, status } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/check-subscription')
        .then(res => res.json())
        .then(data => {
          setIsSubscribed(data.isSubscribed);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error checking subscription:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <p>Please sign in to use the SCA Generator.</p>
        <Link href="/api/auth/signin">Sign In</Link>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div>
        <p>You need an active subscription to use the SCA Generator.</p>
        <Link href="/subscribe">Subscribe Now</Link>
      </div>
    );
  }

  // Render your SCA Generator content here
  return (
    <div>
      {/* Your SCA Generator UI */}
    </div>
  );
};

export default SCAGeneratorClient;