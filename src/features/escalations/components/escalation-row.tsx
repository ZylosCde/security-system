import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EscalatedSchedule } from "@/features/escalations/types";

export function EscalationRow({
  escalation,
  onDispatchWarning,
  onResolve,
}: {
  escalation: EscalatedSchedule;
  onDispatchWarning: (officerName: string) => void;
  onResolve: (id: string) => void;
}) {
  const esc = escalation;
  return (
    <div
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
            Site: <span className="font-semibold text-foreground/80">{esc.siteName}</span> • Shift:{" "}
            {esc.timeRange}
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
              onClick={() => onDispatchWarning(esc.officerName)}
            >
              Dispatch Warning
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-9 rounded-xl gap-1 text-xs"
              onClick={() => onResolve(esc.id)}
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
  );
}
