import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { Officer, SOSEvent } from "@/lib/types";

export function SosEventsPanel({
  activeSOS,
  officers,
  onResolve,
}: {
  activeSOS: SOSEvent[];
  officers: Officer[];
  onResolve: (id: string) => void;
}) {
  return (
    <Card className="card-premium p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-red-600 sm:text-xl dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" /> ACTIVE SOS EVENTS
        </div>
        <div className="font-mono text-xs text-red-600/80 dark:text-red-400/70">CRITICAL PRIORITY</div>
      </div>

      {activeSOS.length > 0 ? (
        activeSOS.map((sos) => {
          const officer = officers.find((o) => o.id === sos.officerId);
          return (
            <div
              key={sos.id}
              className="sos-alert-premium mb-3 flex flex-col gap-3 rounded-2xl p-4 last:mb-0 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="min-w-0">
                <div className="mb-px font-mono text-xs tracking-widest text-red-500 font-semibold animate-pulse">
                  CRITICAL SOS EVENT - SOS-{sos.id}
                </div>
                <div className="text-base font-semibold sm:text-lg text-red-700 dark:text-red-300">
                  {officer?.name || "Officer"} • {format(new Date(sos.triggeredAt), "HH:mm")}
                </div>
                <div className="text-xs text-muted-foreground dark:text-red-200/70 mt-1">
                  GPS Broadcast Active: {sos.gps.lat.toFixed(6)}° N, {sos.gps.lng.toFixed(6)}° E
                </div>
              </div>
              <Button
                onClick={() => onResolve(sos.id)}
                variant="destructive"
                className="shrink-0 rounded-full px-6 font-semibold shadow-lg hover:shadow-red-500/20"
              >
                RESOLVE INCIDENT
              </Button>
            </div>
          );
        })
      ) : (
        <div className="py-8 text-center text-muted-foreground">No active SOS alerts</div>
      )}
    </Card>
  );
}
