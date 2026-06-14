"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function PatrolsPage() {
  const { sessions, loading, refreshPatrols } = usePatrolStore();

  useEffect(() => {
    void refreshPatrols();
  }, [refreshPatrols]);

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
            Patrols
          </div>
        </>
      }
      headerActions={
        <Button
          variant="outline"
          className="h-11 gap-2 rounded-2xl"
          onClick={() => void refreshPatrols()}
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <Card className="card-premium overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Patrol</TableHead>
                <TableHead>Officer</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Loading patrols…
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No patrols recorded
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s) => {
                  const pct =
                    s.progressPercent ??
                    (s.totalCheckpoints > 0
                      ? Math.round(
                          (s.checkpointsCompleted / s.totalCheckpoints) * 100
                        )
                      : 0);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="pl-6 font-mono text-sm">#{s.id}</TableCell>
                      <TableCell>{s.officerName ?? s.officerId}</TableCell>
                      <TableCell>{s.siteName ?? "—"}</TableCell>
                      <TableCell>
                        {s.checkpointsCompleted}/{s.totalCheckpoints} ({pct}%)
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border",
                            s.status === "in-progress" &&
                              "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                            s.status === "completed" &&
                              "border-border bg-muted text-muted-foreground"
                          )}
                        >
                          {s.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {format(new Date(s.startTime), "MMM d HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </CommandLayout>
  );
}
