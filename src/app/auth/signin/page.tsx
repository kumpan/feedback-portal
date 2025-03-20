"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  return (
    <Card className="p-8 max-w-md">
      <h1 className="text-2xl font-bold">Kumpan dashboard</h1>
      <p className="mb-6">
        Logga in med din Kumpan e-postadress (@kumpan.se) för att komma åt vår
        fina dashboard.
      </p>
      <Button
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full"
        size="lg"
      >
        Logga in med Google
      </Button>
    </Card>
  );
}

export default function SignIn() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<></>}>
        <SignInContent />
      </Suspense>
    </main>
  );
}
