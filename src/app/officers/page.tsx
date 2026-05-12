"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, Users, MapPin, AlertTriangle, Clock, QrCode, Bell, 
  Plus, Search, MoreHorizontal, ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePatrolStore } from '@/hooks/usePatrolStore';
import { Officer } from '@/lib/types';
import { toast } from 'sonner';

export default function OfficersPage() {
  const { officers, updateOfficerStatus } = usePatrolStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: '', nic: '', shift: '22:00–06:00', phone: '' });

  const filtered = officers.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.nic.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (id: string, status: Officer['status']) => {
    updateOfficerStatus(id, status);
    toast.success('Status updated', { description: `Officer now ${status}` });
  };

  const handleAddOfficer = () => {
    if (!newOfficer.name || !newOfficer.nic) {
      toast.error('Name and NIC required');
      return;
    }
    // In real app this would call API and refresh store
    toast.success('Officer added', { description: `${newOfficer.name} registered` });
    setShowAdd(false);
    setNewOfficer({ name: '', nic: '', shift: '22:00–06:00', phone: '' });
  };

  const getStatusColor = (status: Officer['status']) => {
    if (status === 'on-duty') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'on-break') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-zinc-800 text-white/60 border-white/10';
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-white/10 bg-zinc-950 flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="font-semibold tracking-[-1.2px] text-2xl">AEGIS</div>
              <div className="text-[10px] text-white/50 -mt-1">COMMAND CENTER</div>
            </div>
          </div>
        </div>

        <div className="px-3 py-4 flex-1">
          <div className="text-xs font-mono tracking-[1.5px] text-white/40 px-3 mb-2">OPERATIONS</div>
          <nav className="space-y-px">
            {[
              { icon: MapPin, label: "Live Operations", href: "/" },
              { icon: Users, label: "Officers", href: "/officers", active: true },
              { icon: Shield, label: "Devices", href: "/devices" },
              { icon: MapPin, label: "Checkpoints", href: "/checkpoints" },
              { icon: Clock, label: "Routes & Schedules", href: "/schedules" },
              { icon: AlertTriangle, label: "Violations", href: "/violations" },
              { icon: Bell, label: "Incidents", href: "/incidents" },
            ].map((item, idx) => (
              <Link key={idx} href={item.href} className={`flex items-center gap-3 px-3 py-[13px] rounded-xl text-sm font-medium transition-all ${item.active ? 'nav-active text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-zinc-800 text-xs">AD</AvatarFallback></Avatar>
            <div className="text-sm">
              <div className="font-medium">Admin • Dilshan</div>
              <div className="text-[10px] text-white/40">Chief Security Officer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4" /> Back to Live Ops
            </Link>
            <div className="h-3 w-px bg-white/20" />
            <div className="font-semibold text-xl tracking-[-0.5px]">Security Officers</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
              <Input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search by name or NIC..." 
                className="pl-11 bg-zinc-900 border-white/10 h-11 rounded-2xl" 
              />
            </div>
            <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-2xl h-11 px-6">
              <Plus className="w-4 h-4" /> Add Officer
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <Card className="card-premium p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="pl-6 w-[280px]">Officer</TableHead>
                  <TableHead>NIC / ID</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-white/40">No officers found</TableCell></TableRow>
                )}
                {filtered.map(officer => (
                  <TableRow key={officer.id} className="border-white/10 hover:bg-white/[0.015]">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarFallback className="bg-zinc-800 text-sm font-medium">{officer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-medium tracking-tight">{officer.name}</div>
                          <div className="font-mono text-[10px] text-white/40">{officer.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><div className="font-mono text-sm">{officer.nic}</div></TableCell>
                    <TableCell><div className="font-mono text-sm text-white/70">{officer.shift}</div></TableCell>
                    <TableCell><div className="text-sm text-white/70">{officer.phone}</div></TableCell>
                    <TableCell>
                      <select 
                        value={officer.status} 
                        onChange={e => handleStatusChange(officer.id, e.target.value as Officer['status'])}
                        className={`text-xs border rounded-full px-3 py-1 font-medium cursor-pointer ${getStatusColor(officer.status)}`}
                      >
                        <option value="on-duty">On Duty</option>
                        <option value="on-break">On Break</option>
                        <option value="off-duty">Off Duty</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="mt-4 text-xs text-white/40 font-mono px-1">
            {filtered.length} officers • Non-linked accounts • Session-based authentication
          </div>
        </div>
      </div>

      {/* Add Officer Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6" onClick={() => setShowAdd(false)}>
          <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <div className="text-xl font-semibold tracking-tight mb-1">Register New Officer</div>
            <div className="text-sm text-white/50 mb-6">Officer will authenticate via NFC/QR card. No password required.</div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-white/50 mb-1.5">FULL NAME</div>
                <Input value={newOfficer.name} onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })} className="bg-zinc-900 border-white/10" />
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1.5">NIC / COMPANY ID</div>
                <Input value={newOfficer.nic} onChange={e => setNewOfficer({ ...newOfficer, nic: e.target.value })} className="bg-zinc-900 border-white/10 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/50 mb-1.5">SHIFT</div>
                  <Input value={newOfficer.shift} onChange={e => setNewOfficer({ ...newOfficer, shift: e.target.value })} className="bg-zinc-900 border-white/10" />
                </div>
                <div>
                  <div className="text-xs text-white/50 mb-1.5">PHONE</div>
                  <Input value={newOfficer.phone} onChange={e => setNewOfficer({ ...newOfficer, phone: e.target.value })} className="bg-zinc-900 border-white/10" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1 h-12 rounded-2xl">Cancel</Button>
              <Button onClick={handleAddOfficer} className="flex-1 h-12 rounded-2xl">REGISTER OFFICER</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
