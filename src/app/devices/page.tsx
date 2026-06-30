"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, QrCode } from "lucide-react";
import { generateDeviceToken, getDeviceQRDataURL } from "@/lib/qrService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import * as api from "@/lib/api-client";
import type { ApiAssignment } from "@/lib/api-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DevicesPage() {
  const { devices, officers, sites, loading, addDevice, assignDevice } = usePatrolStore();
  const { canWrite } = useAuth();
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({
    deviceName: "",
    deviceType: "TABLET",
    imeiNumber: "",
    siteId: "",
  });
  const [assignForm, setAssignForm] = useState({ deviceId: "", officerId: "" });
  const [qrDevice, setQrDevice] = useState<{
    id: string;
    imei: string;
    model: string;
    dataUrl: string;
    token: string;
  } | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      const res = await api.listDeviceAssignments();
      setAssignments(res.assignments);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAssignments();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAssignments, devices.length]);

  const handleRegister = async () => {
    if (!form.deviceName.trim() || !form.imeiNumber.trim() || !form.siteId) {
      toast.error("Name, IMEI, and site required");
      return;
    }
    try {
      await addDevice({
        deviceName: form.deviceName.trim(),
        deviceType: form.deviceType,
        imeiNumber: form.imeiNumber.trim(),
        siteId: Number(form.siteId),
      });
      toast.success("Device registered");
      setShowAdd(false);
      setForm({ deviceName: "", deviceType: "TABLET", imeiNumber: "", siteId: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    }
  };

  const handleAssign = async () => {
    if (!assignForm.deviceId || !assignForm.officerId) {
      toast.error("Select device and officer");
      return;
    }
    try {
      await assignDevice(Number(assignForm.deviceId), Number(assignForm.officerId));
      toast.success("Device assigned to officer");
      setShowAssign(false);
      void loadAssignments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed");
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "active")
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    return "border-border bg-muted text-muted-foreground";
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
      headerActions={
        canWrite ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-2xl"
              onClick={() => setShowAssign(true)}
            >
              Assign
            </Button>
            <Button className="h-11 rounded-2xl" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Register
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
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
                    <TableCell>{device.siteName ?? (device.siteId ? `Site #${device.siteId}` : "Unassigned")}</TableCell>
                    <TableCell>
                      <Badge className={cn("border", getStatusColor(device.status))}>
                        {device.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => {
                          const token = generateDeviceToken(device.id, device.imei);
                          void getDeviceQRDataURL(device.id, device.imei).then((dataUrl) =>
                            setQrDevice({
                              id: device.id,
                              imei: device.imei,
                              model: device.model,
                              dataUrl,
                              token,
                            })
                          );
                        }}
                      >
                        <QrCode className="h-3.5 w-3.5" /> Show QR
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {assignments.length > 0 ? (
          <Card className="card-premium p-4 sm:p-6">
            <div className="mb-3 text-sm font-semibold">Officer assignments</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {assignments.map((a) => (
                <li key={a.id}>
                  Assignment #{a.id} — Officer {a.officerId} → Device {a.deviceId}
                  {a.site?.name ? ` @ ${a.site.name}` : ""}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      {qrDevice ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setQrDevice(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h2 className="mb-1 text-lg font-semibold">Device registration QR</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {qrDevice.model} · ID {qrDevice.id}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDevice.dataUrl}
              alt={`QR for device ${qrDevice.id}`}
              className="mx-auto rounded-lg border border-border bg-white p-2"
              width={200}
              height={200}
            />
            <p className="mt-3 font-mono text-xs text-muted-foreground">{qrDevice.imei}</p>
            <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground/80">
              {qrDevice.token}
            </p>
            <Button className="mt-6 w-full rounded-2xl" onClick={() => setQrDevice(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

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
            <h2 className="mb-4 text-xl font-semibold">Register device</h2>
            <div className="space-y-3">
              <Input
                placeholder="Device name"
                value={form.deviceName}
                onChange={(e) => setForm({ ...form, deviceName: e.target.value })}
              />
              <Input
                placeholder="IMEI"
                value={form.imeiNumber}
                onChange={(e) => setForm({ ...form, imeiNumber: e.target.value })}
              />
              <select
                className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
                value={form.deviceType}
                onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
              >
                <option value="TABLET">TABLET</option>
                <option value="MOBILE">MOBILE</option>
                <option value="LAPTOP">LAPTOP</option>
                <option value="DESKTOP">DESKTOP</option>
              </select>
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
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void handleRegister()}>
                Register
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAssign && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowAssign(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold">Assign device to officer</h2>
            <div className="space-y-3">
              <select
                className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
                value={assignForm.deviceId}
                onChange={(e) => setAssignForm({ ...assignForm, deviceId: e.target.value })}
              >
                <option value="">Device</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.model} ({d.id})
                  </option>
                ))}
              </select>
              <select
                className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
                value={assignForm.officerId}
                onChange={(e) => setAssignForm({ ...assignForm, officerId: e.target.value })}
              >
                <option value="">Officer</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAssign(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => void handleAssign()}>
                Assign
              </Button>
            </div>
          </div>
        </div>
      )}
    </CommandLayout>
  );
}
