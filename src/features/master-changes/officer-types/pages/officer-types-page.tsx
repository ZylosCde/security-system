"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { useAuth } from "@/features/auth/auth-context";
import * as api from "@/lib/api-client";
import type { ApiOfficerType } from "@/lib/api-types";
import { toast } from "sonner";
import { OfficerTypesTable } from "@/features/master-changes/officer-types/components/officer-types-table";
import {
  OfficerTypeFormDialog,
  type OfficerTypeForm,
} from "@/features/master-changes/officer-types/components/officer-type-form-dialog";

const emptyForm: OfficerTypeForm = { name: "", description: "" };

export default function OfficerTypesPage() {
  const { canWrite } = useAuth();
  const [officerTypes, setOfficerTypes] = useState<ApiOfficerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOfficerType, setEditingOfficerType] = useState<ApiOfficerType | null>(null);
  const [form, setForm] = useState<OfficerTypeForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listOfficerTypes();
      setOfficerTypes(res.officerTypes);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load officer types");
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

  const openCreate = () => {
    setEditingOfficerType(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (officerType: ApiOfficerType) => {
    setEditingOfficerType(officerType);
    setForm({ name: officerType.name, description: officerType.description });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Type name is required");
      return;
    }
    try {
      if (editingOfficerType) {
        await api.updateOfficerType(editingOfficerType.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        toast.success("Officer type updated");
      } else {
        await api.createOfficerType({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        toast.success("Officer type created");
      }
      setShowForm(false);
      setEditingOfficerType(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteOfficerType(id);
      toast.success("Officer type deleted");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <CommandLayout
      header={
        <>
          <Link
            href="/master-changes"
            className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="hidden h-3 w-px bg-border sm:block" />
          <div className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl">
            Officer Types
          </div>
        </>
      }
      headerActions={
        canWrite ? (
          <Button onClick={openCreate} className="h-11 gap-2 rounded-2xl">
            <Plus className="h-4 w-4" /> Add Type
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <OfficerTypesTable
          officerTypes={officerTypes}
          loading={loading}
          canWrite={canWrite}
          onEdit={openEdit}
          onDelete={(id) => void handleDelete(id)}
        />
      </div>

      {showForm && (
        <OfficerTypeFormDialog
          editingOfficerType={editingOfficerType}
          form={form}
          onChange={setForm}
          onCancel={() => {
            setShowForm(false);
            setEditingOfficerType(null);
          }}
          onSubmit={() => void handleSubmit()}
        />
      )}
    </CommandLayout>
  );
}
