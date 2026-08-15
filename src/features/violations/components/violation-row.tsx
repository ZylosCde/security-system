import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Violation } from "@/lib/types";

export function ViolationRow({
  violation,
  officerName,
  onAcknowledge,
}: {
  violation: Violation;
  officerName?: string;
  onAcknowledge: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="min-w-0">
          <div className="font-mono text-xs tracking-widest text-amber-600 dark:text-amber-400">
            {violation.id}
          </div>
          <div className="mt-px font-medium">
            {officerName} — {violation.reason}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {format(new Date(violation.timestamp), "HH:mm")} • {violation.type} •{" "}
            {violation.gps.lat.toFixed(4)}, {violation.gps.lng.toFixed(4)}
          </div>
        </div>
        {violation.critical && (
          <Badge variant="destructive" className="shrink-0 self-start sm:mt-1">
            CRITICAL
          </Badge>
        )}
      </div>
      {!violation.resolved ? (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 self-start sm:self-auto"
          onClick={() => onAcknowledge(violation.id)}
        >
          Acknowledge
        </Button>
      ) : (
        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">RESOLVED</div>
      )}
    </div>
  );
}
