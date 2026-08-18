"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Bell, Clock, QrCode, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SOSEvent } from "@/lib/types";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import { calculateComplianceRate } from "@/features/patrols/lib/route-engine";
import {
  playIncidentSound,
  playSOSAlertSound,
  playViolationSound,
} from "@/features/patrols/lib/alert-sounds";
import { format } from "date-fns";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { CommandLayout } from "@/components/command-layout";
import { cn } from "@/lib/utils";
import { LiveMap } from "@/features/patrols/components/live-map";
import { StatCards } from "@/features/patrols/components/stat-cards";
import { ActiveSessionsPanel } from "@/features/patrols/components/active-sessions-panel";
import { TelemetryFeed, type ActivityLogEntry } from "@/features/patrols/components/telemetry-feed";
import { AudioController } from "@/features/patrols/components/audio-controller";
import { SosEventsPanel } from "@/features/patrols/components/sos-events-panel";
import { ViolationsReviewPanel } from "@/features/patrols/components/violations-review-panel";
import {
  ScheduleEscalationPanel,
  type EscalatedScheduleSummary,
} from "@/features/patrols/components/schedule-escalation-panel";

const DeviceSimulator = dynamic(
  () => import("@/features/devices/components/device-simulator").then((m) => m.DeviceSimulator),
  { ssr: false }
);

export default function CatalystDigitalCommandCenter() {
  const {
    sessions,
    checkpoints,
    officers,
    violations: activeViolations,
    sosEvents: activeSOS,
    incidents,
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
  const [isMuted, setIsMuted] = useState(true);
  const [enableSOSEventSound, setEnableSOSEventSound] = useState(true);
  const [enableViolationSound, setEnableViolationSound] = useState(true);
  const [enableIncidentSound, setEnableIncidentSound] = useState(true);
  const [isTestingSOSBlink, setIsTestingSOSBlink] = useState(false);
  const [testSOSEvent, setTestSOSEvent] = useState<SOSEvent | null>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  const prevViolationsCountRef = useRef(activeViolations.length);
  const prevIncidentsCountRef = useRef(incidents.length);

  const handleTestSOS = () => {
    playSOSAlertSound();
    setIsTestingSOSBlink(true);
    setTestSOSEvent({
      id: "TEST",
      sessionId: "PS-3921",
      officerId: "O-101",
      triggeredAt: new Date().toISOString(),
      status: "active",
      gps: { lat: 6.9586, lng: 79.9142 },
    });
    setTimeout(() => {
      setIsTestingSOSBlink(false);
      setTestSOSEvent(null);
    }, 6000);
  };

  const displayedSOS = useMemo(() => {
    const list = [...activeSOS];
    if (testSOSEvent) {
      list.push(testSOSEvent);
    }
    return list;
  }, [activeSOS, testSOSEvent]);

  const hasActiveSOSAlert =
    (displayedSOS.some((s) => s.status === "active") && !isMuted && enableSOSEventSound) ||
    isTestingSOSBlink;

  const escalatedSchedules: EscalatedScheduleSummary[] = useMemo(() => [], []);

  const activeSessions = sessions.filter((s) => s.status === "in-progress" || s.status === "paused");

  const activityLogs = useMemo(() => {
    const logs: ActivityLogEntry[] = [];

    for (const s of sessions) {
      if (s.startTime) {
        logs.push({
          id: `patrol-start-${s.id}`,
          time: new Date(s.startTime),
          message: `Patrol #${s.id} started by ${s.officerName ?? `Officer #${s.officerId}`}`,
          type: "info",
        });
      }
      if (s.status === "completed") {
        logs.push({
          id: `patrol-end-${s.id}`,
          time: new Date(),
          message: `Patrol #${s.id} completed successfully`,
          type: "success",
        });
      }
    }

    for (const v of activeViolations) {
      logs.push({
        id: `violation-${v.id}`,
        time: new Date(v.timestamp),
        message: `Violation flagged: ${v.reason}`,
        type: "warning",
      });
    }

    for (const s of activeSOS) {
      if (s.status === "active") {
        logs.push({
          id: `sos-${s.id}`,
          time: new Date(s.triggeredAt),
          message: `EMERGENCY: SOS triggered by Officer #${s.officerId}`,
          type: "error",
        });
      }
    }

    return logs.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);
  }, [sessions, activeViolations, activeSOS]);

  useEffect(() => {
    const activeAlerts = activeSOS.filter((s) => s.status === "active");
    if (activeAlerts.length === 0 || isMuted || !enableSOSEventSound) return;

    const interval = setInterval(() => {
      playSOSAlertSound();
    }, 4000);

    playSOSAlertSound();

    return () => clearInterval(interval);
  }, [activeSOS, isMuted, enableSOSEventSound]);

  useEffect(() => {
    if (activeViolations.length > prevViolationsCountRef.current) {
      if (!isMuted && enableViolationSound) {
        playViolationSound();
      }
    }
    prevViolationsCountRef.current = activeViolations.length;
  }, [activeViolations.length, isMuted, enableViolationSound]);

  useEffect(() => {
    if (incidents.length > prevIncidentsCountRef.current) {
      if (!isMuted && enableIncidentSound) {
        playIncidentSound();
      }
    }
    prevIncidentsCountRef.current = incidents.length;
  }, [incidents.length, isMuted, enableIncidentSound]);

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
    if (id === "TEST") {
      setTestSOSEvent(null);
      setIsTestingSOSBlink(false);
      toast.success("Test SOS alert cleared");
      return;
    }
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

  const statValues = {
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
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Modules
            </Link>
            <div className="hidden h-3 w-px bg-border sm:block" />
            <div className="hidden min-w-0 flex-col gap-1 sm:flex sm:flex-row sm:items-center sm:gap-4">
              <div className="truncate font-mono text-xs tracking-wide text-muted-foreground">
                {format(currentTime, "EEEE d MMM yyyy").toUpperCase()}
              </div>
              <div className="hidden h-3 w-px bg-border sm:block" />
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
            <Button
              variant={isMuted ? "outline" : "secondary"}
              size="sm"
              className={cn(
                "gap-1.5 transition-all duration-300 rounded-2xl",
                !isMuted && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
                isMuted && stats.openSOS > 0 && "border-red-500/40 text-red-600 dark:text-red-400 animate-pulse bg-red-500/10"
              )}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 shrink-0" /> : <Volume2 className="h-3.5 w-3.5 shrink-0" />}
              {isMuted ? "Unmute Audio" : "Mute Audio"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-2xl" onClick={scrollToAlerts}>
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

          <StatCards statValues={statValues} openSOS={stats.openSOS} />

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
              <ActiveSessionsPanel sessions={activeSessions} officers={officers} loading={loading} />

              <div className="mt-6">
                <TelemetryFeed logs={activityLogs} />
              </div>

              <div className="mt-6">
                <AudioController
                  isMuted={isMuted}
                  onToggleMuted={() => setIsMuted(!isMuted)}
                  enableSOSEventSound={enableSOSEventSound}
                  onEnableSOSEventSoundChange={setEnableSOSEventSound}
                  enableViolationSound={enableViolationSound}
                  onEnableViolationSoundChange={setEnableViolationSound}
                  enableIncidentSound={enableIncidentSound}
                  onEnableIncidentSoundChange={setEnableIncidentSound}
                  onTestSOS={handleTestSOS}
                />
              </div>
            </div>
          </div>

          <div ref={alertsRef} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <SosEventsPanel
              activeSOS={displayedSOS.filter((s) => s.status === "active")}
              officers={officers}
              onResolve={handleResolveSOS}
            />

            <ViolationsReviewPanel
              violations={activeViolations.filter((v) => !v.resolved)}
              sessions={sessions}
              officers={officers}
              onAcknowledge={handleAcknowledgeViolation}
            />

            <ScheduleEscalationPanel escalatedSchedules={escalatedSchedules} />
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
              href="/patrolling/checkpoints"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:h-14 sm:text-base"
            >
              MANAGE CHECKPOINTS
            </Link>
          </div>
        </div>
      </CommandLayout>

      <AnimatePresence>{showSimulator && <DeviceSimulator onClose={() => setShowSimulator(false)} />}</AnimatePresence>

      {hasActiveSOSAlert && (
        <div className="fixed inset-0 pointer-events-none z-[99] border-[16px] border-red-600 bg-red-600/10 animate-[pulse_1s_infinite]" />
      )}
    </>
  );
}
