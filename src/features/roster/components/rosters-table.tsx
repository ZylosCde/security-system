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
import { Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import type { ApiRoster } from "@/lib/api-types";

export function RostersTable({
  rosters,
  loading,
  canWrite,
  onView,
  onDelete,
}: {
  rosters: ApiRoster[];
  loading: boolean;
  canWrite: boolean;
  onView: (roster: ApiRoster) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="card-premium overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : rosters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                No rosters yet
              </TableCell>
            </TableRow>
          ) : (
            rosters.map((roster) => (
              <TableRow key={roster.id}>
                <TableCell className="pl-6 font-medium">{roster.name}</TableCell>
                <TableCell>{roster.site?.name ?? `Site #${roster.siteId}`}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {format(new Date(roster.startDate), "MMM d, yyyy HH:mm")}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {format(new Date(roster.endDate), "MMM d, yyyy HH:mm")}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onView(roster)}>
                      <Users className="h-3.5 w-3.5" /> Assignments
                    </Button>
                    {canWrite ? (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(roster.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
