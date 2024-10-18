'use client';

import dynamic from 'next/dynamic';

const SCAGeneratorClient = dynamic(() => import('./SCAGeneratorClient'), {
  ssr: false,
});

export default function SCAGeneratorPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SCA Case Generator</h1>
      <SCAGeneratorClient />
    </div>
  );
}