import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiRole } from "@/lib/api-types";

export interface UserForm {
  email: string;
  username: string;
  password: string;
  roleId: string;
}

export function AddUserDialog({
  form,
  roles,
  onChange,
  onCancel,
  onCreate,
}: {
  form: UserForm;
  roles: ApiRole[];
  onChange: (form: UserForm) => void;
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
        <h2 className="mb-4 text-xl font-semibold">New dashboard user</h2>
        <div className="space-y-3">
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="Username"
            value={form.username}
            onChange={(e) => onChange({ ...form, username: e.target.value })}
          />
          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => onChange({ ...form, password: e.target.value })}
          />
          <select
            className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
            value={form.roleId}
            onChange={(e) => onChange({ ...form, roleId: e.target.value })}
          >
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
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
