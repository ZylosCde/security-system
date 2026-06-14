"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { CommandLayout } from "@/components/command-layout";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api-client";
import type { ApiUser, UserRole } from "@/lib/api-types";
import { toast } from "sonner";

export default function MasterUsersPage() {
  const { canWrite, user: currentUser } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    role: "USER" as UserRole,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listMasterUsers();
      setUsers(res.users);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.email.trim() || !form.username.trim() || !form.password) {
      toast.error("All fields required");
      return;
    }
    try {
      await api.createMasterUser({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        role: form.role,
      });
      toast.success("User created");
      setShowAdd(false);
      setForm({ email: "", username: "", password: "", role: "USER" });
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
            href="/"
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
        <Card className="card-premium overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {canWrite ? <TableHead className="text-right pr-6">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={canWrite ? 4 : 3}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-6 font-medium">{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.role}</Badge>
                    </TableCell>
                    {canWrite ? (
                      <TableCell className="pr-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={currentUser?.id === u.id}
                          onClick={() => void handleDelete(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    ) : null}
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
            <h2 className="mb-4 text-xl font-semibold">New dashboard user</h2>
            <div className="space-y-3">
              <Input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <Input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <select
                className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as UserRole })
                }
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MASTER">MASTER</option>
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
