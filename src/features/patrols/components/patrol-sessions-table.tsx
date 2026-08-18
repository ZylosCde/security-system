import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { PatrolSession } from "@/lib/types";

export function PatrolSessionsTable({
  sessions,
  loading,
  visibleCount,
}: {
  sessions: PatrolSession[];
  loading: boolean;
  visibleCount: number;
}) {
  return (
    <Card className="card-premium overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Patrol</TableHead>
            <TableHead>Officer</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                Loading patrols…
              </TableCell>
            </TableRow>
          ) : sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                No patrols recorded
              </TableCell>
            </TableRow>
          ) : (
            sessions.slice(0, visibleCount).map((s) => {
              const pct =
                s.progressPercent ??
                (s.totalCheckpoints > 0
                  ? Math.round((s.checkpointsCompleted / s.totalCheckpoints) * 100)
                  : 0);
              return (
                <TableRow key={s.id}>
                  <TableCell className="pl-6 font-mono text-sm">#{s.id}</TableCell>
                  <TableCell>{s.officerName ?? s.officerId}</TableCell>
                  <TableCell>{s.siteName ?? "—"}</TableCell>
                  <TableCell>
                    {s.checkpointsCompleted}/{s.totalCheckpoints} ({pct}%)
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "border",
                        s.status === "in-progress" &&
                          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                        s.status === "completed" &&
                          "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {s.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {format(new Date(s.startTime), "MMM d HH:mm")}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {sessions.length > visibleCount && (
        <div className="py-4 text-center text-xs text-muted-foreground border-t border-border">
          Showing {Math.min(visibleCount, sessions.length)} of {sessions.length} patrols. Scroll down to load more...
        </div>
      )}
    </Card>
  );
}
