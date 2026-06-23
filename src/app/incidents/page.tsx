"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function IncidentsPage() {
  const { incidents, sessions, officers } = usePatrolStore();

  const getSeverityColor = (sev: string) => {
    if (sev === "Critical")
      return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400";
    if (sev === "High")
      return "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400";
    if (sev === "Medium")
      return "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-400";
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400";
  };

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
            Incident Reports
          </div>
        </>
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {incidents.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No incidents reported</div>
        )}
        {incidents.map((inc) => {
          const session = sessions.find((s) => s.id === inc.sessionId);
          const officer = officers.find((o) => o.id === session?.officerId);
          return (
            <Card key={inc.id} className="card-premium p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="min-w-0">
                  <Badge className={cn("border", getSeverityColor(inc.severity))}>{inc.severity}</Badge>
                  <div className="mt-3 text-xl font-semibold tracking-tight">{inc.type}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{inc.description}</div>
                </div>
                <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {format(new Date(inc.timestamp), "HH:mm")}
                  <br />
                  {officer?.name}
                </div>
              </div>
              <div className="mt-4 font-mono text-xs text-muted-foreground">
                {inc.gps.lat.toFixed(4)}, {inc.gps.lng.toFixed(4)} • Session {inc.sessionId}
              </div>
            </Card>
          );
        })}
      </div>
    </CommandLayout>
  );
}
