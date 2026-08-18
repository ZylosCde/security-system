"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { useAuth } from "@/features/auth/auth-context";
import * as api from "@/lib/api-client";
import type { ApiRole } from "@/lib/api-types";
import { toast } from "sonner";
import { RolesTable } from "@/features/master-changes/roles/components/roles-table";
import {
  RoleFormDialog,
  type RoleForm,
} from "@/features/master-changes/roles/components/role-form-dialog";

const emptyForm: RoleForm = { name: "", description: "" };

export default function RolesPage() {
  const { canWrite } = useAuth();
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<ApiRole | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listRoles();
      setRoles(res.roles);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load roles");
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
    setEditingRole(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (role: ApiRole) => {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        toast.success("Role updated");
      } else {
        await api.createRole({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        toast.success("Role created");
      }
      setShowForm(false);
      setEditingRole(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteRole(id);
      toast.success("Role deleted");
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
            Roles
          </div>
        </>
      }
      headerActions={
        canWrite ? (
          <Button onClick={openCreate} className="h-11 gap-2 rounded-2xl">
            <Plus className="h-4 w-4" /> Add Role
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <RolesTable
          roles={roles}
          loading={loading}
          canWrite={canWrite}
          onEdit={openEdit}
          onDelete={(id) => void handleDelete(id)}
        />
      </div>

      {showForm && (
        <RoleFormDialog
          editingRole={editingRole}
          form={form}
          onChange={setForm}
          onCancel={() => {
            setShowForm(false);
            setEditingRole(null);
          }}
          onSubmit={() => void handleSubmit()}
        />
      )}
    </CommandLayout>
  );
}
