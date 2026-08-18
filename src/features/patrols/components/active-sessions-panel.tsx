import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Officer, PatrolSession } from "@/lib/types";

export function ActiveSessionsPanel({
  sessions,
  officers,
  loading,
}: {
  sessions: PatrolSession[];
  officers: Officer[];
  loading: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-1">
        <div className="text-lg font-semibold tracking-tight sm:text-xl">Active Patrol Sessions</div>
        <Badge variant="outline" className="font-mono">
          {sessions.length} LIVE
        </Badge>
      </div>

      <div className="max-h-[360px] overflow-y-auto pr-1.5 space-y-3">
        {loading && sessions.length === 0 ? (
          <Card className="card-premium p-6">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading patrols…
            </div>
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="card-premium p-6 text-center text-muted-foreground">No active patrols</Card>
        ) : null}
        {sessions.map((session) => {
          const officerName =
            session.officerName ?? officers.find((o) => o.id === session.officerId)?.name ?? "Officer";
          const deviceLabel =
            session.deviceName ?? (session.deviceId ? `Device ${session.deviceId}` : "—");
          const progress =
            session.progressPercent ??
            (session.totalCheckpoints > 0
              ? Math.round((session.checkpointsCompleted / session.totalCheckpoints) * 100)
              : 0);

          return (
            <Card key={session.id} className="card-premium p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="font-mono text-xs tracking-wide text-muted-foreground">
                    #{session.id}
                    {session.siteName ? ` · ${session.siteName}` : ""}
                  </div>
                  <div className="mt-px text-base font-semibold tracking-tight sm:text-lg">
                    {officerName}
                  </div>
                  <div className="text-xs text-muted-foreground">{deviceLabel}</div>
                </div>
                <Badge
                  className={cn(
                    "shrink-0 self-start font-mono text-[10px]",
                    session.status === "in-progress" &&
                      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                    session.status === "paused" &&
                      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  )}
                  variant="outline"
                >
                  {session.status === "paused" ? "PAUSED (VO)" : "IN PROGRESS"}
                </Badge>
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex justify-between font-mono text-xs text-muted-foreground">
                  <div>PROGRESS</div>
                  <div>
                    {session.checkpointsCompleted} / {session.totalCheckpoints} CHECKPOINTS
                  </div>
                </div>
                <div className="patrol-progress">
                  <div className="patrol-progress-bar" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
                <div className="min-w-0 flex-1 font-mono text-muted-foreground tabular-nums">
                  Started {format(new Date(session.startTime), "HH:mm")}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
