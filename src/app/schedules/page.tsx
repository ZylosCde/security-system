"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";

export default function SchedulesPage() {
  const { schedules, routes, officers } = usePatrolStore();

  const getRouteName = (id: string) => routes.find((r) => r.id === id)?.name || id;
  const getOfficerName = (id: string) => officers.find((o) => o.id === id)?.name || id;

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
            Patrol Schedules
          </div>
        </>
      }
      headerActions={
        <Button className="h-11 gap-2 rounded-2xl px-4 sm:px-6">
          <Play className="h-4 w-4" /> <span className="hidden sm:inline">Create Schedule</span>
        </Button>
      }
    >
      <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:p-8">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="card-premium p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="font-mono text-xs tracking-wide text-muted-foreground">{schedule.id}</div>
                <div className="mt-1 text-xl font-semibold tracking-tight">
                  {getRouteName(schedule.routeId)}
                </div>
                <div className="mt-px text-sm text-muted-foreground">
                  Assigned to {getOfficerName(schedule.officerId)}
                </div>
              </div>
              <Badge
                className={
                  schedule.status === "active"
                    ? "shrink-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : ""
                }
              >
                {schedule.status.toUpperCase()}
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">START</div>
                <div className="font-mono">
                  {new Date(schedule.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">END</div>
                <div className="font-mono">
                  {new Date(schedule.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">RECURRENCE</div>
                <div>{schedule.recurrence}</div>
              </div>
              <div className="col-span-2 lg:col-span-1">
                <div className="mb-1 text-xs text-muted-foreground">ALERTS</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400">T-10 • T+5 • T+10 • T+15</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </CommandLayout>
  );
}
