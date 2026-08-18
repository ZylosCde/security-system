"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const isMasterOnlyPath =
      pathname.startsWith("/patrolling/master") || pathname.startsWith("/master-changes");
    if (isMasterOnlyPath && user.role?.name !== "MASTER") {
      router.replace("/");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
