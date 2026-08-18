"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import { IncidentCard } from "@/features/incidents/components/incident-card";

export default function IncidentsPage() {
  const { incidents, sessions, officers } = usePatrolStore();
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100
      ) {
        setVisibleCount((prev) => prev + 15);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            Incident Reports
          </div>
        </>
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {incidents.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No incidents reported</div>
        )}
        {incidents.slice(0, visibleCount).map((inc) => {
          const session = sessions.find((s) => s.id === inc.sessionId);
          const officer = officers.find((o) => o.id === session?.officerId);
          return <IncidentCard key={inc.id} incident={inc} officerName={officer?.name} />;
        })}
        {incidents.length > visibleCount && (
          <div className="py-4 text-center text-xs text-muted-foreground">
            Showing {Math.min(visibleCount, incidents.length)} of {incidents.length} incidents. Scroll down to load more...
          </div>
        )}
      </div>
    </CommandLayout>
  );
}
