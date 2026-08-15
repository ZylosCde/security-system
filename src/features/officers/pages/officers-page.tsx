"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { generateNicLoginToken, getNicLoginQRDataURL } from "@/lib/qr-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/features/patrols/hooks/use-patrol-store";
import { useAuth } from "@/features/auth/auth-context";
import * as api from "@/lib/api-client";
import type { ApiOfficerType } from "@/lib/api-types";
import { toast } from "sonner";
import { OfficersTable } from "@/features/officers/components/officers-table";
import { OfficerQrDialog, type QrOfficerData } from "@/features/officers/components/officer-qr-dialog";
import {
  AddOfficerDialog,
  type NewOfficerForm,
} from "@/features/officers/components/add-officer-dialog";
import type { Officer } from "@/lib/types";

export default function OfficersPage() {
  const { officers, loading, addOfficer } = usePatrolStore();
  const { canWrite } = useAuth();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [qrOfficer, setQrOfficer] = useState<QrOfficerData | null>(null);
  const [officerTypes, setOfficerTypes] = useState<ApiOfficerType[]>([]);
  const [newOfficer, setNewOfficer] = useState<NewOfficerForm>({
    officerName: "",
    NIC: "",
    officerTypeId: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      void api
        .listOfficerTypes()
        .then((res) => setOfficerTypes(res.officerTypes))
        .catch(() => {});
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = officers.filter((o) => {
    if (!o || !o.name || !o.nic) {
      return false;
    }
    return (
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.nic.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleAddOfficer = async () => {
    if (!newOfficer.officerName || !newOfficer.NIC || !newOfficer.officerTypeId) {
      toast.error("Name, NIC, and officer type required");
      return;
    }
    try {
      await addOfficer({
        officerName: newOfficer.officerName,
        NIC: newOfficer.NIC,
        officerTypeId: Number(newOfficer.officerTypeId),
      });
      toast.success("Officer registered", { description: newOfficer.officerName });
      setShowAdd(false);
      setNewOfficer({ officerName: "", NIC: "", officerTypeId: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    }
  };

  const showOfficerQr = (officer: Officer) => {
    const token = generateNicLoginToken(officer.nic);
    void getNicLoginQRDataURL(officer.nic).then((dataUrl) =>
      setQrOfficer({ name: officer.name, nic: officer.nic, dataUrl, token })
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
              Security Officers
            </div>
          </>
        }
        headerActions={
          <>
            <div className="relative hidden w-56 md:block lg:w-72">
              <Search className="absolute top-3.5 left-4 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-11 rounded-2xl border-border bg-muted/50 pl-11"
              />
            </div>
            {canWrite ? (
              <Button
                onClick={() => setShowAdd(true)}
                className="h-11 gap-2 rounded-2xl px-4 sm:px-6"
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Officer</span>
              </Button>
            ) : null}
          </>
        }
      >
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          <div className="relative md:hidden">
            <Search className="absolute top-3.5 left-4 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or NIC…"
              className="h-11 rounded-2xl border-border bg-muted/50 pl-11"
            />
          </div>

          <OfficersTable officers={filtered} loading={loading} onShowQr={showOfficerQr} />

          <div className="px-1 font-mono text-xs text-muted-foreground">
            {filtered.length} officers · Mobile: device QR then officer badge QR
          </div>
        </div>
      </CommandLayout>

      {qrOfficer ? <OfficerQrDialog qrOfficer={qrOfficer} onClose={() => setQrOfficer(null)} /> : null}

      {showAdd && (
        <AddOfficerDialog
          form={newOfficer}
          officerTypes={officerTypes}
          onChange={setNewOfficer}
          onCancel={() => setShowAdd(false)}
          onCreate={() => void handleAddOfficer()}
        />
      )}
    </>
  );
}
