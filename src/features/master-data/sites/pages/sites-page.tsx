"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { useAuth } from "@/features/auth/auth-context";
import * as api from "@/lib/api-client";
import type { ApiSite } from "@/lib/api-types";
import { toast } from "sonner";
import { SitesTable } from "@/features/master-data/sites/components/sites-table";
import {
  AddSiteDialog,
  type SiteForm,
} from "@/features/master-data/sites/components/add-site-dialog";

export default function MasterSitesPage() {
  const { canWrite } = useAuth();
  const [sites, setSites] = useState<ApiSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<SiteForm>({ name: "", lat: "", lng: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listMasterSites();
      setSites(res.sites);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load sites");
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
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!form.name.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error("Name, latitude, and longitude required");
      return;
    }
    try {
      await api.createMasterSite({
        name: form.name.trim(),
        lat,
        lng,
      });
      toast.success("Site created");
      setShowAdd(false);
      setForm({ name: "", lat: "", lng: "" });
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
            Master · Sites
          </div>
        </>
      }
      headerActions={
        canWrite ? (
          <Button onClick={() => setShowAdd(true)} className="h-11 gap-2 rounded-2xl">
            <Plus className="h-4 w-4" /> Add Site
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <SitesTable sites={sites} loading={loading} />
      </div>

      {showAdd && (
        <AddSiteDialog
          form={form}
          onChange={setForm}
          onCancel={() => setShowAdd(false)}
          onCreate={() => void handleCreate()}
        />
      )}
    </CommandLayout>
  );
}
