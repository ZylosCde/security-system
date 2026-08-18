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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "lucide-react";
import type { Officer } from "@/lib/types";

export function OfficersTable({
  officers,
  loading,
  onShowQr,
}: {
  officers: Officer[];
  loading: boolean;
  onShowQr: (officer: Officer) => void;
}) {
  return (
    <Card className="card-premium overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[min(280px,40vw)] pl-4 sm:pl-6">Officer</TableHead>
              <TableHead>NIC</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="pr-4 sm:pr-6 text-right">Sign-in QR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && officers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : officers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No officers found
                </TableCell>
              </TableRow>
            ) : (
              officers.map((officer) => (
                <TableRow key={officer.id} className="border-border table-row-hover">
                  <TableCell className="pl-4 sm:pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-muted text-sm font-medium">
                          {officer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium tracking-tight">{officer.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          ID {officer.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">{officer.nic}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{officer.officerType ?? "—"}</Badge>
                  </TableCell>
                  <TableCell className="pr-4 sm:pr-6 text-right">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onShowQr(officer)}>
                      <QrCode className="h-3.5 w-3.5" /> QR
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
