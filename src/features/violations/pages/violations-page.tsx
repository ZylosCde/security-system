"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import { ViolationRow } from "@/features/violations/components/violation-row";
import { toast } from "sonner";

export default function ViolationsPage() {
  const { violations, resolveViolation, sessions, officers } = usePatrolStore();
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

  const handleAcknowledge = (id: string) => {
    resolveViolation(id);
    toast.success("Violation acknowledged");
  };

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
            {violations.slice(0, visibleCount).map((v) => {
              const session = sessions.find((s) => s.id === v.sessionId);
              const officer = officers.find((o) => o.id === session?.officerId);
              return (
                <ViolationRow
                  key={v.id}
                  violation={v}
                  officerName={officer?.name}
                  onAcknowledge={handleAcknowledge}
                />
              );
            })}
          </div>
          {violations.length > visibleCount && (
            <div className="py-4 text-center text-xs text-muted-foreground border-t border-border">
              Showing {Math.min(visibleCount, violations.length)} of {violations.length} violations. Scroll down to load more...
            </div>
          )}
        </Card>
      </div>
    </CommandLayout>
  );
}
