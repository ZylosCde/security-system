import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CheckpointForm {
  name: string;
  code: string;
  description: string;
  siteId: string;
  routeOrder: string;
}

export function AddCheckpointDialog({
  sites,
  form,
  onChange,
  onCancel,
  onCreate,
}: {
  sites: { id: number; name: string }[];
  form: CheckpointForm;
  onChange: (form: CheckpointForm) => void;
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
      >
        <h2 className="mb-4 text-xl font-semibold">New checkpoint</h2>
        <div className="space-y-3">
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Code (used in QR)"
            value={form.code}
            onChange={(e) => onChange({ ...form, code: e.target.value })}
          />
          <Input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
          />
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
            placeholder="Route order"
            value={form.routeOrder}
            onChange={(e) => onChange({ ...form, routeOrder: e.target.value })}
            inputMode="numeric"
          />
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
