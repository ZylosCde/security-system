import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Incident } from "@/lib/types";

function getSeverityColor(sev: string) {
  if (sev === "Critical")
    return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400";
  if (sev === "High")
    return "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400";
  if (sev === "Medium")
    return "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-400";
  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400";
}

export function IncidentCard({
  incident,
  officerName,
}: {
  incident: Incident;
  officerName?: string;
}) {
  return (
    <Card className="card-premium p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <Badge className={cn("border", getSeverityColor(incident.severity))}>
            {incident.severity}
          </Badge>
          <div className="mt-3 text-xl font-semibold tracking-tight">{incident.type}</div>
          <div className="mt-1 text-sm text-muted-foreground">{incident.description}</div>
        </div>
        <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
          {format(new Date(incident.timestamp), "HH:mm")}
          <br />
          {officerName}
        </div>
      </div>
      <div className="mt-4 font-mono text-xs text-muted-foreground">
        {incident.gps.lat.toFixed(4)}, {incident.gps.lng.toFixed(4)} • Session {incident.sessionId}
      </div>
    </Card>
  );
}
