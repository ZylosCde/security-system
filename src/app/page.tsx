"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle,
  Play,
  Battery,
  Signal,
  QrCode,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { officers, devices, checkpoints } from "@/lib/mockData";
import type { PatrolSession } from "@/lib/types";
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

function LiveMap({ sessions }: { sessions: PatrolSession[] }) {
  const [positions, setPositions] = useState(
    sessions.map((s) => ({
      id: s.id,
      lat: s.currentLocation?.lat || 6.927,
      lng: s.currentLocation?.lng || 79.861,
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((p) => ({
          ...p,
          lat: p.lat + (Math.random() - 0.5) * 0.0006,
          lng: p.lng + (Math.random() - 0.5) * 0.0008,
        }))
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const mapWidth = 520;
  const mapHeight = 320;

  const toPixel = (lat: number, lng: number) => ({
    x: ((lng - 79.85) / 0.02) * mapWidth,
    y: ((6.93 - lat) / 0.02) * mapHeight,
  });

  return (
    <div className="map-container relative h-[min(20rem,70vw)] w-full max-w-full sm:h-[320px]">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(100,100,100,0.18)_0.5px,transparent_1px)] bg-[length:20px_20px] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_0.5px,transparent_1px)]" />

      <div className="absolute top-[18%] left-[22%] h-[46%] w-[38%] rounded border border-border/60 bg-muted/20" />
      <div className="absolute top-[32%] left-[66%] h-[32%] w-[24%] rounded border border-border/60 bg-muted/20" />

      {checkpoints.slice(0, 4).map((cp) => {
        const pos = toPixel(cp.lat, cp.lng);
        return (
          <div
            key={cp.id}
            className="checkpoint-marker"
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            title={cp.name}
          />
        );
      })}

      <AnimatePresence>
        {positions.map((pos, idx) => {
          const pixel = toPixel(pos.lat, pos.lng);
          const session = sessions[idx];
          const officer = officers.find((o) => o.id === session.officerId);

          return (
            <motion.div
              key={pos.id}
              className="officer-marker bg-emerald-400"
              style={{
                left: `${Math.max(8, Math.min(pixel.x, mapWidth - 24))}px`,
                top: `${Math.max(8, Math.min(pixel.y, mapHeight - 24))}px`,
              }}
              animate={{
                left: `${Math.max(8, Math.min(pixel.x, mapWidth - 24))}px`,
                top: `${Math.max(8, Math.min(pixel.y, mapHeight - 24))}px`,
              }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="absolute -top-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-px font-mono text-[10px] text-popover-foreground tracking-[1px] shadow-sm">
                {officer?.name.split(" ")[0]}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="absolute right-3 bottom-3 flex items-center gap-3 rounded-lg border border-border bg-card/95 px-3 py-1.5 font-mono text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Officer
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Checkpoint
        </div>
      </div>

      <div className="absolute top-3 left-3 font-mono text-[10px] tracking-[3px] text-muted-foreground">
        LIVE • COLOMBO 6
      </div>
    </div>
  );
}

const STAT_CONFIG = [
  {
    label: "Active Patrols",
    key: "patrols" as const,
    icon: Play,
    iconWrap: "bg-emerald-500/10",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Compliance Rate",
    key: "compliance" as const,
    icon: CheckCircle,
    iconWrap: "bg-emerald-500/10",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Open SOS Alerts",
    key: "sos" as const,
    icon: AlertTriangle,
    iconWrap: "bg-red-500/10",
    iconClass: "text-red-600 dark:text-red-400",
  },
  {
    label: "Pending Violations",
    key: "violations" as const,
    icon: AlertTriangle,
    iconWrap: "bg-amber-500/10",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
];

export default function AegisCommandCenter() {
  const {
    sessions,
    violations: activeViolations,
    sosEvents: activeSOS,
    resolveViolation,
    resolveSOS,
    simulateRandomPatrolTick,
  } = usePatrolStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (Math.random() > 0.85) {
        simulateRandomPatrolTick();
      }
    }, 6500);
    return () => clearInterval(timer);
  }, [simulateRandomPatrolTick]);

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
    activePatrols: sessions.filter((s) => s.status === "in-progress").length,
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
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" /> Alerts{" "}
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px] tabular-nums">
                {stats.openSOS + stats.pendingViolations}
              </Badge>
            </Button>
          </>
        }
      >
        <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {STAT_CONFIG.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.key}
                  className="card-premium flex items-center justify-between p-4 sm:p-6"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs tracking-widest text-muted-foreground">
                      {stat.label.toUpperCase()}
                    </div>
                    <div className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums sm:text-5xl sm:tracking-tighter">
                      {statValues[stat.key]}
                    </div>
                  </div>
                  <div className={cn("shrink-0 rounded-2xl p-3", stat.iconWrap)}>
                    <Icon className={cn("h-6 w-6", stat.iconClass)} />
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
                    Updated every 4 seconds • 2 officers on patrol
                  </div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 self-start sm:self-auto">
                  Expand Map
                </Button>
              </div>
              <LiveMap sessions={sessions} />
            </div>

            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between px-1">
                <div className="text-lg font-semibold tracking-tight sm:text-xl">
                  Active Patrol Sessions
                </div>
                <Badge variant="outline" className="font-mono">
                  2 LIVE
                </Badge>
              </div>

              {sessions.map((session) => {
                const officer = officers.find((o) => o.id === session.officerId)!;
                const device = devices.find((d) => d.id === session.deviceId)!;
                const progress = Math.round(
                  (session.checkpointsCompleted / session.totalCheckpoints) * 100
                );

                return (
                  <Card key={session.id} className="card-premium p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="font-mono text-xs tracking-wide text-muted-foreground">
                          {session.id}
                        </div>
                        <div className="mt-px text-base font-semibold tracking-tight sm:text-lg">
                          {officer.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {device.model} • {device.id}
                        </div>
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
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Battery className="h-3.5 w-3.5" /> {device.battery}%
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Signal className="h-3.5 w-3.5" /> {device.signal} bars
                      </div>
                      <div className="min-w-0 flex-1 text-right font-mono text-muted-foreground tabular-nums">
                        Started {format(new Date(session.startTime), "HH:mm")}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                        className="sos-alert mb-3 flex flex-col gap-3 rounded-2xl border p-4 last:mb-0 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                      >
                        <div className="min-w-0">
                          <div className="mb-px font-mono text-xs tracking-widest text-red-600 dark:text-red-400">
                            SOS-{sos.id}
                          </div>
                          <div className="text-base font-semibold sm:text-lg">
                            {officer?.name} • {format(new Date(sos.triggeredAt), "HH:mm")}
                          </div>
                          <div className="text-xs text-muted-foreground dark:text-red-200/70">
                            Location broadcast active • GPS: {sos.gps.lat.toFixed(4)},{" "}
                            {sos.gps.lng.toFixed(4)}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleResolveSOS(sos.id)}
                          variant="destructive"
                          className="shrink-0 rounded-full px-6"
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
            <Button
              className="h-12 flex-1 gap-2 rounded-2xl text-sm sm:h-14 sm:text-base"
              onClick={() => toast.success("New route template created")}
            >
              CREATE NEW ROUTE TEMPLATE
            </Button>
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
