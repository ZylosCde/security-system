"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
      <Card className="card-premium w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">CatalystDigital Command Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your dashboard account
          </p>
        </div>
        <LoginForm />
      </Card>
    </div>
  );
}
