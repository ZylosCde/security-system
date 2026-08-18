"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Checkpoint, PatrolSession, SOSEvent } from "@/lib/types";

export function LiveMap({
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
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage: "url('/blueprint.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute h-[25%] aspect-square border border-indigo-500/10 rounded-full" />
        <div className="absolute h-[50%] aspect-square border border-indigo-500/10 rounded-full" />
        <div className="absolute h-[75%] aspect-square border border-indigo-500/10 rounded-full" />
        <div className="absolute h-[100%] aspect-square border border-indigo-500/15 rounded-full" />

        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-indigo-500/10" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-indigo-500/10" />

        <div className="absolute w-[100%] h-[100%] origin-center rotate-45 border-l border-r border-indigo-500/[0.04]" />
        <div className="absolute w-[100%] h-[100%] origin-center -rotate-45 border-l border-r border-indigo-500/[0.04]" />
      </div>

      <div className="absolute inset-y-0 aspect-square left-1/2 -translate-x-1/2 pointer-events-none overflow-hidden rounded-full">
        <div className="radar-sweep-conic w-full h-full" />
      </div>

      <div className="absolute top-3 left-4 flex flex-col font-mono text-[9px] text-muted-foreground/60 tracking-wider">
        <span>SYS STATUS: OPERATIONAL</span>
        <span>RANGE: 2.5 KM</span>
      </div>
      <div className="absolute top-3 right-4 flex flex-col items-end font-mono text-[9px] text-muted-foreground/60 tracking-wider">
        <span>LAT CENTER: 06°55&apos;12&quot; N</span>
        <span>LNG CENTER: 79°51&apos;36&quot; E</span>
      </div>

      {checkpoints
        .filter((cp) => cp.lat && cp.lng)
        .slice(0, 8)
        .map((cp) => {
          const pos = toPercent(cp.lat, cp.lng);
          return (
            <div
              key={cp.id}
              className="checkpoint-marker absolute w-2.5 h-2.5 rounded-full"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
              title={cp.name}
            />
          );
        })}

      <AnimatePresence>
        {positions.map((pos) => {
          const pct = toPercent(pos.lat, pos.lng);
          const session = sessions.find((s) => s.id === pos.id);
          const label = session?.officerName?.split(" ")[0] ?? session?.officerId ?? "Officer";
          const hasSOS = activeSOS.some(
            (sos) => sos.officerId === session?.officerId && sos.status === "active"
          );

          return (
            <motion.div
              key={pos.id}
              className={cn(
                "officer-marker h-4.5 w-4.5 rounded-full border-2 border-background shadow-md absolute z-20 flex items-center justify-center",
                hasSOS ? "bg-red-500 officer-marker-sos" : "bg-emerald-500 officer-marker-pulse"
              )}
              style={{
                left: `${pct.x}%`,
                top: `${pct.y}%`,
                transform: "translate(-50%, -50%)",
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
