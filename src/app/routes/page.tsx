"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Shield, Users, MapPin, AlertTriangle, Clock, QrCode, Bell, 
  ArrowLeft, ArrowUp, ArrowDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePatrolStore } from '@/hooks/usePatrolStore';

export default function RoutesPage() {
  const { routes, checkpoints } = usePatrolStore();

  const getCheckpointName = (id: string) => checkpoints.find(c => c.id === id)?.name || id;

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
              { icon: Clock, label: "Routes & Schedules", href: "/routes", active: true },
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
            <div className="font-semibold text-xl tracking-[-0.5px]">Route Templates</div>
          </div>
          <Button className="rounded-2xl h-11 px-6">Create New Route Template</Button>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-6">
          {routes.map(route => (
            <Card key={route.id} className="card-premium p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="font-mono text-xs text-white/40 tracking-[1px]">{route.id}</div>
                  <div className="text-2xl font-semibold tracking-[-0.8px] mt-px">{route.name}</div>
                </div>
                <Badge variant="outline" className="font-mono text-xs px-3 py-1">{route.expectedDuration} min</Badge>
              </div>

              <div className="text-xs uppercase tracking-[1.5px] text-white/40 mb-3">ORDERED CHECKPOINTS</div>
              
              <div className="space-y-2">
                {route.checkpoints.map((cpId, index) => (
                  <div key={index} className="flex items-center justify-between border border-white/10 bg-zinc-900/60 rounded-2xl px-5 py-[15px]">
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-xs text-white/40 w-6">{(index + 1).toString().padStart(2, '0')}</div>
                      <div className="font-medium">{getCheckpointName(cpId)}</div>
                    </div>
                    <div className="flex items-center gap-1 text-white/40">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><ArrowUp className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><ArrowDown className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-xs text-white/40 font-mono flex items-center gap-2">
                Recurrence: {route.recurrence}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
