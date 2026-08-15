"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { useAuth } from "@/features/auth/auth-context";
import * as api from "@/lib/api-client";
import type { ApiClient, ApiSite } from "@/lib/api-types";
import { toast } from "sonner";
import { ClientsTable } from "@/features/master-data/clients/components/clients-table";
import {
  AddClientDialog,
  type ClientForm,
} from "@/features/master-data/clients/components/add-client-dialog";

export default function MasterClientsPage() {
  const { canWrite } = useAuth();
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [sites, setSites] = useState<ApiSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ClientForm>({ name: "", description: "", siteId: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        api.listMasterClients(),
        api.listMasterSites(),
      ]);
      setClients(cRes.clients);
      setSites(sRes.sites);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.siteId) {
      toast.error("Name and site required");
      return;
    }
    try {
      await api.createMasterClient({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        siteId: Number(form.siteId),
      });
      toast.success("Client created");
      setShowAdd(false);
      setForm({ name: "", description: "", siteId: "" });
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
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
            Master · Clients
          </div>
        </>
      }
      headerActions={
        canWrite ? (
          <Button onClick={() => setShowAdd(true)} className="h-11 gap-2 rounded-2xl">
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <ClientsTable clients={clients} loading={loading} />
      </div>

      {showAdd && (
        <AddClientDialog
          sites={sites}
          form={form}
          onChange={setForm}
          onCancel={() => setShowAdd(false)}
          onCreate={() => void handleCreate()}
        />
      )}
    </CommandLayout>
  );
}
