"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  let errorMessage = "Ett fel uppstod under autentiseringen";

  if (error === "AccessDenied") {
    errorMessage =
      "Åtkomst nekad. Du måste använda en @kumpan.se e-postadress för att logga in.";
  }

  return (
    <Card className="p-8 max-w-md">
      <h1 className="text-2xl font-bold">Autentiseringsfel</h1>
      <p className="mb-6">{errorMessage}</p>
      <div className="flex gap-2">
        <Button onClick={() => router.push("/auth/signin")}>Försök igen</Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Till startsidan
        </Button>
      </div>
    </Card>
  );
}

export default function AuthError() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthErrorContent />
      </Suspense>
    </main>
  );
}
