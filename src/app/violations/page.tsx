"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ViolationsPage() {
  const { violations, resolveViolation, sessions, officers } = usePatrolStore();

  const handleAcknowledge = (id: string) => {
    resolveViolation(id);
    toast.success("Violation acknowledged");
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
            Violation Log
          </div>
        </>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="card-premium overflow-hidden p-0">
          <div className="divide-y divide-border">
            {violations.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">No violations recorded</div>
            )}
            {violations.map((v) => {
              const session = sessions.find((s) => s.id === v.sessionId);
              const officer = officers.find((o) => o.id === session?.officerId);
              return (
                <div
                  key={v.id}
                  className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="min-w-0">
                      <div className="font-mono text-xs tracking-widest text-amber-600 dark:text-amber-400">
                        {v.id}
                      </div>
                      <div className="mt-px font-medium">
                        {officer?.name} — {v.reason}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {format(new Date(v.timestamp), "HH:mm")} • {v.type} • {v.gps.lat.toFixed(4)},{" "}
                        {v.gps.lng.toFixed(4)}
                      </div>
                    </div>
                    {v.critical && (
                      <Badge variant="destructive" className="shrink-0 self-start sm:mt-1">
                        CRITICAL
                      </Badge>
                    )}
                  </div>
                  {!v.resolved ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 self-start sm:self-auto"
                      onClick={() => handleAcknowledge(v.id)}
                    >
                      Acknowledge
                    </Button>
                  ) : (
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">RESOLVED</div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </CommandLayout>
  );
}
