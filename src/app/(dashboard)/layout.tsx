import type { ReactNode } from "react";
import { PatrolProvider } from "@/features/patrols/hooks/use-patrol-store";
import { RouteGuard } from "@/features/auth/route-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PatrolProvider>
      <RouteGuard>{children}</RouteGuard>
    </PatrolProvider>
  );
}
