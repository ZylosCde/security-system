import { Card } from "@/components/ui/card";
import type { ApiAssignment } from "@/lib/api-types";

export function DeviceAssignmentsList({ assignments }: { assignments: ApiAssignment[] }) {
  if (assignments.length === 0) return null;
  return (
    <Card className="card-premium p-4 sm:p-6">
      <div className="mb-3 text-sm font-semibold">Officer assignments</div>
      <div className="max-h-[160px] overflow-y-auto pr-1.5">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {assignments.map((a) => (
            <li key={a.id}>
              Assignment #{a.id} — Officer {a.officerId} → Device {a.deviceId}
              {a.site?.name ? ` @ ${a.site.name}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
