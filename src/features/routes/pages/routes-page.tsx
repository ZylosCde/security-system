"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import { RouteCard } from "@/features/routes/components/route-card";

export default function RoutesPage() {
  const { routes, checkpoints } = usePatrolStore();

  const getCheckpointName = (id: string) => checkpoints.find((c) => c.id === id)?.name || id;

  return (
    <CommandLayout
      header={
        <>
          <Link
            href="/patrolling"
            className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="hidden h-3 w-px bg-border sm:block" />
          <div className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl">
            Route Templates
          </div>
        </>
      }
      headerActions={
        <Button className="h-11 rounded-2xl px-4 sm:px-6">Create Route</Button>
      }
    >
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} getCheckpointName={getCheckpointName} />
        ))}
      </div>
    </CommandLayout>
  );
}
