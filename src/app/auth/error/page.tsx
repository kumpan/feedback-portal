"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  let errorMessage = "An error occurred during authentication";

  if (error === "AccessDenied") {
    errorMessage = "Access denied. You must use a @kumpan.se email address to sign in.";
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <Card className="p-8 max-w-md">
        <h1 className="text-2xl mb-4 font-bold">Authentication Error</h1>
        <p className="mb-6">{errorMessage}</p>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/auth/signin")}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return Home
          </Button>
        </div>
      </Card>
    </main>
  );
}
