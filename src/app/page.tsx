"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Play,
  QrCode,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Checkpoint, PatrolSession, SOSEvent } from "@/lib/types";
import { usePatrolStore } from "@/hooks/usePatrolStore";
import { calculateComplianceRate } from "@/lib/routeEngine";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CommandLayout } from "@/components/command-layout";
import { cn } from "@/lib/utils";

const DeviceSimulator = dynamic(
  () => import("@/components/DeviceSimulator").then((m) => m.DeviceSimulator),
  { ssr: false }
);

function MiniTrendline({ data, color }: { data: number[]; color: string }) {
  const width = 60;
  const height = 18;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height + 1;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible opacity-70">
      <defs>
        <linearGradient id={`sparkline-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d={`M 0,${height} L ${points} L ${width},${height} Z`}
        fill={`url(#sparkline-grad-${color.replace('#', '')})`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * height + 1}
          r="1.5"
          fill={color}
        />
      )}
    </svg>
  );
}

function LiveMap({
  sessions,
  checkpoints,
  activeSOS,
}: {
  sessions: PatrolSession[];
  checkpoints: Checkpoint[];
  activeSOS: SOSEvent[];
}) {
  const positions = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.id,
        lat: s.currentLocation?.lat ?? 6.927,
        lng: s.currentLocation?.lng ?? 79.861,
      })),
    [sessions]
  );

  const toPercent = (lat: number, lng: number) => {
    const x = ((lng - 79.85) / 0.02) * 100;
    const y = ((6.93 - lat) / 0.02) * 100;
    return {
      x: Math.max(3, Math.min(97, x)),
      y: Math.max(3, Math.min(97, y)),
    };
  };

  return (
    <div className="map-container relative h-[360px] w-full overflow-hidden rounded-2xl border border-border bg-black/30 dark:bg-black/50 shadow-inner">
      {/* Radar concentric circular grid */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute h-[25%] aspect-square border border-indigo-500/10 rounded-full" />
        <div className="absolute h-[50%] aspect-square border border-indigo-500/10 rounded-full" />
        <div className="absolute h-[75%] aspect-square border border-indigo-500/10 rounded-full" />
        <div className="absolute h-[100%] aspect-square border border-indigo-500/15 rounded-full" />
        
        {/* Radar azimuth angle marking lines */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-indigo-500/10" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-indigo-500/10" />
        
        {/* Diagonal grids */}
        <div className="absolute w-[100%] h-[100%] origin-center rotate-45 border-l border-r border-indigo-500/[0.04]" />
        <div className="absolute w-[100%] h-[100%] origin-center -rotate-45 border-l border-r border-indigo-500/[0.04]" />
      </div>

      {/* Dynamic sweeping line */}
      <div className="absolute inset-y-0 aspect-square left-1/2 -translate-x-1/2 pointer-events-none overflow-hidden rounded-full">
        <div className="radar-sweep-conic w-full h-full" />
      </div>

      {/* Corner coordinates markings */}
      <div className="absolute top-3 left-4 flex flex-col font-mono text-[9px] text-muted-foreground/60 tracking-wider">
        <span>SYS STATUS: OPERATIONAL</span>
        <span>RANGE: 2.5 KM</span>
      </div>
      <div className="absolute top-3 right-4 flex flex-col items-end font-mono text-[9px] text-muted-foreground/60 tracking-wider">
        <span>LAT CENTER: 06°55&apos;12&quot; N</span>
        <span>LNG CENTER: 79°51&apos;36&quot; E</span>
      </div>

      {/* Checkpoint indicators */}
      {checkpoints
        .filter((cp) => cp.lat && cp.lng)
        .slice(0, 8)
        .map((cp) => {
          const pos = toPercent(cp.lat, cp.lng);
          return (
            <div
              key={cp.id}
              className="checkpoint-marker absolute w-2.5 h-2.5 rounded-full"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
              title={cp.name}
            />
          );
        })}

      {/* Active Officers */}
      <AnimatePresence>
        {positions.map((pos) => {
          const pct = toPercent(pos.lat, pos.lng);
          const session = sessions.find((s) => s.id === pos.id);
          const label =
            session?.officerName?.split(" ")[0] ?? session?.officerId ?? "Officer";
          const hasSOS = activeSOS.some((sos) => sos.officerId === session?.officerId && sos.status === "active");

          return (
            <motion.div
              key={pos.id}
              className={cn(
                "officer-marker h-4.5 w-4.5 rounded-full border-2 border-background shadow-md absolute z-20 flex items-center justify-center",
                hasSOS
                  ? "bg-red-500 officer-marker-sos"
                  : "bg-emerald-500 officer-marker-pulse"
              )}
              style={{
                left: `${pct.x}%`,
                top: `${pct.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                left: `${pct.x}%`,
                top: `${pct.y}%`,
              }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <div className="absolute -top-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded border border-border/80 bg-background/95 px-1.5 py-0.5 font-mono text-[9px] text-foreground tracking-[0.5px] shadow-sm font-semibold backdrop-blur-sm">
                {label} {hasSOS && "⚠️"}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute right-3 bottom-3 flex items-center gap-3 rounded-lg border border-border bg-background/90 px-2.5 py-1.5 font-mono text-[9px] text-muted-foreground shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 officer-marker-pulse" /> Officer
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Checkpoint
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 officer-marker-sos" /> SOS Alert
        </div>
      </div>

      <div className="absolute bottom-3 left-4 font-mono text-[9px] tracking-[3px] text-muted-foreground/60 font-semibold">
        RADAR MONITOR • ACTIVE PATROLS
      </div>
    </div>
  );
}

const STAT_CONFIG = [
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

export default function DigitalGUARD360CommandCenter() {
  const {
    sessions,
    checkpoints,
    officers,
    violations: activeViolations,
    sosEvents: activeSOS,
    resolveViolation,
    resolveSOS,
    refreshPatrols,
    loading,
    error,
    clearError,
    refreshAll,
  } = usePatrolStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSimulator, setShowSimulator] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  const activeSessions = sessions.filter((s) => s.status === "in-progress");

  const scrollToAlerts = () => {
    alertsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      void refreshPatrols();
    }, 15000);
    return () => clearInterval(poll);
  }, [refreshPatrols]);

  const handleResolveSOS = (id: string) => {
    resolveSOS(id, "Incident resolved from command center.");
    toast.success("SOS marked resolved", {
      description: "Resolution note saved to audit log.",
    });
  };

  const handleAcknowledgeViolation = (id: string) => {
    resolveViolation(id);
    toast.info("Violation acknowledged", {
      description: "Officer notified. Record updated.",
    });
  };

  const stats = {
    activePatrols: activeSessions.length,
    complianceRate: calculateComplianceRate(sessions),
    openSOS: activeSOS.filter((s) => s.status === "active").length,
    pendingViolations: activeViolations.filter((v) => !v.resolved).length,
  };

  const statValues: Record<(typeof STAT_CONFIG)[number]["key"], string | number> = {
    patrols: stats.activePatrols,
    compliance: `${stats.complianceRate}%`,
    sos: stats.openSOS,
    violations: stats.pendingViolations,
  };

  return (
    <>
      <CommandLayout
        header={
          <>
            <div className="hidden min-w-0 flex-col gap-1 sm:flex sm:flex-row sm:items-center sm:gap-4">
              <div className="truncate font-mono text-xs tracking-wide text-muted-foreground">
                {format(currentTime, "EEEE d MMM yyyy").toUpperCase()}
              </div>
              <div className="hidden h-3 w-px bg-border sm:block" />
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> ALL SYSTEMS
                OPERATIONAL
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:hidden">
              <span className="text-xs font-medium text-muted-foreground">Live Operations</span>
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                {format(currentTime, "HH:mm:ss")}
              </span>
            </div>
          </>
        }
        headerActions={
          <>
            <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 font-mono text-xs sm:flex">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="tabular-nums">{format(currentTime, "HH:mm:ss")}</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={scrollToAlerts}>
              <Bell className="h-4 w-4" /> Alerts{" "}
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px] tabular-nums">
                {stats.openSOS + stats.pendingViolations}
              </Badge>
            </Button>
          </>
        }
      >
        <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
          {error ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => void refreshAll()}>
                  Retry
                </Button>
                <Button size="sm" variant="ghost" onClick={clearError}>
                  Dismiss
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {STAT_CONFIG.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.key}
                  className="card-premium flex flex-col justify-between p-5 min-h-[140px]"
                >
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
                    <span className={cn(
                      "text-[10px] font-semibold tracking-wider font-mono",
                      stat.key === "sos" && stats.openSOS > 0 ? "text-red-500 animate-pulse" : "text-muted-foreground"
                    )}>
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="min-w-0 space-y-4 lg:col-span-3">
              <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold tracking-tight sm:text-xl">
                    Live Officer Positions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated every 15s • {activeSessions.length} officer
                    {activeSessions.length === 1 ? "" : "s"} on patrol
                  </div>
                </div>
              </div>
              <LiveMap sessions={activeSessions} checkpoints={checkpoints} activeSOS={activeSOS} />
            </div>

            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between px-1">
                <div className="text-lg font-semibold tracking-tight sm:text-xl">
                  Active Patrol Sessions
                </div>
                <Badge variant="outline" className="font-mono">
                  {activeSessions.length} LIVE
                </Badge>
              </div>

              {loading && activeSessions.length === 0 ? (
                <Card className="card-premium p-6">
                  <div className="flex items-center justify-center gap-3 text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading patrols…
                  </div>
                </Card>
              ) : activeSessions.length === 0 ? (
                <Card className="card-premium p-6 text-center text-muted-foreground">
                  No active patrols
                </Card>
              ) : null}
              {activeSessions.map((session) => {
                const officerName =
                  session.officerName ??
                  officers.find((o) => o.id === session.officerId)?.name ??
                  "Officer";
                const deviceLabel =
                  session.deviceName ?? (session.deviceId ? `Device ${session.deviceId}` : "—");
                const progress =
                  session.progressPercent ??
                  (session.totalCheckpoints > 0
                    ? Math.round(
                        (session.checkpointsCompleted / session.totalCheckpoints) * 100
                      )
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
                          "shrink-0 self-start",
                          session.status === "in-progress" &&
                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        )}
                      >
                        {session.status.toUpperCase()}
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
                        <div
                          className="patrol-progress-bar"
                          style={{ width: `${progress}%` }}
                        />
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
          </div>

          <div ref={alertsRef} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="card-premium p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-red-600 sm:text-xl dark:text-red-400">
                  <AlertTriangle className="h-5 w-5 shrink-0" /> ACTIVE SOS EVENTS
                </div>
                <div className="font-mono text-xs text-red-600/80 dark:text-red-400/70">
                  CRITICAL PRIORITY
                </div>
              </div>

              {activeSOS.length > 0 ? (
                activeSOS
                  .filter((s) => s.status === "active")
                  .map((sos) => {
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
                          onClick={() => handleResolveSOS(sos.id)}
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

            <Card className="card-premium p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between text-lg font-semibold tracking-tight sm:text-xl">
                <div>Violations Requiring Review</div>
                <Badge variant="outline">{activeViolations.length}</Badge>
              </div>

              {activeViolations.length ? (
                activeViolations.map((v) => {
                  const session = sessions.find((s) => s.id === v.sessionId);
                  const officer = officers.find((o) => o.id === session?.officerId);
                  return (
                    <div
                      key={v.id}
                      className="mb-3 flex flex-col gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-4 last:mb-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-xs tracking-widest text-amber-600 dark:text-amber-400">
                          {v.id}
                        </div>
                        <div className="font-medium tracking-tight">
                          {officer?.name} — {v.reason}
                        </div>
                        <div className="mt-px text-xs text-muted-foreground">
                          {format(new Date(v.timestamp), "HH:mm")} • {v.type}
                        </div>
                      </div>
                      {!v.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 self-start sm:self-auto"
                          onClick={() => handleAcknowledgeViolation(v.id)}
                        >
                          ACKNOWLEDGE
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  All clear — no open violations
                </div>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
            <Button
              className="h-12 flex-1 gap-2 rounded-2xl text-sm sm:h-14 sm:text-base"
              variant="outline"
              onClick={() => setShowSimulator(true)}
            >
              <QrCode className="h-4 w-4 shrink-0" /> OPEN DEVICE SIMULATOR
            </Button>
            <Link
              href="/checkpoints"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:h-14 sm:text-base"
            >
              MANAGE CHECKPOINTS
            </Link>
          </div>
        </div>
      </CommandLayout>

      <AnimatePresence>
        {showSimulator && (
          <DeviceSimulator onClose={() => setShowSimulator(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
