"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CommandLayout } from "@/components/command-layout";
import { toast } from "sonner";
import type { EscalatedSchedule } from "@/features/escalations/types";
import { EscalationStats } from "@/features/escalations/components/escalation-stats";
import { EscalationFilters } from "@/features/escalations/components/escalation-filters";
import { EscalationRow } from "@/features/escalations/components/escalation-row";

export default function ScheduleEscalationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const [localEscalations, setLocalEscalations] = useState<EscalatedSchedule[]>([]);

  const handleResolve = (id: string) => {
    setLocalEscalations((prev) =>
      prev.map((esc) => (esc.id === id ? { ...esc, resolved: true } : esc))
    );
    toast.success(`Escalation for ${id} has been resolved / overridden.`);
  };

  const handleDispatchWarning = (officerName: string) => {
    toast.error("Escalation alert dispatched", {
      description: `Supervisor alert sent for Officer ${officerName}.`,
    });
  };

  const stats = useMemo(() => {
    const active = localEscalations.filter((e) => !e.resolved);
    return {
      total: active.length,
      missedStart: active.filter((e) => e.type === "MISSED START").length,
      overdue: active.filter((e) => e.type === "OVERDUE SESSION").length,
    };
  }, [localEscalations]);

  const sitesList = useMemo(() => {
    const list = new Set(localEscalations.map((e) => e.siteName));
    return Array.from(list);
  }, [localEscalations]);

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
            href="/patrolling"
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
        <EscalationStats
          total={stats.total}
          missedStart={stats.missedStart}
          overdue={stats.overdue}
        />

        <EscalationFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSite={selectedSite}
          onSiteChange={setSelectedSite}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          sites={sitesList}
        />

        <Card className="card-premium overflow-hidden p-0">
          <div className="divide-y divide-border">
            {filteredEscalations.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground font-mono text-sm">
                No schedule escalations matching the filters
              </div>
            ) : (
              filteredEscalations.map((esc) => (
                <EscalationRow
                  key={esc.id}
                  escalation={esc}
                  onDispatchWarning={handleDispatchWarning}
                  onResolve={handleResolve}
                />
              ))
            )}
          </div>
        </Card>
      </div>
    </CommandLayout>
  );
}
