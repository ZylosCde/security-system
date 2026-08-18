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
import { QrCode } from "lucide-react";
import { toast } from "sonner";
import type { Checkpoint } from "@/lib/types";

export function CheckpointsTable({
  checkpoints,
  loading,
  visibleCount,
  onShowQr,
}: {
  checkpoints: Checkpoint[];
  loading: boolean;
  visibleCount: number;
  onShowQr: (cp: Checkpoint) => void;
}) {
  return (
    <Card className="card-premium overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Checkpoint</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Route order</TableHead>
            <TableHead>GPS</TableHead>
            <TableHead className="pr-6 text-right">QR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && checkpoints.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : checkpoints.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                No checkpoints
              </TableCell>
            </TableRow>
          ) : (
            checkpoints.slice(0, visibleCount).map((cp) => (
              <TableRow key={cp.id}>
                <TableCell className="pl-6 font-medium">{cp.name}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="cursor-pointer rounded-lg border border-border bg-muted/60 px-2 py-1 font-mono text-xs transition-colors hover:bg-muted"
                    onClick={() => {
                      const code = cp.code ?? cp.qrToken;
                      void navigator.clipboard.writeText(code);
                      toast.success("Code copied", { description: code });
                    }}
                  >
                    {cp.code ?? cp.qrToken}
                  </button>
                </TableCell>
                <TableCell>{cp.premises}</TableCell>
                <TableCell className="font-mono text-sm">{cp.routeOrder ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {cp.lat && cp.lng ? `${cp.lat.toFixed(4)}, ${cp.lng.toFixed(4)}` : "—"}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onShowQr(cp)}>
                    <QrCode className="h-3.5 w-3.5" /> Show QR
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {checkpoints.length > visibleCount && (
        <div className="py-4 text-center text-xs text-muted-foreground border-t border-border">
          Showing {Math.min(visibleCount, checkpoints.length)} of {checkpoints.length} checkpoints. Scroll down to load more...
        </div>
      )}
    </Card>
  );
}
