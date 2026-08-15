import { Button } from "@/components/ui/button";
import { Plus, Trash2, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import type { ApiRoster, ApiRosterAssignment } from "@/lib/api-types";

export function RosterDetailDialog({
  roster,
  canWrite,
  onClose,
  onAssign,
  onRemoveAssignment,
  onManageTasks,
}: {
  roster: ApiRoster;
  canWrite: boolean;
  onClose: () => void;
  onAssign: () => void;
  onRemoveAssignment: (assignment: ApiRosterAssignment) => void;
  onManageTasks: (assignment: ApiRosterAssignment) => void;
}) {
  const assignments = roster.assignments ?? [];
  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{roster.name}</h2>
            <p className="text-sm text-muted-foreground">
              {roster.site?.name ?? `Site #${roster.siteId}`} ·{" "}
              {format(new Date(roster.startDate), "MMM d")} –{" "}
              {format(new Date(roster.endDate), "MMM d, yyyy")}
            </p>
          </div>
          {canWrite ? (
            <Button size="sm" className="shrink-0 gap-1.5" onClick={onAssign}>
              <Plus className="h-3.5 w-3.5" /> Assign officer
            </Button>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          {assignments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No officers assigned yet</div>
          ) : (
            assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {a.officer?.officerName ?? `Officer #${a.officerId}`}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {format(new Date(a.shiftStart), "MMM d HH:mm")} –{" "}
                    {format(new Date(a.shiftEnd), "HH:mm")}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onManageTasks(a)}>
                    <CalendarClock className="h-3.5 w-3.5" /> Tasks
                  </Button>
                  {canWrite ? (
                    <Button variant="ghost" size="sm" onClick={() => onRemoveAssignment(a)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
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
