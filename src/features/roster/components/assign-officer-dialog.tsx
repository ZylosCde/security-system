import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Officer } from "@/lib/types";

export interface AssignOfficerForm {
  officerId: string;
  shiftStart: string;
  shiftEnd: string;
}

export function AssignOfficerDialog({
  officers,
  form,
  onChange,
  onCancel,
  onAssign,
}: {
  officers: Officer[];
  form: AssignOfficerForm;
  onChange: (form: AssignOfficerForm) => void;
  onCancel: () => void;
  onAssign: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <h2 className="mb-4 text-xl font-semibold">Assign officer</h2>
        <div className="space-y-3">
          <select
            className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
            value={form.officerId}
            onChange={(e) => onChange({ ...form, officerId: e.target.value })}
          >
            <option value="">Select officer</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Shift start</label>
              <Input
                type="datetime-local"
                value={form.shiftStart}
                onChange={(e) => onChange({ ...form, shiftStart: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Shift end</label>
              <Input
                type="datetime-local"
                value={form.shiftEnd}
                onChange={(e) => onChange({ ...form, shiftEnd: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onAssign}>
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}
