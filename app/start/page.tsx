"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function StartPage() {
  const router = useRouter();

  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">How would you like to start revising?</h1>
        <p className="text-muted-foreground">Choose your preferred learning method</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/" >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>AI Tutor</CardTitle>
              <CardDescription>Interactive learning with our AI tutor</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Engage in dynamic conversations with our AI tutor for personalized learning and instant feedback.
              </p>
            </CardContent>
          </Card>
        </Link>


        <Link href="/sca-generator" >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>SCA Cases</CardTitle>
              <CardDescription>Practice with generated SCA cases</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Work through AI-generated SCA cases to improve your clinical assessment skills.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
} 