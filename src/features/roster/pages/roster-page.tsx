"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { useAuth } from "@/features/auth/auth-context";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import * as api from "@/lib/api-client";
import type { ApiRoster, ApiRosterAssignment } from "@/lib/api-types";
import { toast } from "sonner";
import { RostersTable } from "@/features/roster/components/rosters-table";
import {
  RosterFormDialog,
  type RosterForm,
} from "@/features/roster/components/roster-form-dialog";
import { RosterDetailDialog } from "@/features/roster/components/roster-detail-dialog";
import {
  AssignOfficerDialog,
  type AssignOfficerForm,
} from "@/features/roster/components/assign-officer-dialog";
import { ScheduleTasksDialog } from "@/features/roster/components/schedule-tasks-dialog";

const emptyRosterForm: RosterForm = { siteId: "", name: "", startDate: "", endDate: "" };
const emptyAssignForm: AssignOfficerForm = { officerId: "", shiftStart: "", shiftEnd: "" };

export default function RosterPage() {
  const { sites, officers, checkpoints } = usePatrolStore();
  const { canWrite } = useAuth();

  const [rosters, setRosters] = useState<ApiRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<RosterForm>(emptyRosterForm);

  const [detailRoster, setDetailRoster] = useState<ApiRoster | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignOfficerForm>(emptyAssignForm);
  const [tasksAssignment, setTasksAssignment] = useState<ApiRosterAssignment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listRosters();
      setRosters(res.rosters);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load rosters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const refreshDetail = useCallback(async (id: number) => {
    try {
      const res = await api.getRoster(id);
      setDetailRoster(res.roster);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load roster");
    }
  }, []);

  const openCreate = () => {
    setForm(emptyRosterForm);
    setShowCreate(true);
  };

  const handleCreateRoster = async () => {
    if (!form.siteId || !form.name.trim() || !form.startDate || !form.endDate) {
      toast.error("Site, name, start date, and end date are required");
      return;
    }
    try {
      await api.createRoster({
        siteId: Number(form.siteId),
        name: form.name.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      toast.success("Roster created");
      setShowCreate(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };

  const handleDeleteRoster = async (id: number) => {
    try {
      await api.deleteRoster(id);
      toast.success("Roster deleted");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const openAssign = () => {
    setAssignForm(emptyAssignForm);
    setShowAssign(true);
  };

  const handleAssignOfficer = async () => {
    if (!detailRoster) return;
    if (!assignForm.officerId || !assignForm.shiftStart || !assignForm.shiftEnd) {
      toast.error("Officer, shift start, and shift end are required");
      return;
    }
    try {
      await api.assignRosterOfficer(detailRoster.id, {
        officerId: Number(assignForm.officerId),
        shiftStart: new Date(assignForm.shiftStart).toISOString(),
        shiftEnd: new Date(assignForm.shiftEnd).toISOString(),
      });
      toast.success("Officer assigned");
      setShowAssign(false);
      void refreshDetail(detailRoster.id);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed");
    }
  };

  const handleRemoveAssignment = async (assignment: ApiRosterAssignment) => {
    if (!detailRoster) return;
    try {
      await api.removeRosterAssignment(assignment.id);
      toast.success("Assignment removed");
      void refreshDetail(detailRoster.id);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  };

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
              Duty Roster
            </div>
          </>
        }
        headerActions={
          canWrite ? (
            <Button onClick={openCreate} className="h-11 gap-2 rounded-2xl">
              <Plus className="h-4 w-4" /> New Roster
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          <RostersTable
            rosters={rosters}
            loading={loading}
            canWrite={canWrite}
            onView={(roster) => void refreshDetail(roster.id)}
            onDelete={(id) => void handleDeleteRoster(id)}
          />
        </div>
      </CommandLayout>

      {showCreate && (
        <RosterFormDialog
          sites={sites}
          form={form}
          onChange={setForm}
          onCancel={() => setShowCreate(false)}
          onCreate={() => void handleCreateRoster()}
        />
      )}

      {detailRoster && (
        <RosterDetailDialog
          roster={detailRoster}
          canWrite={canWrite}
          onClose={() => setDetailRoster(null)}
          onAssign={openAssign}
          onRemoveAssignment={(a) => void handleRemoveAssignment(a)}
          onManageTasks={setTasksAssignment}
        />
      )}

      {showAssign && (
        <AssignOfficerDialog
          officers={officers}
          form={assignForm}
          onChange={setAssignForm}
          onCancel={() => setShowAssign(false)}
          onAssign={() => void handleAssignOfficer()}
        />
      )}

      {tasksAssignment && (
        <ScheduleTasksDialog
          assignment={tasksAssignment}
          checkpoints={checkpoints}
          onClose={() => setTasksAssignment(null)}
        />
      )}
    </>
  );
}
