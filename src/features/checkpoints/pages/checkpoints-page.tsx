"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { buildCheckpointQrValue, getCheckpointQRDataURL } from "@/lib/qr-service";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import { useAuth } from "@/features/auth/auth-context";
import { toast } from "sonner";
import { CheckpointsTable } from "@/features/checkpoints/components/checkpoints-table";
import {
  AddCheckpointDialog,
  type CheckpointForm,
} from "@/features/checkpoints/components/add-checkpoint-dialog";
import {
  CheckpointQrDialog,
  type QrCheckpointData,
} from "@/features/checkpoints/components/checkpoint-qr-dialog";
import type { Checkpoint } from "@/lib/types";

export default function CheckpointsPage() {
  const { checkpoints, sites, loading, addCheckpoint } = usePatrolStore();
  const { canWrite } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const [qrCheckpoint, setQrCheckpoint] = useState<QrCheckpointData | null>(null);

  useEffect(() => {
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

  const [form, setForm] = useState<CheckpointForm>({
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

  const showCheckpointQr = (cp: Checkpoint) => {
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
              href="/patrolling"
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
          <CheckpointsTable
            checkpoints={checkpoints}
            loading={loading}
            visibleCount={visibleCount}
            onShowQr={showCheckpointQr}
          />

          <div className="px-1 font-mono text-xs text-muted-foreground">
            Print or display checkpoint QRs on-site · Officers scan in route order
          </div>
        </div>

        {showAdd && (
          <AddCheckpointDialog
            sites={sites}
            form={form}
            onChange={setForm}
            onCancel={() => setShowAdd(false)}
            onCreate={() => void handleCreate()}
          />
        )}
      </CommandLayout>

      {qrCheckpoint ? (
        <CheckpointQrDialog qrCheckpoint={qrCheckpoint} onClose={() => setQrCheckpoint(null)} />
      ) : null}
    </>
  );
}
