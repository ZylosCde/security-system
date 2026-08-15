"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import * as api from "@/lib/api-client";
import type { ApiRosterAssignment, ApiSchedule } from "@/lib/api-types";
import type { Checkpoint } from "@/lib/types";

const TASK_STATUSES = ["PENDING", "COMPLETED", "MISSED"] as const;

export function ScheduleTasksDialog({
  assignment,
  checkpoints,
  onClose,
}: {
  assignment: ApiRosterAssignment;
  checkpoints: Checkpoint[];
  onClose: () => void;
}) {
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [taskForm, setTaskForm] = useState<{ scheduleId: number | null; checkpointId: string; scheduledTime: string }>({
    scheduleId: null,
    checkpointId: "",
    scheduledTime: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listSchedules(assignment.officerId);
      setSchedules(res.schedules.filter((s) => s.rosterAssignmentId === assignment.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [assignment.id, assignment.officerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreateSchedule = async () => {
    if (!newDate) {
      toast.error("Date is required");
      return;
    }
    try {
      await api.createSchedule({
        rosterAssignmentId: assignment.id,
        officerId: assignment.officerId,
        date: newDate,
      });
      toast.success("Schedule created");
      setNewDate("");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await api.deleteSchedule(id);
      toast.success("Schedule removed");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleAddTask = async (scheduleId: number) => {
    if (!taskForm.checkpointId || !taskForm.scheduledTime) {
      toast.error("Checkpoint and time are required");
      return;
    }
    try {
      await api.addScheduleTask(scheduleId, {
        checkpointId: Number(taskForm.checkpointId),
        scheduledTime: new Date(taskForm.scheduledTime).toISOString(),
      });
      toast.success("Task added");
      setTaskForm({ scheduleId: null, checkpointId: "", scheduledTime: "" });
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Add task failed");
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, status: string) => {
    try {
      await api.updateScheduleTaskStatus(taskId, status);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleRemoveTask = async (taskId: number) => {
    try {
      await api.removeScheduleTask(taskId);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <h2 className="mb-1 text-xl font-semibold">Checkpoint tasks</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {assignment.officer?.officerName ?? `Officer #${assignment.officerId}`} · Shift{" "}
          {format(new Date(assignment.shiftStart), "MMM d HH:mm")} –{" "}
          {format(new Date(assignment.shiftEnd), "HH:mm")}
        </p>

        <div className="flex gap-2 rounded-2xl border border-border bg-muted/30 p-3">
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="h-10"
          />
          <Button className="h-10 gap-1.5 shrink-0" onClick={() => void handleCreateSchedule()}>
            <Plus className="h-3.5 w-3.5" /> New schedule
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading…</div>
          ) : schedules.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No schedules for this assignment yet
            </div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm font-semibold">
                    {format(new Date(schedule.date), "EEEE, MMM d yyyy")}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => void handleDeleteSchedule(schedule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  {(schedule.tasks ?? []).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {task.checkpoint?.name || `Checkpoint #${task.checkpointId}`}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {format(new Date(task.scheduledTime), "HH:mm")}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <select
                          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                          value={task.status}
                          onChange={(e) => void handleUpdateTaskStatus(task.id, e.target.value)}
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <Button variant="ghost" size="sm" onClick={() => void handleRemoveTask(task.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {taskForm.scheduleId === schedule.id ? (
                  <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-3">
                    <select
                      className="h-9 rounded-md border border-border bg-muted/50 px-2 text-sm"
                      value={taskForm.checkpointId}
                      onChange={(e) => setTaskForm({ ...taskForm, checkpointId: e.target.value })}
                    >
                      <option value="">Checkpoint</option>
                      {checkpoints.map((cp) => (
                        <option key={cp.id} value={cp.id}>
                          {cp.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="datetime-local"
                      className="h-9 w-auto"
                      value={taskForm.scheduledTime}
                      onChange={(e) => setTaskForm({ ...taskForm, scheduledTime: e.target.value })}
                    />
                    <Button size="sm" onClick={() => void handleAddTask(schedule.id)}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTaskForm({ scheduleId: null, checkpointId: "", scheduledTime: "" })}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 gap-1.5"
                    onClick={() =>
                      setTaskForm({ scheduleId: schedule.id, checkpointId: "", scheduledTime: "" })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> Add task
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        <Button variant="outline" className="mt-6 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
