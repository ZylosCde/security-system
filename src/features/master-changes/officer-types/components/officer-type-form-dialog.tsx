import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiOfficerType } from "@/lib/api-types";

export interface OfficerTypeForm {
  name: string;
  description: string;
}

export function OfficerTypeFormDialog({
  editingOfficerType,
  form,
  onChange,
  onCancel,
  onSubmit,
}: {
  editingOfficerType: ApiOfficerType | null;
  form: OfficerTypeForm;
  onChange: (form: OfficerTypeForm) => void;
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
        <h2 className="mb-4 text-xl font-semibold">
          {editingOfficerType ? "Edit officer type" : "New officer type"}
        </h2>
        <div className="space-y-3">
          <Input
            placeholder="Type name"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
          />
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onSubmit}>
            {editingOfficerType ? "Save changes" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
