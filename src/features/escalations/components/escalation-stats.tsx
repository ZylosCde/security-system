import { Card } from "@/components/ui/card";

export function EscalationStats({
  total,
  missedStart,
  overdue,
}: {
  total: number;
  missedStart: number;
  overdue: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="card-premium p-4 sm:p-5 flex flex-col justify-between border-amber-500/20 bg-amber-500/5">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Active Escalations
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-amber-500">{total}</span>
          <span className="text-xs text-muted-foreground">schedules</span>
        </div>
      </Card>
      <Card className="card-premium p-4 sm:p-5 flex flex-col justify-between border-red-500/20 bg-red-500/5">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Missed Starts
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-red-500">{missedStart}</span>
          <span className="text-xs text-muted-foreground">overdue starting</span>
        </div>
      </Card>
      <Card className="card-premium p-4 sm:p-5 flex flex-col justify-between border-orange-500/20 bg-orange-500/5">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Overdue Sessions
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-orange-500">{overdue}</span>
          <span className="text-xs text-muted-foreground">exceeded duration</span>
        </div>
      </Card>
    </div>
  );
}
