"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import { useAuth } from "@/features/auth/auth-context";
import type { Schedule } from "@/lib/types";
import { isoToTimeString, presetFromIntervalMinutes } from "@/features/schedules/lib/schedule-utils";
import { toast } from "sonner";
import { ScheduleCard } from "@/features/schedules/components/schedule-card";
import {
  ScheduleFormDialog,
  emptyScheduleForm,
  type ScheduleForm,
} from "@/features/schedules/components/schedule-form-dialog";
import { ScheduleHistoryDialog } from "@/features/schedules/components/schedule-history-dialog";

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
  const [form, setForm] = useState<ScheduleForm>(emptyScheduleForm);

  const activeSchedules = useMemo(
    () => schedules.filter((s) => s.status !== "archived"),
    [schedules]
  );

  const getRouteName = (id: string) => routes.find((r) => r.id === id)?.name || id;
  const getOfficerName = (id?: string) =>
    id ? officers.find((o) => o.id === id)?.name || id : "Unassigned";
  const getSiteCheckpointCount = (siteId: number, siteName?: string) =>
    checkpoints.filter((cp) => cp.siteId === siteId || (siteName && cp.premises === siteName)).length;

  const openCreate = () => {
    setForm(emptyScheduleForm);
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
      setForm(emptyScheduleForm);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save schedule");
    }
  };

  const handleToggleStatus = (schedule: Schedule) => {
    const next = schedule.status === "active" ? "paused" : "active";
    setScheduleStatus(schedule.id, next);
    toast.success(next === "active" ? "Schedule activated" : "Schedule paused", {
      description: schedule.siteName ?? schedule.id,
    });
  };

  const historyItems = historyScheduleId ? getScheduleHistory(historyScheduleId) : [];
  const historySchedule = historyScheduleId
    ? schedules.find((s) => s.id === historyScheduleId)
    : undefined;

  return (
    <>
      <CommandLayout
        header={
          <>
            <Link
              href="/patrolling"
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
            <Button onClick={openCreate} className="h-11 gap-2 rounded-2xl px-4 sm:px-6">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Create Schedule</span>
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
            activeSchedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                route={routes.find((r) => r.id === schedule.routeId)}
                checkpointCount={getSiteCheckpointCount(schedule.siteId, schedule.siteName)}
                routeName={getRouteName(schedule.routeId)}
                officerName={getOfficerName(schedule.officerId)}
                canWrite={canWrite}
                onToggleStatus={handleToggleStatus}
                onRenew={openRenew}
                onShowHistory={setHistoryScheduleId}
              />
            ))
          )}
        </div>
      </CommandLayout>

      {showCreate && (
        <ScheduleFormDialog
          editingSchedule={editingSchedule}
          form={form}
          onChange={setForm}
          sites={sites}
          officers={officers}
          getSiteCheckpointCount={getSiteCheckpointCount}
          onCancel={() => {
            setShowCreate(false);
            setEditingSchedule(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {historyScheduleId && (
        <ScheduleHistoryDialog
          scheduleId={historyScheduleId}
          schedule={historySchedule}
          historyItems={historyItems}
          onClose={() => setHistoryScheduleId(null)}
        />
      )}
    </>
  );
}
