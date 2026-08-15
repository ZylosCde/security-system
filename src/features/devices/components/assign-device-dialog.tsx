import { Button } from "@/components/ui/button";
import type { Device, Officer } from "@/lib/types";

export interface AssignDeviceForm {
  deviceId: string;
  officerId: string;
}

export function AssignDeviceDialog({
  devices,
  officers,
  form,
  onChange,
  onCancel,
  onAssign,
}: {
  devices: Device[];
  officers: Officer[];
  form: AssignDeviceForm;
  onChange: (form: AssignDeviceForm) => void;
  onCancel: () => void;
  onAssign: () => void;
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
        <h2 className="mb-4 text-xl font-semibold">Assign device to officer</h2>
        <div className="space-y-3">
          <select
            className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
            value={form.deviceId}
            onChange={(e) => onChange({ ...form, deviceId: e.target.value })}
          >
            <option value="">Device</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.model} ({d.id})
              </option>
            ))}
          </select>
          <select
            className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
            value={form.officerId}
            onChange={(e) => onChange({ ...form, officerId: e.target.value })}
          >
            <option value="">Officer</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
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
