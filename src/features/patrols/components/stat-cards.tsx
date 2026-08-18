import { AlertTriangle, CheckCircle, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MiniTrendline } from "@/features/patrols/components/mini-trendline";

export const STAT_CONFIG = [
  {
    label: "Active Patrols",
    key: "patrols" as const,
    icon: Play,
    iconWrap: "bg-indigo-500/10 dark:bg-indigo-500/20",
    iconClass: "text-indigo-600 dark:text-indigo-400",
    trendData: [1, 2, 1, 3, 2, 4],
    trendColor: "#6366f1",
    trendLabel: "+20% vs last hr",
  },
  {
    label: "Compliance Rate",
    key: "compliance" as const,
    icon: CheckCircle,
    iconWrap: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    trendData: [88, 90, 89, 92, 94, 95],
    trendColor: "#10b981",
    trendLabel: "95% TARGET MET",
  },
  {
    label: "Open SOS Alerts",
    key: "sos" as const,
    icon: AlertTriangle,
    iconWrap: "bg-red-500/10 dark:bg-red-500/20",
    iconClass: "text-red-600 dark:text-red-400",
    trendData: [1, 0, 0, 1, 0, 0],
    trendColor: "#ef4444",
    trendLabel: "CRITICAL PRIORITY",
  },
  {
    label: "Pending Violations",
    key: "violations" as const,
    icon: AlertTriangle,
    iconWrap: "bg-amber-500/10 dark:bg-amber-500/20",
    iconClass: "text-amber-600 dark:text-amber-400",
    trendData: [3, 2, 4, 1, 2, 0],
    trendColor: "#f59e0b",
    trendLabel: "-15% resolve rate",
  },
];

export function StatCards({
  statValues,
  openSOS,
}: {
  statValues: Record<(typeof STAT_CONFIG)[number]["key"], string | number>;
  openSOS: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {STAT_CONFIG.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.key} className="card-premium flex flex-col justify-between p-5 min-h-[140px]">
            <div className="flex items-start justify-between w-full">
              <div className="min-w-0">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground font-semibold">
                  {stat.label.toUpperCase()}
                </div>
                <div className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                  {statValues[stat.key]}
                </div>
              </div>
              <div className={cn("shrink-0 rounded-xl p-2.5", stat.iconWrap)}>
                <Icon className={cn("h-5 w-5", stat.iconClass)} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-wider font-mono",
                  stat.key === "sos" && openSOS > 0 ? "text-red-500 animate-pulse" : "text-muted-foreground"
                )}
              >
                {stat.trendLabel}
              </span>
              <div className="opacity-90 shrink-0">
                <MiniTrendline data={stat.trendData} color={stat.trendColor} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
