"use client"

import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
    password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
    confirmPassword: z.string().min(6, { message: 'Confirm Password must be at least 6 characters long.' })
})

function ResetPassword() {
    
    const { toast } = useToast();

    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [message, setMessage] = useState <string> ('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    })    

    async function onSubmit(data: z.infer<typeof formSchema>) {
        console.log(data);

        if(data.password !== data.confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    password: data.password
                })
            })

            if(response.ok) {
                toast({
                    title: "Password Reset Successfully.",
                    description: "Password reset successfully. You can now log in.",
                })
            }
            else{
                const error = await response.json();
                toast({
                    variant: "destructive",
                    title: "Error!",
                    description: `${error.message || "Something went wrong"}`,
                })
            }
            
        } catch (error) {
            console.log(error);
            toast({
                variant: "destructive",
                title: "Error!",
                description: `${error || "Something went wrong"}`,
            })
            
        }
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="w-full max-w-md rounded-2xl flex flex-col gap-12">
                <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
                    <h2 className='text-3xl font-bold'>Reset Your Password</h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Enter your new password to reset your password.
                    </p>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Submit</Button>
                    </form>
                </Form>
            </div>
            {message && <p>{message}</p>}
            
        </div>
    )
}

export default ResetPassword