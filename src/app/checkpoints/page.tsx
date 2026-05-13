"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, Users, MapPin, AlertTriangle, Clock, QrCode, Bell, 
  ArrowLeft, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePatrolStore } from '@/hooks/usePatrolStore';
import { generateRotatingToken, getQRCodeDataURL } from '@/lib/qrService';
import { toast } from 'sonner';

export default function CheckpointsPage() {
  const { checkpoints } = usePatrolStore();
  const [tokens, setTokens] = useState<Record<string, string>>({});

  const regenerateToken = (checkpointId: string, premises: string) => {
    const newToken = generateRotatingToken(checkpointId, premises);
    setTokens(prev => ({ ...prev, [checkpointId]: newToken }));
    toast.success('New token generated', { description: 'QR code updated for next 24 hours' });
  };

  const getDisplayToken = (cp: any) => tokens[cp.id] || cp.qrToken;

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
              { icon: Users, label: "Officers", href: "/officers" },
              { icon: Shield, label: "Devices", href: "/devices" },
              { icon: MapPin, label: "Checkpoints", href: "/checkpoints", active: true },
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
            <div className="font-semibold text-xl tracking-[-0.5px]">Checkpoints &amp; QR Codes</div>
          </div>
          <Button className="rounded-2xl h-11 px-6 gap-2">
            <QrCode className="w-4 h-4" /> Print All QR Codes
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <Card className="card-premium p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="pl-6 w-[260px]">Checkpoint</TableHead>
                  <TableHead>Premises</TableHead>
                  <TableHead>GPS Coordinates</TableHead>
                  <TableHead>Current QR Token</TableHead>
                  <TableHead>Last Scanned</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkpoints.map(cp => {
                  const displayToken = getDisplayToken(cp);
                  return (
                    <TableRow key={cp.id} className="border-white/10 hover:bg-white/[0.015]">
                      <TableCell className="pl-6">
                        <div className="font-medium tracking-tight">{cp.name}</div>
                        <div className="font-mono text-[10px] text-white/40 mt-px">{cp.id}</div>
                      </TableCell>
                      <TableCell><div className="text-sm text-white/80">{cp.premises}</div></TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-white/60">
                          {cp.lat.toFixed(4)}, {cp.lng.toFixed(4)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg inline-block">
                          {displayToken}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-white/50">
                          {cp.lastScanned ? new Date(cp.lastScanned).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => regenerateToken(cp.id, cp.premises)}
                          className="gap-2 rounded-xl border-white/20"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="mt-4 text-xs text-white/40 font-mono px-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Tokens rotate every 24 hours • HMAC signed • Offline cache supported
          </div>
        </div>
      </div>
    </div>
  );
}
