import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Officer, PatrolSession, Violation } from "@/lib/types";

export function ViolationsReviewPanel({
  violations,
  sessions,
  officers,
  onAcknowledge,
}: {
  violations: Violation[];
  sessions: PatrolSession[];
  officers: Officer[];
  onAcknowledge: (id: string) => void;
}) {
  return (
    <Card className="card-premium p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between text-lg font-semibold tracking-tight sm:text-xl">
        <div>Violations Requiring Review</div>
        <Badge variant="outline">{violations.length}</Badge>
      </div>

      {violations.length ? (
        violations.map((v) => {
          const session = sessions.find((s) => s.id === v.sessionId);
          const officer = officers.find((o) => o.id === session?.officerId);
          return (
            <div
              key={v.id}
              className="mb-3 flex flex-col gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-4 last:mb-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <div className="font-mono text-xs tracking-widest text-amber-600 dark:text-amber-400">
                  {v.id}
                </div>
                <div className="font-medium tracking-tight">
                  {officer?.name} — {v.reason}
                </div>
                <div className="mt-px text-xs text-muted-foreground">
                  {format(new Date(v.timestamp), "HH:mm")} • {v.type}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 self-start sm:self-auto"
                onClick={() => onAcknowledge(v.id)}
              >
                ACKNOWLEDGE
              </Button>
            </div>
          );
        })
      ) : (
        <div className="py-6 text-center text-muted-foreground">All clear — no open violations</div>
      )}
    </Card>
  );
}
