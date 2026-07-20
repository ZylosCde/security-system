"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CommandLayout } from "@/components/command-layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EscalatedSchedule {
  id: string;
  siteName: string;
  routeName: string;
  officerName: string;
  timeRange: string;
  type: "MISSED START" | "OVERDUE SESSION";
  severity: "High" | "Critical";
  delayMinutes: number;
  resolved: boolean;
}

export default function ScheduleEscalationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  
  // Local state for tracking manual overrides/resolutions of escalations
  const [localEscalations, setLocalEscalations] = useState<EscalatedSchedule[]>([
    {
      id: "SCH-081",
      siteName: "VISTA Towers",
      routeName: "VISTA Night Perimeter",
      officerName: "Rohan Silva",
      timeRange: "22:00 – 06:00",
      type: "MISSED START",
      severity: "High",
      delayMinutes: 24,
      resolved: false,
    },
    {
      id: "SCH-094",
      siteName: "Harbour Logistics",
      routeName: "Harbour South Loop",
      officerName: "Amara Perera",
      timeRange: "22:15 – 05:00",
      type: "OVERDUE SESSION",
      severity: "Critical",
      delayMinutes: 42,
      resolved: false,
    },
    {
      id: "SCH-112",
      siteName: "VISTA Towers",
      routeName: "VISTA Dock Patrol",
      officerName: "Anura Bandara",
      timeRange: "01:00 – 09:00",
      type: "MISSED START",
      severity: "High",
      delayMinutes: 12,
      resolved: false,
    }
  ]);

  const handleResolve = (id: string) => {
    setLocalEscalations((prev) =>
      prev.map((esc) => (esc.id === id ? { ...esc, resolved: true } : esc))
    );
    toast.success(`Escalation for ${id} has been resolved / overridden.`);
  };

  const handleDispatchWarning = (officerName: string) => {
    toast.error("Escalation alert dispatched", {
      description: `Supervisor alert sent for Officer ${officerName}.`
    });
  };

  // Compute metrics
  const stats = useMemo(() => {
    const active = localEscalations.filter((e) => !e.resolved);
    return {
      total: active.length,
      missedStart: active.filter((e) => e.type === "MISSED START").length,
      overdue: active.filter((e) => e.type === "OVERDUE SESSION").length,
    };
  }, [localEscalations]);

  // Unique sites for filter
  const sitesList = useMemo(() => {
    const list = new Set(localEscalations.map((e) => e.siteName));
    return ["all", ...Array.from(list)];
  }, [localEscalations]);

  // Filtered escalations list
  const filteredEscalations = useMemo(() => {
    return localEscalations.filter((esc) => {
      const matchesSearch =
        esc.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        esc.officerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        esc.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSite = selectedSite === "all" || esc.siteName === selectedSite;
      const matchesType = selectedType === "all" || esc.type === selectedType;

      return matchesSearch && matchesSite && matchesType;
    });
  }, [localEscalations, searchQuery, selectedSite, selectedType]);

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
          <div className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" /> Schedule Escalation Log
          </div>
        </>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="card-premium p-4 sm:p-5 flex flex-col justify-between border-amber-500/20 bg-amber-500/5">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Active Escalations</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-amber-500">{stats.total}</span>
              <span className="text-xs text-muted-foreground">schedules</span>
            </div>
          </Card>
          <Card className="card-premium p-4 sm:p-5 flex flex-col justify-between border-red-500/20 bg-red-500/5">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Missed Starts</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-red-500">{stats.missedStart}</span>
              <span className="text-xs text-muted-foreground">overdue starting</span>
            </div>
          </Card>
          <Card className="card-premium p-4 sm:p-5 flex flex-col justify-between border-orange-500/20 bg-orange-500/5">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Overdue Sessions</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-orange-500">{stats.overdue}</span>
              <span className="text-xs text-muted-foreground">exceeded duration</span>
            </div>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-muted/30 p-4 rounded-2xl border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by route, officer or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none"
            >
              <option value="all">All Sites</option>
              {sitesList.filter((s) => s !== "all").map((site) => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="MISSED START">Missed Start</option>
              <option value="OVERDUE SESSION">Overdue Session</option>
            </select>
          </div>
        </div>

        {/* Escalation Log List */}
        <Card className="card-premium overflow-hidden p-0">
          <div className="divide-y divide-border">
            {filteredEscalations.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground font-mono text-sm">
                No schedule escalations matching the filters
              </div>
            ) : (
              filteredEscalations.map((esc) => (
                <div
                  key={esc.id}
                  className={cn(
                    "flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 transition-all",
                    esc.resolved && "opacity-60 bg-muted/10"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="destructive"
                          className={cn(
                            "text-[10px] font-mono rounded px-1.5 py-0.5 font-bold tracking-wide",
                            esc.resolved
                              ? "bg-muted text-muted-foreground"
                              : esc.severity === "Critical"
                              ? "bg-red-500/15 text-red-500"
                              : "bg-orange-500/15 text-orange-500"
                          )}
                        >
                          {esc.resolved ? "RESOLVED" : esc.type}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">{esc.id}</span>
                      </div>
                      <div className="mt-2 font-semibold text-base sm:text-lg tracking-tight">
                        {esc.routeName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Site: <span className="font-semibold text-foreground/80">{esc.siteName}</span> • Shift: {esc.timeRange}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Assigned Officer: <span className="font-semibold text-foreground/80">{esc.officerName}</span>
                      </div>
                      {!esc.resolved && (
                        <div className="text-xs font-mono text-red-500 mt-2 flex items-center gap-1.5 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          Delay time: {esc.delayMinutes} minutes overdue
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {!esc.resolved ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl"
                          onClick={() => handleDispatchWarning(esc.officerName)}
                        >
                          Dispatch Warning
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-9 rounded-xl gap-1 text-xs"
                          onClick={() => handleResolve(esc.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono py-1">
                        <CheckCircle2 className="h-4 w-4" /> COMPLETED / OVERRIDDEN
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </CommandLayout>
  );
}
