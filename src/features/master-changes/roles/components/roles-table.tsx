import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { ApiRole } from "@/lib/api-types";

export function RolesTable({
  roles,
  loading,
  canWrite,
  onEdit,
  onDelete,
}: {
  roles: ApiRole[];
  loading: boolean;
  canWrite: boolean;
  onEdit: (role: ApiRole) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="card-premium overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>Description</TableHead>
            {canWrite ? <TableHead className="pr-6 text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={canWrite ? 3 : 2} className="py-12 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canWrite ? 3 : 2} className="py-12 text-center text-muted-foreground">
                No roles yet
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="pl-6 font-medium">{role.name}</TableCell>
                <TableCell className="text-muted-foreground">{role.description || "—"}</TableCell>
                {canWrite ? (
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(role)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(role.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
