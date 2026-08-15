import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Pause, Pencil, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/features/schedules/lib/format";
import type { Route, Schedule } from "@/lib/types";

export function ScheduleCard({
  schedule,
  route,
  checkpointCount,
  routeName,
  officerName,
  canWrite,
  onToggleStatus,
  onRenew,
  onShowHistory,
}: {
  schedule: Schedule;
  route: Route | undefined;
  checkpointCount: number;
  routeName: string;
  officerName: string;
  canWrite: boolean;
  onToggleStatus: (schedule: Schedule) => void;
  onRenew: (schedule: Schedule) => void;
  onShowHistory: (scheduleId: string) => void;
}) {
  return (
    <Card className="card-premium p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="font-mono text-xs tracking-wide text-muted-foreground">
            {schedule.id} · v{schedule.version}
          </div>
          <div className="mt-1 text-xl font-semibold tracking-tight">
            {schedule.siteName ?? `Site #${schedule.siteId}`}
          </div>
          <div className="mt-px text-sm text-muted-foreground">
            {routeName} · {checkpointCount} checkpoint{checkpointCount === 1 ? "" : "s"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">Officer: {officerName}</div>
        </div>
        <Badge
          className={cn(
            "shrink-0",
            schedule.status === "active"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          )}
        >
          {schedule.status.toUpperCase()}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
        <div>
          <div className="mb-1 text-xs text-muted-foreground">START</div>
          <div className="font-mono">{formatTime(schedule.startTime)}</div>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">END</div>
          <div className="font-mono">{formatTime(schedule.endTime)}</div>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">FREQUENCY</div>
          <div>{schedule.recurrence}</div>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-1 text-xs text-muted-foreground">ROUTE</div>
          <div className="text-xs">
            {route?.checkpoints.length ?? 0} stops · {route?.expectedDuration ?? "—"} min
          </div>
        </div>
      </div>

      {canWrite ? (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onToggleStatus(schedule)}
          >
            {schedule.status === "active" ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Activate
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onRenew(schedule)}>
            <Pencil className="h-3.5 w-3.5" /> Renew
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={() => onShowHistory(schedule.id)}
          >
            <History className="h-3.5 w-3.5" /> History
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
