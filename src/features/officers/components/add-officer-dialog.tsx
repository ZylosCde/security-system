import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiOfficerType } from "@/lib/api-types";

export interface NewOfficerForm {
  officerName: string;
  NIC: string;
  officerTypeId: string;
}

export function AddOfficerDialog({
  form,
  officerTypes,
  onChange,
  onCancel,
  onCreate,
}: {
  form: NewOfficerForm;
  officerTypes: ApiOfficerType[];
  onChange: (form: NewOfficerForm) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm dark:bg-black/80"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="mb-1 text-xl font-semibold tracking-tight">Register New Officer</div>
        <div className="mb-6 text-sm text-muted-foreground">
          Officers sign in on mobile with their NIC (national ID).
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs text-muted-foreground">FULL NAME</div>
            <Input
              value={form.officerName}
              onChange={(e) => onChange({ ...form, officerName: e.target.value })}
              className="border-border bg-muted/50"
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs text-muted-foreground">NIC</div>
            <Input
              value={form.NIC}
              onChange={(e) => onChange({ ...form, NIC: e.target.value })}
              className="border-border bg-muted/50 font-mono"
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs text-muted-foreground">OFFICER TYPE</div>
            <select
              className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
              value={form.officerTypeId}
              onChange={(e) => onChange({ ...form, officerTypeId: e.target.value })}
            >
              <option value="">Select type</option>
              {officerTypes.map((ot) => (
                <option key={ot.id} value={ot.id}>
                  {ot.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={onCancel} className="h-12 flex-1 rounded-2xl">
            Cancel
          </Button>
          <Button onClick={onCreate} className="h-12 flex-1 rounded-2xl">
            REGISTER OFFICER
          </Button>
        </div>
      </div>
    </div>
  );
}
