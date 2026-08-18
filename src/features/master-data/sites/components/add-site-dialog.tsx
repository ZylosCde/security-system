import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SiteForm {
  name: string;
  lat: string;
  lng: string;
}

export function AddSiteDialog({
  form,
  onChange,
  onCancel,
  onCreate,
}: {
  form: SiteForm;
  onChange: (form: SiteForm) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <h2 className="mb-4 text-xl font-semibold">New site</h2>
        <div className="space-y-3">
          <Input
            placeholder="Site name"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Latitude"
            value={form.lat}
            onChange={(e) => onChange({ ...form, lat: e.target.value })}
            inputMode="decimal"
          />
          <Input
            placeholder="Longitude"
            value={form.lng}
            onChange={(e) => onChange({ ...form, lng: e.target.value })}
            inputMode="decimal"
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
