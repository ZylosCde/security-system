"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Battery, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";
import { cn } from "@/lib/utils";

export default function DevicesPage() {
  const { devices } = usePatrolStore();

  const getStatusColor = (status: string) => {
    if (status === "active")
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    if (status === "offline")
      return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400";
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  };

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
            Patrol Devices
          </div>
        </>
      }
      headerActions={<Button className="h-11 rounded-2xl px-4 sm:px-6">Register New Device</Button>}
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <Card className="card-premium overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-4 sm:pl-6">Device</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead className="hidden md:table-cell">Model</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="hidden lg:table-cell">Telemetry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id} className="border-border table-row-hover">
                    <TableCell className="pl-4 sm:pl-6">
                      <div>
                        <div className="font-mono font-medium tracking-tight">{device.id}</div>
                        <div className="text-xs text-muted-foreground">
                          Registered {new Date(device.registeredDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm text-foreground/90">{device.imei}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{device.model}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-muted-foreground">
                        {new Date(device.lastSync).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Battery className="h-3.5 w-3.5" />
                          {device.battery}%
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Signal className="h-3.5 w-3.5" />
                          {device.signal} bars
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border", getStatusColor(device.status))}>
                        {device.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="px-1 font-mono text-xs text-muted-foreground">
          All devices use offline-first architecture • HMAC QR validation enabled
        </div>
      </div>
    </CommandLayout>
  );
}
