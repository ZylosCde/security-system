"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, QrCode } from "lucide-react";
import { buildCheckpointQrValue, getCheckpointQRDataURL } from "@/lib/qrService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function CheckpointsPage() {
  const { checkpoints, sites, loading, addCheckpoint } = usePatrolStore();
  const { canWrite } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const [qrCheckpoint, setQrCheckpoint] = useState<{
    name: string;
    code: string;
    dataUrl: string;
    token: string;
  } | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100
      ) {
        setVisibleCount((prev) => prev + 15);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    siteId: "",
    routeOrder: "0",
  });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.siteId) {
      toast.error("Name, code, and site required");
      return;
    }
    try {
      await addCheckpoint({
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        siteId: Number(form.siteId),
        routeOrder: Number(form.routeOrder) || 0,
      });
      toast.success("Checkpoint created");
      setShowAdd(false);
      setForm({ name: "", code: "", description: "", siteId: "", routeOrder: "0" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };

  const showCheckpointQr = (cp: (typeof checkpoints)[number]) => {
    const siteId = cp.siteId ?? sites.find((s) => s.name === cp.premises)?.id;
    if (siteId == null) {
      toast.error("Missing site for this checkpoint");
      return;
    }
    const code = cp.code ?? cp.qrToken;
    const payload = {
      id: cp.id,
      code,
      name: cp.name,
      siteId: Number(siteId),
    };
    const token = buildCheckpointQrValue(payload);
    void getCheckpointQRDataURL(payload).then((dataUrl) =>
      setQrCheckpoint({ name: cp.name, code, dataUrl, token })
    );
  };

  return (
    <>
      <CommandLayout
        header={
          <>
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div className="hidden h-3 w-px bg-border sm:block" />
            <div className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl">
              Checkpoints
            </div>
          </>
        }
        headerActions={
          canWrite ? (
            <Button onClick={() => setShowAdd(true)} className="h-11 gap-2 rounded-2xl">
              <Plus className="h-4 w-4" /> Add Checkpoint
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => showCheckpointQr(cp)}
                        >
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

          <div className="px-1 font-mono text-xs text-muted-foreground">
            Print or display checkpoint QRs on-site · Officers scan in route order
          </div>
        </div>

        {showAdd && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowAdd(false)}
            role="presentation"
          >
            <div
              className="w-full max-w-md rounded-3xl border border-border bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-semibold">New checkpoint</h2>
              <div className="space-y-3">
                <Input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  placeholder="Code (used in QR)"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <select
                  className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
                  value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                >
                  <option value="">Select site</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Route order"
                  value={form.routeOrder}
                  onChange={(e) => setForm({ ...form, routeOrder: e.target.value })}
                  inputMode="numeric"
                />
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => void handleCreate()}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </CommandLayout>

      {qrCheckpoint ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setQrCheckpoint(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h2 className="mb-1 text-lg font-semibold">Checkpoint QR</h2>
            <p className="mb-4 text-sm text-muted-foreground">{qrCheckpoint.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCheckpoint.dataUrl}
              alt={`QR for ${qrCheckpoint.name}`}
              className="mx-auto rounded-lg border border-border bg-white p-2"
              width={220}
              height={220}
            />
            <p className="mt-3 font-mono text-sm">{qrCheckpoint.code}</p>
            <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground/80">
              {qrCheckpoint.token}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={() => {
                  void navigator.clipboard.writeText(qrCheckpoint.token);
                  toast.success("QR payload copied");
                }}
              >
                Copy payload
              </Button>
              <Button className="flex-1 rounded-2xl" onClick={() => setQrCheckpoint(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
