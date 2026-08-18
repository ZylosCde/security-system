"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandLayout } from "@/components/command-layout";
import { useAuth } from "@/features/auth/auth-context";
import * as api from "@/lib/api-client";
import type { ApiRole, ApiUser } from "@/lib/api-types";
import { toast } from "sonner";
import { UsersTable } from "@/features/master-data/users/components/users-table";
import {
  AddUserDialog,
  type UserForm,
} from "@/features/master-data/users/components/add-user-dialog";

export default function MasterUsersPage() {
  const { canWrite, user: currentUser } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<UserForm>({
    email: "",
    username: "",
    password: "",
    roleId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.listMasterUsers(),
        api.listRoles(),
      ]);
      setUsers(usersRes.users);
      setRoles(rolesRes.roles);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users");
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
    if (!form.email.trim() || !form.username.trim() || !form.password || !form.roleId) {
      toast.error("All fields required");
      return;
    }
    try {
      await api.createMasterUser({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        roleId: Number(form.roleId),
      });
      toast.success("User created");
      setShowAdd(false);
      setForm({ email: "", username: "", password: "", roleId: "" });
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (currentUser?.id === id) {
      toast.error("Cannot delete your own account");
      return;
    }
    try {
      await api.deleteMasterUser(id);
      toast.success("User deleted");
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
            href="/patrolling"
            className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="hidden h-3 w-px bg-border sm:block" />
          <div className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl">
            Master · Users
          </div>
        </>
      }
      headerActions={
        canWrite ? (
          <Button onClick={() => setShowAdd(true)} className="h-11 gap-2 rounded-2xl">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <UsersTable
          users={users}
          loading={loading}
          canWrite={canWrite}
          currentUserId={currentUser?.id}
          onDelete={(id) => void handleDelete(id)}
        />
      </div>

      {showAdd && (
        <AddUserDialog
          form={form}
          roles={roles}
          onChange={setForm}
          onCancel={() => setShowAdd(false)}
          onCreate={() => void handleCreate()}
        />
      )}
    </CommandLayout>
  );
}
