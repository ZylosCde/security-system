"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";

export default function RoutesPage() {
  const { routes, checkpoints } = usePatrolStore();

  const getCheckpointName = (id: string) => checkpoints.find((c) => c.id === id)?.name || id;

  return (
    <CommandLayout
      header={
        <>
          <Link
            href="/"
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
          <Card key={route.id} className="card-premium p-4 sm:p-6">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="font-mono text-xs tracking-wide text-muted-foreground">{route.id}</div>
                <div className="mt-px text-2xl font-semibold tracking-tight">{route.name}</div>
              </div>
              <Badge variant="outline" className="w-fit shrink-0 font-mono text-xs px-3 py-1">
                {route.expectedDuration} min
              </Badge>
            </div>

            <div className="mb-3 text-xs tracking-wide text-muted-foreground uppercase">
              ORDERED CHECKPOINTS
            </div>

            <div className="space-y-2">
              {route.checkpoints.map((cpId, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-[15px]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-6 font-mono text-xs text-muted-foreground">
                      {(index + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="font-medium">{getCheckpointName(cpId)}</div>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              Recurrence: {route.recurrence}
            </div>
          </Card>
        ))}
      </div>
    </CommandLayout>
  );
}
