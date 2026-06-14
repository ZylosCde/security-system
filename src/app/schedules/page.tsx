"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  History,
  Pause,
  Pencil,
  Play,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";
import { useAuth } from "@/context/AuthContext";
import type { Schedule, ScheduleFrequencyPreset } from "@/lib/types";
import { isoToTimeString, presetFromIntervalMinutes } from "@/lib/scheduleUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FREQUENCY_OPTIONS: { value: ScheduleFrequencyPreset; label: string }[] = [
  { value: "hourly", label: "Every hour" },
  { value: "every-2h", label: "Every 2 hours" },
  { value: "every-4h", label: "Every 4 hours" },
  { value: "every-6h", label: "Every 6 hours" },
  { value: "daily", label: "Daily" },
];

type ScheduleForm = {
  siteId: string;
  startTime: string;
  endTime: string;
  frequency: ScheduleFrequencyPreset;
  officerId: string;
};

const emptyForm: ScheduleForm = {
  siteId: "",
  startTime: "22:00",
  endTime: "06:00",
  frequency: "every-2h",
  officerId: "",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SchedulesPage() {
  const {
    schedules,
    routes,
    officers,
    sites,
    checkpoints,
    createSchedule,
    renewSchedule,
    setScheduleStatus,
    getScheduleHistory,
  } = usePatrolStore();
  const { canWrite } = useAuth();

  const [showCreate, setShowCreate] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [historyScheduleId, setHistoryScheduleId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);

  const activeSchedules = useMemo(
    () => schedules.filter((s) => s.status !== "archived"),
    [schedules]
  );

  const getRouteName = (id: string) =>
    routes.find((r) => r.id === id)?.name || id;
  const getOfficerName = (id?: string) =>
    id ? officers.find((o) => o.id === id)?.name || id : "Unassigned";
  const getSiteCheckpointCount = (siteId: number, siteName?: string) =>
    checkpoints.filter(
      (cp) => cp.siteId === siteId || (siteName && cp.premises === siteName)
    ).length;

  const openCreate = () => {
    setForm(emptyForm);
    setEditingSchedule(null);
    setShowCreate(true);
  };

  const openRenew = (schedule: Schedule) => {
    const preset = presetFromIntervalMinutes(schedule.frequencyIntervalMinutes);
    setForm({
      siteId: String(schedule.siteId),
      startTime: isoToTimeString(schedule.startTime),
      endTime: isoToTimeString(schedule.endTime),
      frequency: preset === "custom" ? "every-2h" : preset,
      officerId: schedule.officerId ?? "",
    });
    setEditingSchedule(schedule);
    setShowCreate(true);
  };

  const handleSubmit = () => {
    if (!form.siteId || !form.startTime || !form.endTime) {
      toast.error("Site, start time, and end time are required");
      return;
    }

    try {
      if (editingSchedule) {
        renewSchedule(editingSchedule.id, {
          startTime: form.startTime,
          endTime: form.endTime,
          frequency: form.frequency,
        });
        toast.success("Schedule renewed", {
          description: `Version ${editingSchedule.version + 1} is now active. Previous saved to history.`,
        });
      } else {
        createSchedule({
          siteId: Number(form.siteId),
          startTime: form.startTime,
          endTime: form.endTime,
          frequency: form.frequency,
          officerId: form.officerId || undefined,
        });
        toast.success("Patrol schedule created", {
          description: "Route auto-generated from site checkpoints",
        });
      }
      setShowCreate(false);
      setEditingSchedule(null);
      setForm(emptyForm);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save schedule");
    }
  };

  const handleToggleStatus = (schedule: Schedule) => {
    const next = schedule.status === "active" ? "paused" : "active";
    setScheduleStatus(schedule.id, next);
    toast.success(
      next === "active" ? "Schedule activated" : "Schedule paused",
      { description: schedule.siteName ?? schedule.id }
    );
  };

  const historyItems = historyScheduleId
    ? getScheduleHistory(historyScheduleId)
    : [];
  const historySchedule = historyScheduleId
    ? schedules.find((s) => s.id === historyScheduleId)
    : null;

  return (
    <>
      <CommandLayout
        header={
          <>
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div className="hidden h-3 w-px bg-border sm:block" />
            <div className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl">
              Patrol Schedules
            </div>
          </>
        }
        headerActions={
          canWrite ? (
            <Button
              onClick={openCreate}
              className="h-11 gap-2 rounded-2xl px-4 sm:px-6"
            >
              <Plus className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Create Schedule</span>
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:p-8">
          {activeSchedules.length === 0 ? (
            <Card className="card-premium p-8 text-center">
              <p className="text-muted-foreground">No patrol schedules yet.</p>
              {canWrite ? (
                <Button onClick={openCreate} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" /> Create first schedule
                </Button>
              ) : null}
            </Card>
          ) : (
            activeSchedules.map((schedule) => {
              const checkpointCount = getSiteCheckpointCount(
                schedule.siteId,
                schedule.siteName
              );
              const route = routes.find((r) => r.id === schedule.routeId);

              return (
                <Card key={schedule.id} className="card-premium p-4 sm:p-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="font-mono text-xs tracking-wide text-muted-foreground">
                        {schedule.id} · v{schedule.version}
                      </div>
                      <div className="mt-1 text-xl font-semibold tracking-tight">
                        {schedule.siteName ?? `Site #${schedule.siteId}`}
                      </div>
                      <div className="mt-px text-sm text-muted-foreground">
                        {getRouteName(schedule.routeId)} ·{" "}
                        {checkpointCount} checkpoint
                        {checkpointCount === 1 ? "" : "s"}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Officer: {getOfficerName(schedule.officerId)}
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0",
                        schedule.status === "active"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      )}
                    >
                      {schedule.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">
                        START
                      </div>
                      <div className="font-mono">{formatTime(schedule.startTime)}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">END</div>
                      <div className="font-mono">{formatTime(schedule.endTime)}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-muted-foreground">
                        FREQUENCY
                      </div>
                      <div>{schedule.recurrence}</div>
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <div className="mb-1 text-xs text-muted-foreground">
                        ROUTE
                      </div>
                      <div className="text-xs">
                        {route?.checkpoints.length ?? 0} stops ·{" "}
                        {route?.expectedDuration ?? "—"} min
                      </div>
                    </div>
                  </div>

                  {canWrite ? (
                    <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleToggleStatus(schedule)}
                      >
                        {schedule.status === "active" ? (
                          <>
                            <Pause className="h-3.5 w-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" /> Activate
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => openRenew(schedule)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Renew
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                        onClick={() => setHistoryScheduleId(schedule.id)}
                      >
                        <History className="h-3.5 w-3.5" /> History
                      </Button>
                    </div>
                  ) : null}
                </Card>
              );
            })
          )}
        </div>
      </CommandLayout>

      {showCreate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            setShowCreate(false);
            setEditingSchedule(null);
          }}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h2 className="mb-1 text-xl font-semibold">
              {editingSchedule ? "Renew schedule" : "Create patrol schedule"}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {editingSchedule
                ? "Update start time and frequency. The current version will be saved to history."
                : "Select a site and patrol window. A route is auto-generated from site checkpoints."}
            </p>

            <div className="space-y-3">
              {!editingSchedule ? (
                <select
                  className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
                  value={form.siteId}
                  onChange={(e) =>
                    setForm({ ...form, siteId: e.target.value })
                  }
                >
                  <option value="">Select site</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  Site: {editingSchedule.siteName ?? editingSchedule.siteId}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Start time
                  </label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    End time
                  </label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Patrol frequency
                </label>
                <select
                  className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      frequency: e.target.value as ScheduleFrequencyPreset,
                    })
                  }
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {!editingSchedule ? (
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Officer (optional)
                  </label>
                  <select
                    className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
                    value={form.officerId}
                    onChange={(e) =>
                      setForm({ ...form, officerId: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {form.siteId && !editingSchedule ? (
                <p className="text-xs text-muted-foreground">
                  {getSiteCheckpointCount(
                    Number(form.siteId),
                    sites.find((s) => s.id === Number(form.siteId))?.name
                  )}{" "}
                  checkpoint(s) will be used for automatic routing.
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreate(false);
                  setEditingSchedule(null);
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                {editingSchedule ? "Renew schedule" : "Create schedule"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {historyScheduleId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setHistoryScheduleId(null)}
          role="presentation"
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h2 className="mb-1 text-xl font-semibold">Schedule history</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {historySchedule?.siteName ?? historyScheduleId} · current v
              {historySchedule?.version ?? "—"}
            </p>

            {historyItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No previous versions yet. Renew or pause to create history entries.
              </p>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-muted/20 p-4 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        v{item.version}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.changeReason}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Start
                        </span>
                        <div className="font-mono">
                          {formatTime(item.startTime)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">End</span>
                        <div className="font-mono">
                          {formatTime(item.endTime)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-muted-foreground">
                      {item.recurrence}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Archived {formatDateTime(item.archivedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="mt-6 w-full"
              onClick={() => setHistoryScheduleId(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
