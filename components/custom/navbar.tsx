import Link from "next/link";

import { auth, signOut } from "@/app/(auth)/auth";

import { History } from "./history";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const Navbar = async () => {
  let session = await auth();

  return (
    <>
      <div className="bg-background absolute top-0 left-0 w-dvw py-2 px-3 justify-between flex flex-row items-center z-30">
        {/* Topbar */}
        <div className="flex flex-row gap-3 items-center">
          <History user={session?.user} />
          <div className="flex flex-row gap-2 items-center">
            <Link 
              href="https://app.scaprep.co.uk/" 
              target="_blank"
              className="text-sm hover:underline"
            >
              Home
            </Link>
            <Link href="/" className="text-sm dark:text-zinc-300 hover:underline">
              AI Tutor
            </Link>
          </div>
          <Link href="/sca-generator" className="text-sm hover:underline">
            SCA Cases
          </Link>
          <Link href="/video-chat" className="text-sm hover:underline">
            Video Chat
          </Link>
          <Link 
            href="https://scaprep.co.uk/sca-hot-topics/" 
            target="_blank"
            className="text-sm hover:underline"
          >
            Hot Topics
          </Link>
          <Link 
            href="https://scaprep.co.uk/about/" 
            target="_blank"
            className="text-sm hover:underline"
          >
            About
          </Link>
          <Link 
            href="https://scaprep.co.uk/contacts/" 
            target="_blank"
            className="text-sm hover:underline"
          >
            Contact
          </Link>
        </div>

        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="py-1.5 px-2 h-fit font-normal"
                variant="secondary"
              >
                {session.user?.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ThemeToggle />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard" className="w-full">
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/sca-generator" className="w-full">
                  SCA Cases
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/video-chat" className="w-full">
                  Video Chat
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-1 z-50">
                <form
                  className="w-full"
                  action={async () => {
                    "use server";

                    await signOut({
                      redirectTo: "/",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full text-left px-1 py-0.5 text-red-500"
                  >
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button className="py-1.5 px-2 h-fit font-normal" asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  );
};