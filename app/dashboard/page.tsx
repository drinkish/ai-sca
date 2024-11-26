'use client'

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

import Billing from "@/components/custom/billing"
import ChangeEmail from "@/components/custom/change-email"
import ChangePassword from "@/components/custom/change-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { getUser } from "@/db/queries"


export default function Dashboard() {

  const {data: session} = useSession();
  const [activeTab, setActiveTab] = useState("account")
  const [oAuthUser, setOAuthUser] = useState<boolean | null>(false);

  useEffect(() => {
    const isGoogleUser = async () => {
      const [getUserDetails] =  await getUser(session?.user?.email!);
      setOAuthUser(getUserDetails.oAuthId !== null);
    }
    isGoogleUser();
  }, [])

  const tabContent : { [key: string]: React.ReactNode } = {
    // Add your tab content here
    account: (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Account Settings</h3>
        <p className="text-sm text-muted-foreground">Manage your account settings here.</p>
        <Separator />
        <ChangeEmail />
        <Separator className="my-4" />
        <ChangePassword />
      </div>
    ),
    billing: (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Billing</h3>
        <p className="text-sm text-muted-foreground">Manage Your Billing Here.</p>
        <Billing />
      </div>
    ),
    notifications: (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">Manage your notification preferences.</p>
        {/* Add notifications settings form here */}
      </div>
    ),
  }

  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {["account", "billing", "notifications"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  activeTab === tab ? "bg-muted" : "hover:bg-muted"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-2xl">
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  )
}