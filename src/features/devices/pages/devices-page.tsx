"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { generateDeviceToken, getDeviceQRDataURL } from "@/lib/qr-service";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import { useAuth } from "@/features/auth/auth-context";
import * as api from "@/lib/api-client";
import type { ApiAssignment } from "@/lib/api-types";
import { toast } from "sonner";
import { DevicesTable } from "@/features/devices/components/devices-table";
import { DeviceAssignmentsList } from "@/features/devices/components/device-assignments-list";
import { DeviceQrDialog, type QrDeviceData } from "@/features/devices/components/device-qr-dialog";
import {
  RegisterDeviceDialog,
  type RegisterDeviceForm,
} from "@/features/devices/components/register-device-dialog";
import {
  AssignDeviceDialog,
  type AssignDeviceForm,
} from "@/features/devices/components/assign-device-dialog";
import type { Device } from "@/lib/types";

export default function DevicesPage() {
  const { devices, officers, sites, loading, addDevice, assignDevice } = usePatrolStore();
  const { canWrite } = useAuth();
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState<RegisterDeviceForm>({
    deviceName: "",
    deviceType: "TABLET",
    imeiNumber: "",
    siteId: "",
  });
  const [assignForm, setAssignForm] = useState<AssignDeviceForm>({ deviceId: "", officerId: "" });
  const [qrDevice, setQrDevice] = useState<QrDeviceData | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      const res = await api.listDeviceAssignments();
      setAssignments(res.assignments);
    } catch {;
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

  const showDeviceQr = (device: Device) => {
    const token = generateDeviceToken(device.id, device.imei);
    void getDeviceQRDataURL(device.id, device.imei).then((dataUrl) =>
      setQrDevice({ id: device.id, imei: device.imei, model: device.model, dataUrl, token })
    );
  };

  return (
    <CommandLayout
      header={
        <>
          <Link
            href="/patrolling"
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
            <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setShowAssign(true)}>
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
        <DevicesTable devices={devices} loading={loading} onShowQr={showDeviceQr} />
        <DeviceAssignmentsList assignments={assignments} />
      </div>

      {qrDevice ? <DeviceQrDialog qrDevice={qrDevice} onClose={() => setQrDevice(null)} /> : null}

      {showAdd && (
        <RegisterDeviceDialog
          sites={sites}
          form={form}
          onChange={setForm}
          onCancel={() => setShowAdd(false)}
          onCreate={() => void handleRegister()}
        />
      )}

      {showAssign && (
        <AssignDeviceDialog
          devices={devices}
          officers={officers}
          form={assignForm}
          onChange={setAssignForm}
          onCancel={() => setShowAssign(false)}
          onAssign={() => void handleAssign()}
        />
      )}
    </CommandLayout>
  );
}
