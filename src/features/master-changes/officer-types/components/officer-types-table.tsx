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
import type { ApiOfficerType } from "@/lib/api-types";

export function OfficerTypesTable({
  officerTypes,
  loading,
  canWrite,
  onEdit,
  onDelete,
}: {
  officerTypes: ApiOfficerType[];
  loading: boolean;
  canWrite: boolean;
  onEdit: (officerType: ApiOfficerType) => void;
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
          ) : officerTypes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canWrite ? 3 : 2} className="py-12 text-center text-muted-foreground">
                No officer types yet
              </TableCell>
            </TableRow>
          ) : (
            officerTypes.map((ot) => (
              <TableRow key={ot.id}>
                <TableCell className="pl-6 font-medium">{ot.name}</TableCell>
                <TableCell className="text-muted-foreground">{ot.description || "—"}</TableCell>
                {canWrite ? (
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(ot)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(ot.id)}>
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
