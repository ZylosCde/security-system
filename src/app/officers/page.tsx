"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, ArrowLeft } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandLayout } from "@/components/command-layout";
import { usePatrolStore } from "@/hooks/usePatrolStore";
import type { Officer } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OfficersPage() {
  const { officers, updateOfficerStatus } = usePatrolStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newOfficer, setNewOfficer] = useState({
    name: "",
    nic: "",
    shift: "22:00–06:00",
    phone: "",
  });

  const filtered = officers.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.nic.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (id: string, status: Officer["status"]) => {
    updateOfficerStatus(id, status);
    toast.success("Status updated", { description: `Officer now ${status}` });
  };

  const handleAddOfficer = () => {
    if (!newOfficer.name || !newOfficer.nic) {
      toast.error("Name and NIC required");
      return;
    }
    toast.success("Officer added", { description: `${newOfficer.name} registered` });
    setShowAdd(false);
    setNewOfficer({ name: "", nic: "", shift: "22:00–06:00", phone: "" });
  };

  const getStatusColor = (status: Officer["status"]) => {
    if (status === "on-duty")
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    if (status === "on-break")
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    return "border-border bg-muted text-muted-foreground";
  };

  return (
    <>
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
            <Button onClick={() => setShowAdd(true)} className="h-11 gap-2 rounded-2xl px-4 sm:px-6">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Officer</span>
            </Button>
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

          <Card className="card-premium overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[min(280px,40vw)] pl-4 sm:pl-6">Officer</TableHead>
                    <TableHead>NIC / ID</TableHead>
                    <TableHead className="hidden md:table-cell">Shift</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right sm:pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                        No officers found
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((officer) => (
                    <TableRow key={officer.id} className="border-border table-row-hover">
                      <TableCell className="pl-4 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-muted text-sm font-medium">
                              {officer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-medium tracking-tight">{officer.name}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">{officer.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{officer.nic}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="font-mono text-sm text-muted-foreground">{officer.shift}</div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm text-muted-foreground">{officer.phone}</div>
                      </TableCell>
                      <TableCell>
                        <select
                          value={officer.status}
                          onChange={(e) =>
                            handleStatusChange(officer.id, e.target.value as Officer["status"])
                          }
                          className={cn(
                            "cursor-pointer rounded-full border px-2 py-1 text-xs font-medium sm:px-3",
                            getStatusColor(officer.status)
                          )}
                        >
                          <option value="on-duty">On Duty</option>
                          <option value="on-break">On Break</option>
                          <option value="off-duty">Off Duty</option>
                        </select>
                      </TableCell>
                      <TableCell className="pr-4 text-right sm:pr-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="px-1 font-mono text-xs text-muted-foreground">
            {filtered.length} officers • Non-linked accounts • Session-based authentication
          </div>
        </div>
      </CommandLayout>

      {showAdd && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm dark:bg-black/80"
          onClick={() => setShowAdd(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-officer-title"
          >
            <div id="add-officer-title" className="mb-1 text-xl font-semibold tracking-tight">
              Register New Officer
            </div>
            <div className="mb-6 text-sm text-muted-foreground">
              Officer will authenticate via NFC/QR card. No password required.
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">FULL NAME</div>
                <Input
                  value={newOfficer.name}
                  onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                  className="border-border bg-muted/50"
                />
              </div>
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">NIC / COMPANY ID</div>
                <Input
                  value={newOfficer.nic}
                  onChange={(e) => setNewOfficer({ ...newOfficer, nic: e.target.value })}
                  className="border-border bg-muted/50 font-mono"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-xs text-muted-foreground">SHIFT</div>
                  <Input
                    value={newOfficer.shift}
                    onChange={(e) => setNewOfficer({ ...newOfficer, shift: e.target.value })}
                    className="border-border bg-muted/50"
                  />
                </div>
                <div>
                  <div className="mb-1.5 text-xs text-muted-foreground">PHONE</div>
                  <Input
                    value={newOfficer.phone}
                    onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                    className="border-border bg-muted/50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="h-12 flex-1 rounded-2xl">
                Cancel
              </Button>
              <Button onClick={handleAddOfficer} className="h-12 flex-1 rounded-2xl">
                REGISTER OFFICER
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
