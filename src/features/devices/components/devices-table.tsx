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
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Device } from "@/lib/types";

function getStatusColor(status: string) {
  if (status === "active")
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  return "border-border bg-muted text-muted-foreground";
}

export function DevicesTable({
  devices,
  loading,
  onShowQr,
}: {
  devices: Device[];
  loading: boolean;
  onShowQr: (device: Device) => void;
}) {
  return (
    <Card className="card-premium overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Device</TableHead>
            <TableHead>IMEI</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right pr-6">QR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && devices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : (
            devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="pl-6 font-mono font-medium">{device.id}</TableCell>
                <TableCell className="font-mono text-sm">{device.imei}</TableCell>
                <TableCell>{device.model}</TableCell>
                <TableCell>
                  {device.siteName ?? (device.siteId ? `Site #${device.siteId}` : "Unassigned")}
                </TableCell>
                <TableCell>
                  <Badge className={cn("border", getStatusColor(device.status))}>
                    {device.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onShowQr(device)}>
                    <QrCode className="h-3.5 w-3.5" /> Show QR
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
