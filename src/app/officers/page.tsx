"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, ArrowLeft, QrCode } from "lucide-react";
import { generateNicLoginToken, getNicLoginQRDataURL } from "@/lib/qrService";
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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OfficersPage() {
  const { officers, loading, addOfficer } = usePatrolStore();
  const { canWrite } = useAuth();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [qrOfficer, setQrOfficer] = useState<{
    name: string;
    nic: string;
    dataUrl: string;
    token: string;
  } | null>(null);
  const [newOfficer, setNewOfficer] = useState({
    officerName: "",
    NIC: "",
    Position: "JPO" as "JPO" | "SPO",
  });

  const filtered = officers.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.nic.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddOfficer = async () => {
    if (!newOfficer.officerName || !newOfficer.NIC) {
      toast.error("Name and NIC required");
      return;
    }
    try {
      await addOfficer(newOfficer);
      toast.success("Officer registered", { description: newOfficer.officerName });
      setShowAdd(false);
      setNewOfficer({ officerName: "", NIC: "", Position: "JPO" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    }
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

          <Card className="card-premium overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[min(280px,40vw)] pl-4 sm:pl-6">Officer</TableHead>
                    <TableHead>NIC</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="pr-4 sm:pr-6 text-right">Sign-in QR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        No officers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((officer) => (
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
                              <div className="truncate font-medium tracking-tight">
                                {officer.name}
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                ID {officer.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{officer.nic}</div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-bold",
                              officer.shift === "SPO"
                                ? "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            )}
                          >
                            {officer.shift}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-6 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => {
                              const token = generateNicLoginToken(officer.nic);
                              void getNicLoginQRDataURL(officer.nic).then((dataUrl) =>
                                setQrOfficer({
                                  name: officer.name,
                                  nic: officer.nic,
                                  dataUrl,
                                  token,
                                })
                              );
                            }}
                          >
                            <QrCode className="h-3.5 w-3.5" /> QR
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="px-1 font-mono text-xs text-muted-foreground">
            {filtered.length} officers · Mobile: device QR then officer badge QR
          </div>
        </div>
      </CommandLayout>

      {qrOfficer ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setQrOfficer(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h2 className="mb-1 text-lg font-semibold">Officer sign-in QR</h2>
            <p className="mb-4 text-sm text-muted-foreground">{qrOfficer.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrOfficer.dataUrl}
              alt={`Sign-in QR for ${qrOfficer.name}`}
              className="mx-auto rounded-lg border border-border bg-white p-2"
              width={200}
              height={200}
            />
            <p className="mt-3 font-mono text-sm">{qrOfficer.nic}</p>
            <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground/80">
              {qrOfficer.token}
            </p>
            <Button className="mt-6 w-full rounded-2xl" onClick={() => setQrOfficer(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

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
          >
            <div className="mb-1 text-xl font-semibold tracking-tight">Register New Officer</div>
            <div className="mb-6 text-sm text-muted-foreground">
              Officers sign in on mobile with their NIC (national ID).
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">FULL NAME</div>
                <Input
                  value={newOfficer.officerName}
                  onChange={(e) =>
                    setNewOfficer({ ...newOfficer, officerName: e.target.value })
                  }
                  className="border-border bg-muted/50"
                />
              </div>
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">NIC</div>
                <Input
                  value={newOfficer.NIC}
                  onChange={(e) => setNewOfficer({ ...newOfficer, NIC: e.target.value })}
                  className="border-border bg-muted/50 font-mono"
                />
              </div>
              <div>
                <div className="mb-1.5 text-xs text-muted-foreground">POSITION</div>
                <select
                  className="h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm"
                  value={newOfficer.Position}
                  onChange={(e) =>
                    setNewOfficer({
                      ...newOfficer,
                      Position: e.target.value as "JPO" | "SPO",
                    })
                  }
                >
                  <option value="JPO">JPO</option>
                  <option value="SPO">SPO</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="h-12 flex-1 rounded-2xl">
                Cancel
              </Button>
              <Button onClick={() => void handleAddOfficer()} className="h-12 flex-1 rounded-2xl">
                REGISTER OFFICER
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
