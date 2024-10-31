"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { SubscribeButton } from "@/components/custom/SubscribeButton";

export default function SubscribePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <p className="text-lg">Please sign in to subscribe.</p>
        <Link 
          href="/api/auth/signin"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">Subscribe to SCA Generator</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Premium Access</h2>
            <p className="text-gray-600">
              Get unlimited access to the SCA Generator and enhance your preparation for the RCGP SCA exam.
            </p>
            
            <ul className="text-left space-y-2 mt-4 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited practice cases
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                NICE guidelines integration
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Detailed feedback and explanations
              </li>
            </ul>
          </div>

          <SubscribeButton />
        </div>
      </div>
    </div>
  );
}