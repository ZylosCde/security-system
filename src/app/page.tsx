"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, MapPin, AlertTriangle, Clock, CheckCircle, 
  Play, Battery, Signal, QrCode, Bell 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { officers, devices, checkpoints } from '@/lib/mockData';
import { PatrolSession } from '@/lib/types';
import { usePatrolStore } from '@/hooks/usePatrolStore';
import { calculateComplianceRate } from '@/lib/routeEngine';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DeviceSimulator } from '@/components/DeviceSimulator';

// Simulated live map component (beautiful SVG-based)
function LiveMap({ sessions }: { sessions: PatrolSession[] }) {
  const [positions, setPositions] = useState(
    sessions.map(s => ({ 
      id: s.id, 
      lat: s.currentLocation?.lat || 6.927, 
      lng: s.currentLocation?.lng || 79.861 
    }))
  );

  // Simulate officer movement every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(prev => prev.map(p => ({
        ...p,
        lat: p.lat + (Math.random() - 0.5) * 0.0006,
        lng: p.lng + (Math.random() - 0.5) * 0.0008,
      })));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const mapWidth = 520;
  const mapHeight = 320;

  // Convert lat/lng to pixel (rough scaling for demo area)
  const toPixel = (lat: number, lng: number) => ({
    x: ((lng - 79.85) / 0.02) * mapWidth,
    y: ((6.93 - lat) / 0.02) * mapHeight,
  });

  return (
    <div className="map-container w-full h-[320px] relative">
      {/* Grid + Premises */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_0.5px,transparent_1px)] bg-[length:20px_20px]" />
      
      {/* Building footprints */}
      <div className="absolute left-[22%] top-[18%] w-[38%] h-[46%] border border-white/20 rounded bg-white/[0.015]" />
      <div className="absolute left-[66%] top-[32%] w-[24%] h-[32%] border border-white/20 rounded bg-white/[0.015]" />

      {/* Checkpoint markers */}
      {checkpoints.slice(0, 4).map((cp, idx) => {
        const pos = toPixel(cp.lat, cp.lng);
        return (
          <div 
            key={cp.id}
            className="checkpoint-marker"
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            title={cp.name}
          />
        );
      })}

      {/* Live Officer Markers */}
      <AnimatePresence>
        {positions.map((pos, idx) => {
          const pixel = toPixel(pos.lat, pos.lng);
          const session = sessions[idx];
          const officer = officers.find(o => o.id === session.officerId);
          
          return (
            <motion.div
              key={pos.id}
              className="officer-marker bg-emerald-400"
              style={{ 
                left: `${Math.max(8, Math.min(pixel.x, mapWidth - 24))}px`, 
                top: `${Math.max(8, Math.min(pixel.y, mapHeight - 24))}px` 
              }}
              animate={{ 
                left: `${Math.max(8, Math.min(pixel.x, mapWidth - 24))}px`,
                top: `${Math.max(8, Math.min(pixel.y, mapHeight - 24))}px`
              }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-[1px] bg-zinc-900 px-1.5 py-px rounded border border-white/10 whitespace-nowrap">
                {officer?.name.split(' ')[0]}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-zinc-950/90 px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-3 border border-white/10 font-mono">
        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Officer</div>
        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Checkpoint</div>
      </div>
      
      <div className="absolute top-3 left-3 text-[10px] font-mono text-white/40 tracking-[3px]">LIVE • COLOMBO 6</div>
    </div>
  );
}

export default function AegisCommandCenter() {
  const { sessions, violations: activeViolations, sosEvents: activeSOS, updateSession, resolveViolation, resolveSOS } = usePatrolStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSimulator, setShowSimulator] = useState(false);

  // Live clock + occasional random events
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Occasionally simulate progress or new events
      if (Math.random() > 0.85) {
        setSessions(prev => prev.map(s => {
          if (s.status === 'in-progress' && s.checkpointsCompleted < s.totalCheckpoints && Math.random() > 0.6) {
            const updated = { ...s, checkpointsCompleted: s.checkpointsCompleted + 1 };
            if (updated.checkpointsCompleted === updated.totalCheckpoints) {
              updated.status = 'completed';
            }
            return updated;
          }
          return s;
        }));
      }
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const handleResolveSOS = (id: string) => {
    resolveSOS(id, 'Incident resolved from command center.');
    toast.success('SOS marked resolved', { description: 'Resolution note saved to audit log.' });
  };

  const handleAcknowledgeViolation = (id: string) => {
    resolveViolation(id);
    toast.info('Violation acknowledged', { description: 'Officer notified. Record updated.' });
  };

  const stats = {
    activePatrols: sessions.filter(s => s.status === 'in-progress').length,
    complianceRate: calculateComplianceRate(sessions),
    openSOS: activeSOS.filter(s => s.status === 'active').length,
    pendingViolations: activeViolations.filter(v => !v.resolved).length,
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Premium Sidebar */}
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
              { icon: MapPin, label: "Live Operations", active: true },
              { icon: Users, label: "Officers" },
              { icon: Shield, label: "Devices" },
              { icon: MapPin, label: "Checkpoints" },
              { icon: Clock, label: "Routes & Schedules" },
              { icon: AlertTriangle, label: "Violations" },
              { icon: Bell, label: "Incidents" },
            ].map((item, idx) => (
              <a key={idx} href="#" className={`flex items-center gap-3 px-3 py-[13px] rounded-xl text-sm font-medium transition-all ${item.active ? 'nav-active text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                <item.icon className="w-4 h-4" /> {item.label}
              </a>
            ))}
          </nav>

          <div className="my-6 border-t border-white/10" />

          <div className="text-xs font-mono tracking-[1.5px] text-white/40 px-3 mb-2">TOOLS</div>
          <a href="#" className="flex items-center gap-3 px-3 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl">
            <QrCode className="w-4 h-4" /> Device Simulator
          </a>
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
        {/* Top Navigation Bar */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-xl z-50">
          <div className="flex items-center gap-4">
            <div className="font-mono text-xs text-white/40 tracking-[3px]">TUESDAY 12 MAY 2026 • 23:58</div>
            <div className="h-3 w-px bg-white/20" />
            <div className="text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> ALL SYSTEMS OPERATIONAL
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900 border border-white/10 px-4 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" /> {format(currentTime, 'HH:mm:ss')}
            </div>
            
            <Button variant="outline" size="sm" className="gap-2 border-white/20 hover:bg-white/5">
              <Bell className="w-4 h-4" /> Alerts <Badge variant="secondary" className="ml-1 px-1.5 h-4 text-[10px] tabular-nums">{stats.openSOS + stats.pendingViolations}</Badge>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          {/* Hero KPI Bar */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Active Patrols", value: stats.activePatrols, icon: Play, color: "emerald" },
              { label: "Compliance Rate", value: `${stats.complianceRate}%`, icon: CheckCircle, color: "emerald" },
              { label: "Open SOS Alerts", value: stats.openSOS, icon: AlertTriangle, color: "red" },
              { label: "Pending Violations", value: stats.pendingViolations, icon: AlertTriangle, color: "amber" },
            ].map((stat, i) => (
              <Card key={i} className="card-premium p-6 flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/50 font-mono tracking-widest">{stat.label.toUpperCase()}</div>
                  <div className="text-5xl font-semibold tabular-nums tracking-[-3.6px] mt-1.5">{stat.value}</div>
                </div>
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
              </Card>
            ))}
          </div>

          {/* Live Map + Active Patrols */}
          <div className="grid grid-cols-5 gap-6">
            {/* Map */}
            <div className="col-span-3">
              <div className="flex justify-between items-center mb-4 px-1">
                <div>
                  <div className="font-semibold text-xl tracking-[-0.6px]">Live Officer Positions</div>
                  <div className="text-xs text-white/50">Updated every 4 seconds • 2 officers on patrol</div>
                </div>
                <Button size="sm" variant="outline" className="border-white/20">Expand Map</Button>
              </div>
              <LiveMap sessions={sessions} />
            </div>

            {/* Active Patrols List */}
            <div className="col-span-2 space-y-4">
              <div className="flex justify-between px-1 items-center">
                <div className="font-semibold text-xl tracking-[-0.6px]">Active Patrol Sessions</div>
                <Badge variant="outline" className="font-mono">2 LIVE</Badge>
              </div>

              {sessions.map((session) => {
                const officer = officers.find(o => o.id === session.officerId)!;
                const device = devices.find(d => d.id === session.deviceId)!;
                const progress = Math.round((session.checkpointsCompleted / session.totalCheckpoints) * 100);
                
                return (
                  <Card key={session.id} className="card-premium p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-xs text-white/40 tracking-[1px]">{session.id}</div>
                        <div className="text-lg font-semibold tracking-tight mt-px">{officer.name}</div>
                        <div className="text-xs text-white/60">{device.model} • {device.id}</div>
                      </div>
                      <Badge className={`${session.status === 'in-progress' ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
                        {session.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="mt-5">
                      <div className="flex justify-between text-xs mb-1.5 font-mono text-white/50">
                        <div>PROGRESS</div>
                        <div>{session.checkpointsCompleted} / {session.totalCheckpoints} CHECKPOINTS</div>
                      </div>
                      <div className="patrol-progress">
                        <div className="patrol-progress-bar" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-5 text-xs">
                      <div className="flex items-center gap-1.5 text-white/60">
                        <Battery className="w-3.5 h-3.5" /> {device.battery}%
                      </div>
                      <div className="flex items-center gap-1.5 text-white/60">
                        <Signal className="w-3.5 h-3.5" /> {device.signal} bars
                      </div>
                      <div className="flex-1 text-right font-mono text-white/50 tabular-nums">
                        Started {format(new Date(session.startTime), 'HH:mm')}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* SOS + Violations Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* SOS Alerts */}
            <Card className="card-premium p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <div className="font-semibold text-xl tracking-[-0.6px] flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" /> ACTIVE SOS EVENTS
                  </div>
                </div>
                <div className="font-mono text-xs text-red-400/70">CRITICAL PRIORITY</div>
              </div>

              {activeSOS.length > 0 ? activeSOS.filter(s => s.status === 'active').map(sos => {
                const officer = officers.find(o => o.id === sos.officerId);
                return (
                  <div key={sos.id} className="sos-alert border rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <div className="font-mono text-xs tracking-widest mb-px text-red-400">SOS-{sos.id}</div>
                      <div className="font-semibold text-lg">{officer?.name} • {format(new Date(sos.triggeredAt), 'HH:mm')}</div>
                      <div className="text-xs text-red-200/70">Location broadcast active • GPS: {sos.gps.lat.toFixed(4)}, {sos.gps.lng.toFixed(4)}</div>
                    </div>
                    <Button onClick={() => handleResolveSOS(sos.id)} variant="destructive" className="rounded-full px-6">RESOLVE INCIDENT</Button>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-white/40">No active SOS alerts</div>
              )}
            </Card>

            {/* Violations Panel */}
            <Card className="card-premium p-6">
              <div className="font-semibold text-xl tracking-[-0.6px] mb-4 flex items-center justify-between">
                <div>Violations Requiring Review</div>
                <Badge variant="outline">{activeViolations.length}</Badge>
              </div>

              {activeViolations.length ? activeViolations.map(v => {
                const session = sessions.find(s => s.id === v.sessionId);
                const officer = officers.find(o => o.id === session?.officerId);
                return (
                  <div key={v.id} className="border border-white/10 bg-zinc-900/60 rounded-2xl px-5 py-4 mb-3 last:mb-0 flex justify-between items-center">
                    <div>
                      <div className="font-mono text-xs text-amber-400 tracking-widest">{v.id}</div>
                      <div className="font-medium tracking-tight">{officer?.name} — {v.reason}</div>
                      <div className="text-xs text-white/50 mt-px">{format(new Date(v.timestamp), 'HH:mm')} • {v.type}</div>
                    </div>
                    {!v.resolved && (
                      <Button size="sm" variant="outline" onClick={() => handleAcknowledgeViolation(v.id)}>
                        ACKNOWLEDGE
                      </Button>
                    )}
                  </div>
                );
              }) : <div className="py-6 text-center text-white/40">All clear — no open violations</div>}
            </Card>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex gap-4 pt-2">
            <Button className="flex-1 h-14 text-base rounded-2xl gap-2" variant="outline" onClick={() => setShowSimulator(true)}>
              <QrCode /> OPEN DEVICE SIMULATOR
            </Button>
            <Button className="flex-1 h-14 text-base rounded-2xl gap-2" onClick={() => toast.success('New route template created')}>
              CREATE NEW ROUTE TEMPLATE
            </Button>
          </div>
        </div>
      </div>

      {/* Device Simulator Modal */}
      <AnimatePresence>
        {showSimulator && <DeviceSimulator onClose={() => setShowSimulator(false)} />}
      </AnimatePresence>
    </div>
  );
}
