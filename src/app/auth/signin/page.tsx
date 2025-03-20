"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Card className="p-8 max-w-md">
        <h1 className="text-2xl mb-6 font-bold">Sign in to Feedback Portal</h1>
        <p className="mb-6">
          Please sign in with your Kumpan email address (@kumpan.se) to access the dashboard.
        </p>
        <Button 
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full"
        >
          Sign in with Google
        </Button>
      </Card>
    </main>
  );
}
