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
import type { ApiSite } from "@/lib/api-types";
import { toast } from "sonner";

export default function MasterSitesPage() {
  const { canWrite } = useAuth();
  const [sites, setSites] = useState<ApiSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", lat: "", lng: "" });

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
            href="/"
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
        <Card className="card-premium overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : sites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                    No sites
                  </TableCell>
                </TableRow>
              ) : (
                sites.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6 font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-sm">{s.lat}</TableCell>
                    <TableCell className="font-mono text-sm">{s.lng}</TableCell>
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
            <h2 className="mb-4 text-xl font-semibold">New site</h2>
            <div className="space-y-3">
              <Input
                placeholder="Site name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Latitude"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                inputMode="decimal"
              />
              <Input
                placeholder="Longitude"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                inputMode="decimal"
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
  );
}
