"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import { PatrolSessionsTable } from "@/features/patrols/components/patrol-sessions-table";

export default function PatrolsPage() {
  const { sessions, loading, refreshPatrols } = usePatrolStore();
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    void refreshPatrols();
  }, [refreshPatrols]);

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
        <PatrolSessionsTable sessions={sessions} loading={loading} visibleCount={visibleCount} />
      </div>
    </CommandLayout>
  );
}
