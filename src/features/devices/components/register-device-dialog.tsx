import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface RegisterDeviceForm {
  deviceName: string;
  deviceType: string;
  imeiNumber: string;
  siteId: string;
}

export function RegisterDeviceDialog({
  sites,
  form,
  onChange,
  onCancel,
  onCreate,
}: {
  sites: { id: number; name: string }[];
  form: RegisterDeviceForm;
  onChange: (form: RegisterDeviceForm) => void;
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
        <h2 className="mb-4 text-xl font-semibold">Register device</h2>
        <div className="space-y-3">
          <Input
            placeholder="Device name"
            value={form.deviceName}
            onChange={(e) => onChange({ ...form, deviceName: e.target.value })}
          />
          <Input
            placeholder="IMEI"
            value={form.imeiNumber}
            onChange={(e) => onChange({ ...form, imeiNumber: e.target.value })}
          />
          <select
            className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
            value={form.deviceType}
            onChange={(e) => onChange({ ...form, deviceType: e.target.value })}
          >
            <option value="TABLET">TABLET</option>
            <option value="MOBILE">MOBILE</option>
            <option value="LAPTOP">LAPTOP</option>
            <option value="DESKTOP">DESKTOP</option>
          </select>
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
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onCreate}>
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}
