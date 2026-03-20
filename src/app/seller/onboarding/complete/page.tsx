"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/sellers/status");
        const data = await res.json();
        setComplete(data.stripeComplete);
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            {complete ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : (
              <Store className="h-8 w-8 text-amber-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-heading">
            {complete ? "You're all set!" : "Almost there"}
          </CardTitle>
          <CardDescription>
            {complete
              ? "Your Stripe account is verified. You can now start listing products!"
              : "Your Stripe setup isn't complete yet. Please finish the verification to start selling."}
          </CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="flex flex-col gap-2">
          {complete ? (
            <Button
              className="w-full cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => router.push("/dashboard/seller")}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button
              className="w-full cursor-pointer"
              variant="outline"
              onClick={() => router.push("/seller/onboarding")}
            >
              Retry Setup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
