"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form"
import { z } from "zod"

import { emailValidation } from "@/app/dashboard/email-validation";
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
import { updateUserEmail } from "@/db/queries";
import { useToast } from "@/hooks/use-toast"



const FormSchema = z.object({
  
  email: z.string().email({
    message: "Email must be a valid email address.",
  }),
  newEmail: z.string().email({
    message: "New Email must be a valid email address.",
  }),

}) 
// Check if the two emails are different
.refine((data) => data.email !== data.newEmail, { 

  message: "Emails must be different.",
  path: ["newEmail"],

})  


export default function ChangeEmail() {

  const { toast } = useToast()
  
  const { data: session } = useSession();
  const sessionEmail = session?.user?.email as string;
  console.log('session hell');
  console.log(sessionEmail);
  

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      newEmail: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {

    console.log(`session values`);
    console.log(session);
    console.log(data);

    const updateEmail =  updateUserEmail(data.email, data.newEmail);
    //Update the session email value

    console.log(`Email updated`);
    console.log(updateEmail);
    
    
    toast({
      title: "You email has been successfully changed.",
    })
  }

  return (
    <Form {...form}>
      <h2 className="text-lg font-medium">Change Email</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormDescription>
                You cannot change your email because you{`'`}re signed with Google.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your new email" {...field} />
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
