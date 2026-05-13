"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Shield, Users, MapPin, AlertTriangle, Clock, QrCode, Bell, 
  ArrowLeft, Play 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePatrolStore } from '@/hooks/usePatrolStore';

export default function SchedulesPage() {
  const { schedules, routes, officers } = usePatrolStore();

  const getRouteName = (id: string) => routes.find(r => r.id === id)?.name || id;
  const getOfficerName = (id: string) => officers.find(o => o.id === id)?.name || id;

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
              { icon: MapPin, label: "Checkpoints", href: "/checkpoints" },
              { icon: Clock, label: "Routes & Schedules", href: "/schedules", active: true },
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
            <div className="font-semibold text-xl tracking-[-0.5px]">Patrol Schedules</div>
          </div>
          <Button className="rounded-2xl h-11 px-6 gap-2">
            <Play className="w-4 h-4" /> Create New Schedule
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="grid gap-6">
            {schedules.map(schedule => (
              <Card key={schedule.id} className="card-premium p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-xs tracking-[1px] text-white/40">{schedule.id}</div>
                    <div className="text-xl font-semibold tracking-tight mt-1">{getRouteName(schedule.routeId)}</div>
                    <div className="text-sm text-white/60 mt-px">Assigned to {getOfficerName(schedule.officerId)}</div>
                  </div>
                  <Badge className={schedule.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : ''}>
                    {schedule.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-white/40 mb-1">START</div>
                    <div className="font-mono">{new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 mb-1">END</div>
                    <div className="font-mono">{new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 mb-1">RECURRENCE</div>
                    <div>{schedule.recurrence}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 mb-1">ALERTS</div>
                    <div className="text-emerald-400 text-xs">T-10 • T+5 • T+10 • T+15</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
