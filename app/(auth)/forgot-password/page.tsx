"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"


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
  email: z.string().email(),
})

export default function ForgotPassword() {

  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: values.email }),
      })

      if (response.ok) {
        toast({
          title: "Forgot Password Link Sent.",
          description: "Password reset link sent to your email.",
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
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "ERROR!.",
        description: `${error.message || "Something went wrong"}`,
      })
      
    }
  }

  

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h2 className="text-3xl font-semibold dark:text-zinc-50">Forgot Password?</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Enter your email address and we will send you a link to reset your password
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} >
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter Your Email</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
            />
            <Button type="submit" className="mt-4">Submit</Button>
          </form>
        </Form>  
      </div>
    </div> 
  )
}

