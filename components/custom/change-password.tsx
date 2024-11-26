"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form"
import { z } from "zod"


import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { changeUserPassword } from "@/db/queries";
import { useToast } from "@/hooks/use-toast"



const FormSchema = z.object({
    password: z.string().min(6, { 
        message: "Password must be at least 6 characters long." 
    }),
    newPassword: z.string().min(6, { 
        message: "New Password must be at least 6 characters long." 
    }),
  }) 

  
export default function ChangePassword() {

  const { toast } = useToast()

  const {data: session} = useSession();
  const sessionEmail = session?.user?.email as string;
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      password: "",
      newPassword: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {

    const res = changeUserPassword(sessionEmail, data.password, data.newPassword);
    res.then((res) => console.log(res));
    console.log(`this is res password`);
    console.log(res);
    
    
    
    toast({
      title: "Your password has been successfully changed."
    })
  }

  return (
    <Form {...form}>
      <h2 className="text-lg font-medium">Change Password</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your new password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
