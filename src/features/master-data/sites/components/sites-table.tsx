import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import type { ApiSite } from "@/lib/api-types";

export function SitesTable({ sites, loading }: { sites: ApiSite[]; loading: boolean }) {
  return (
    <Card className="card-premium overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>Latitude</TableHead>
            <TableHead>Longitude</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : sites.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                No sites
              </TableCell>
            </TableRow>
          ) : (
            sites.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="pl-6 font-medium">{s.name}</TableCell>
                <TableCell className="font-mono text-sm">{s.lat}</TableCell>
                <TableCell className="font-mono text-sm">{s.lng}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
