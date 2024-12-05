"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {signIn, getProviders} from 'next-auth/react'
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/custom/auth-form";
import { SubmitButton } from "@/components/custom/submit-button";


import { login, LoginActionState } from "../actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [providers, setProviders] = useState <any> (null)

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    },
  );

  useEffect(() => {
    if (state.status === "failed") {
      toast.error("Invalid credentials!");
    } else if (state.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const availableProviders = await getProviders();
        console.log('Available providers:', availableProviders);
        setProviders(availableProviders);
      } catch (error) {
        console.error('Error fetching providers:', error);
        toast.error('Failed to load authentication providers');
      }
    };

    fetchProviders();
  }, []);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {" for free."}
          </p>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't remember your password? "}
            <Link
              href="/forgot-password"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Forgot Password
            </Link>
          </p>
        </AuthForm>
        {providers && Object.values(providers).map((provider: any) => (
          provider.name === "Google" && (
          <button
            key={provider.name}
            type="button"
            title={provider.name}
            onClick={() => signIn(provider.id)}
          >
            Sign in with {provider.name}
          </button>)
        ))}
      </div>
    </div>
  );
}
