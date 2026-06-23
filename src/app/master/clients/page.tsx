"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api-client";
import type { ApiClient, ApiSite } from "@/lib/api-types";
import { toast } from "sonner";

export default function MasterClientsPage() {
  const { canWrite } = useAuth();
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [sites, setSites] = useState<ApiSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", siteId: "" });

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
            href="/"
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
        <Card className="card-premium overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                    No clients
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                    <TableCell>{c.site?.name ?? `Site #${c.siteId}`}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.description ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowAdd(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h2 className="mb-4 text-xl font-semibold">New client</h2>
            <div className="space-y-3">
              <Input
                placeholder="Client name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
  );
}
