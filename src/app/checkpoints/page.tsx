"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";
import { generateRotatingToken } from "@/lib/qrService";
import { toast } from "sonner";

export default function CheckpointsPage() {
  const { checkpoints } = usePatrolStore();
  const [tokens, setTokens] = useState<Record<string, string>>({});

  const regenerateToken = (checkpointId: string, premises: string) => {
    const newToken = generateRotatingToken(checkpointId, premises);
    setTokens((prev) => ({ ...prev, [checkpointId]: newToken }));
    toast.success("New token generated", { description: "QR code updated for next 24 hours" });
  };

  const getDisplayToken = (cp: (typeof checkpoints)[0]) => tokens[cp.id] || cp.qrToken;

  return (
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
            Checkpoints &amp; QR Codes
          </div>
        </>
      }
      headerActions={
        <Button className="h-11 gap-2 rounded-2xl px-4 sm:px-6">
          <QrCode className="h-4 w-4" /> <span className="hidden sm:inline">Print All QR</span>
        </Button>
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <Card className="card-premium overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="min-w-[200px] pl-4 sm:pl-6">Checkpoint</TableHead>
                  <TableHead className="hidden sm:table-cell">Premises</TableHead>
                  <TableHead>GPS</TableHead>
                  <TableHead className="min-w-[180px]">Current QR Token</TableHead>
                  <TableHead className="hidden md:table-cell">Last Scanned</TableHead>
                  <TableHead className="pr-4 text-right sm:pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkpoints.map((cp) => {
                  const displayToken = getDisplayToken(cp);
                  return (
                    <TableRow key={cp.id} className="border-border table-row-hover">
                      <TableCell className="pl-4 sm:pl-6">
                        <div className="font-medium tracking-tight">{cp.name}</div>
                        <div className="mt-px font-mono text-[10px] text-muted-foreground">{cp.id}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">{cp.premises}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-muted-foreground">
                          {cp.lat.toFixed(4)}, {cp.lng.toFixed(4)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="inline-block max-w-[min(280px,55vw)] truncate rounded-lg border border-border bg-muted/60 px-2 py-1.5 font-mono text-[10px] sm:px-3 sm:text-xs">
                          {displayToken}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-xs text-muted-foreground">
                          {cp.lastScanned
                            ? new Date(cp.lastScanned).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="pr-4 text-right sm:pr-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateToken(cp.id, cp.premises)}
                          className="gap-2 rounded-xl"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex items-center gap-2 px-1 font-mono text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          Tokens rotate every 24 hours • HMAC signed • Offline cache supported
        </div>
      </div>
    </CommandLayout>
  );
}
