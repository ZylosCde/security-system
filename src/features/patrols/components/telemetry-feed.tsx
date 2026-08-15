import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface ActivityLogEntry {
  id: string;
  time: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export function TelemetryFeed({ logs }: { logs: ActivityLogEntry[] }) {
  return (
    <Card className="card-premium p-4 sm:p-6 bg-black/40 border-indigo-500/20 font-mono">
      <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
        <div className="text-sm font-semibold tracking-wider text-indigo-400 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" /> LIVE TELEMETRY FEED
        </div>
        <div className="text-[10px] text-muted-foreground">SECURE LINK · 256-BIT</div>
      </div>
      <div className="space-y-2 h-[220px] overflow-y-auto scrollbar-none text-[11px]">
        {logs.length === 0 ? (
          <div className="text-muted-foreground text-center py-12">Listening for incoming telemetry...</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex gap-2 items-start py-0.5 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.01]"
            >
              <span className="text-muted-foreground">[{format(log.time, "HH:mm:ss")}]</span>
              <span
                className={cn(
                  log.type === "info" && "text-blue-400",
                  log.type === "success" && "text-emerald-400",
                  log.type === "warning" && "text-amber-500",
                  log.type === "error" && "text-red-500 font-bold"
                )}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
