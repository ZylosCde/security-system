import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface EscalatedScheduleSummary {
  id: string;
  siteName: string;
  routeName: string;
  officerName: string;
  timeRange: string;
  type: string;
  severity: string;
  delayMinutes: number;
}

export function ScheduleEscalationPanel({
  escalatedSchedules,
}: {
  escalatedSchedules: EscalatedScheduleSummary[];
}) {
  return (
    <Card className="card-premium p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between text-lg font-semibold tracking-tight sm:text-xl">
        <div className="flex items-center gap-2 text-amber-500">
          <Clock className="h-5 w-5 animate-pulse" /> Schedule Escalation
        </div>
        <Badge variant="destructive" className="font-mono animate-pulse">
          {escalatedSchedules.length} LATE
        </Badge>
      </div>

      <div className="space-y-4">
        {escalatedSchedules.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No pending schedule escalations</div>
        ) : (
          escalatedSchedules.map((esc) => (
            <div key={esc.id} className="flex flex-col gap-3 rounded-2xl border border-red-500/10 bg-red-500/5 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="destructive"
                    className={cn(
                      "text-[10px] font-mono rounded px-1.5 py-0.5 font-bold tracking-wide",
                      esc.severity === "Critical" ? "bg-red-500/15 text-red-500" : "bg-orange-500/15 text-orange-500"
                    )}
                  >
                    {esc.type}
                  </Badge>
                  <span className="font-mono text-[10px] text-muted-foreground font-semibold">{esc.id}</span>
                </div>
                <div className="mt-2 text-sm font-semibold tracking-tight leading-tight">{esc.routeName}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {esc.siteName} • {esc.timeRange}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Assigned: <span className="font-semibold text-foreground/80">{esc.officerName}</span>
                </div>
                <div className="text-[11px] font-mono text-red-500 mt-2 flex items-center gap-1.5 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  {esc.delayMinutes} min overdue
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-8 border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl"
                onClick={() => {
                  toast.error("Escalation alert dispatched", {
                    description: `Supervisor alert sent for Officer ${esc.officerName}.`,
                  });
                }}
              >
                Dispatch Warning
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
