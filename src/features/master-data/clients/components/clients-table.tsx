import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import type { ApiClient } from "@/lib/api-types";

export function ClientsTable({ clients, loading }: { clients: ApiClient[]; loading: boolean }) {
  return (
    <Card className="card-premium overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                No clients
              </TableCell>
            </TableRow>
          ) : (
            clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                <TableCell>{c.site?.name ?? `Site #${c.siteId}`}</TableCell>
                <TableCell className="text-muted-foreground">{c.description ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
