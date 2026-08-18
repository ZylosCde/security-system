import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Schedule, ScheduleFrequencyPreset } from "@/lib/types";

const FREQUENCY_OPTIONS: { value: ScheduleFrequencyPreset; label: string }[] = [
  { value: "hourly", label: "Every hour" },
  { value: "every-2h", label: "Every 2 hours" },
  { value: "every-4h", label: "Every 4 hours" },
  { value: "every-6h", label: "Every 6 hours" },
  { value: "daily", label: "Daily" },
];

export type ScheduleForm = {
  siteId: string;
  startTime: string;
  endTime: string;
  frequency: ScheduleFrequencyPreset;
  officerId: string;
};

export const emptyScheduleForm: ScheduleForm = {
  siteId: "",
  startTime: "22:00",
  endTime: "06:00",
  frequency: "every-2h",
  officerId: "",
};

export function ScheduleFormDialog({
  editingSchedule,
  form,
  onChange,
  sites,
  officers,
  getSiteCheckpointCount,
  onCancel,
  onSubmit,
}: {
  editingSchedule: Schedule | null;
  form: ScheduleForm;
  onChange: (form: ScheduleForm) => void;
  sites: { id: number; name: string }[];
  officers: { id: string; name: string }[];
  getSiteCheckpointCount: (siteId: number, siteName?: string) => number;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
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
              onChange={(e) => onChange({ ...form, siteId: e.target.value })}
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
              <label className="mb-1 block text-xs text-muted-foreground">Start time</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => onChange({ ...form, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">End time</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => onChange({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Patrol frequency</label>
            <select
              className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
              value={form.frequency}
              onChange={(e) =>
                onChange({ ...form, frequency: e.target.value as ScheduleFrequencyPreset })
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
                onChange={(e) => onChange({ ...form, officerId: e.target.value })}
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
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onSubmit}>
            {editingSchedule ? "Renew schedule" : "Create schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
