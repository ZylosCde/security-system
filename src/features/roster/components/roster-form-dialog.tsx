import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface RosterForm {
  siteId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export function RosterFormDialog({
  sites,
  form,
  onChange,
  onCancel,
  onCreate,
}: {
  sites: { id: number; name: string }[];
  form: RosterForm;
  onChange: (form: RosterForm) => void;
  onCancel: () => void;
  onCreate: () => void;
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
        <h2 className="mb-4 text-xl font-semibold">New roster</h2>
        <div className="space-y-3">
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
          <Input
            placeholder="Roster name"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Start date</label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => onChange({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">End date</label>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => onChange({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onCreate}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
