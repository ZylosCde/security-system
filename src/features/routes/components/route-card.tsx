import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Route } from "@/lib/types";

export function RouteCard({
  route,
  getCheckpointName,
}: {
  route: Route;
  getCheckpointName: (id: string) => string;
}) {
  return (
    <Card className="card-premium p-4 sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="font-mono text-xs tracking-wide text-muted-foreground">{route.id}</div>
          <div className="mt-px text-2xl font-semibold tracking-tight">{route.name}</div>
        </div>
        <Badge variant="outline" className="w-fit shrink-0 font-mono text-xs px-3 py-1">
          {route.expectedDuration} min
        </Badge>
      </div>

      <div className="mb-3 text-xs tracking-wide text-muted-foreground uppercase">
        ORDERED CHECKPOINTS
      </div>

      <div className="space-y-2">
        {route.checkpoints.map((cpId, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-[15px]"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 font-mono text-xs text-muted-foreground">
                {(index + 1).toString().padStart(2, "0")}
              </div>
              <div className="font-medium">{getCheckpointName(cpId)}</div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        Recurrence: {route.recurrence}
      </div>
    </Card>
  );
}
