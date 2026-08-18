import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import type { ApiUser } from "@/lib/api-types";

export function UsersTable({
  users,
  loading,
  canWrite,
  currentUserId,
  onDelete,
}: {
  users: ApiUser[];
  loading: boolean;
  canWrite: boolean;
  currentUserId?: number;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="card-premium overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {canWrite ? <TableHead className="text-right pr-6">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={canWrite ? 4 : 3}
                className="py-12 text-center text-muted-foreground"
              >
                Loading…
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="pl-6 font-medium">{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{u.role?.name}</Badge>
                </TableCell>
                {canWrite ? (
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentUserId === u.id}
                      onClick={() => onDelete(u.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
