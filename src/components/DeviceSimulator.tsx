"use client";

import React, { useState } from 'react';
import { X, AlertTriangle, QrCode, MapPin, Wifi, WifiOff, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/mockData';
import { usePatrolStore } from '@/hooks/usePatrolStore';
import { validateQRToken } from '@/lib/qrService';
import { validateCheckpointScan, generateScanEvent } from '@/lib/routeEngine';
import { queueEvent, syncQueue, hasPendingSync } from '@/lib/offlineSync';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';

interface DeviceSimulatorProps {
  onClose: () => void;
}

export function DeviceSimulator({ onClose }: DeviceSimulatorProps) {
  const { addSession, updateSession, addViolation, addSOSEvent, addIncident, officers: storeOfficers, checkpoints: storeCheckpoints, routes: storeRoutes } = usePatrolStore();

  const [step, setStep] = useState<'idle' | 'patrol' | 'violation' | 'incident' | 'sos'>('idle');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [scanned, setScanned] = useState<string[]>([]);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [incidentForm, setIncidentForm] = useState({ severity: 'Medium', type: 'Suspicious Activity', description: '' });

  const currentOfficer = storeOfficers.find(o => o.id === selectedOfficerId);
  const currentRoute = storeRoutes[0];
  const activeCheckpoints = storeCheckpoints.filter(c => currentRoute.checkpoints.includes(c.id));

  const startPatrol = (officerId: string) => {
    const officer = storeOfficers.find(o => o.id === officerId)!;
    const sessionId = 'PS-' + Date.now().toString().slice(-5);
    const newSession = {
      id: sessionId,
      deviceId: 'D-001',
      officerId,
      scheduleId: 'S-001',
      startTime: new Date().toISOString(),
      status: 'in-progress' as const,
      checkpointsCompleted: 0,
      totalCheckpoints: currentRoute.checkpoints.length,
      violations: 0,
      currentLocation: { lat: 6.927, lng: 79.861 },
    };
    addSession(newSession);
    setSelectedOfficerId(officerId);
    setCurrentSessionId(sessionId);
    setStep('patrol');
    setScanned([]);
    toast.success('Patrol started', { description: `${officer.name} authenticated. Session live.` });
  };

  const scanCheckpoint = (cpId: string) => {
    if (!currentSessionId || scanned.includes(cpId)) return;

    const cp = storeCheckpoints.find(c => c.id === cpId)!;
    const session = { id: currentSessionId, checkpointsCompleted: scanned.length, startTime: new Date().toISOString() } as any;

    // QR + proximity validation
    const tokenValid = validateQRToken(cp.qrToken, storeCheckpoints).valid;
    if (!tokenValid) {
      toast.error('Invalid QR token', { description: 'Token expired or spoofed.' });
      return;
    }

    const validation = validateCheckpointScan(session, currentRoute, storeCheckpoints, {
      checkpointId: cpId,
      timestamp: new Date().toISOString(),
      gps: { lat: cp.lat, lng: cp.lng },
    });

    if (!validation.valid && validation.violation) {
      const v = { ...validation.violation, id: 'V-' + Date.now(), resolved: false } as any;
      addViolation(v);
      if (isOffline) queueEvent({ type: 'violation', payload: v });
    }

    const newScanned = [...scanned, cpId];
    setScanned(newScanned);

    const event = generateScanEvent(currentSessionId, cpId, { lat: cp.lat, lng: cp.lng }, 'D-001');
    if (isOffline) queueEvent({ type: 'scan', payload: event });

    updateSession(currentSessionId, { checkpointsCompleted: newScanned.length });

    if (newScanned.length === currentRoute.checkpoints.length) {
      updateSession(currentSessionId, { status: 'completed' });
      toast.success('Patrol complete');
      setTimeout(reset, 1200);
    } else {
      toast.info('Checkpoint verified', { description: cp.name });
    }
  };

  const reportViolation = (reason: string) => {
    if (!currentSessionId) return;
    const v = {
      id: 'V-' + Date.now(),
      sessionId: currentSessionId,
      type: 'skipped-checkpoint' as const,
      reason,
      timestamp: new Date().toISOString(),
      gps: { lat: 6.927, lng: 79.861 },
      critical: reason.includes('Emergency'),
      resolved: false,
    };
    addViolation(v);
    if (isOffline) queueEvent({ type: 'violation', payload: v });
    toast.error('Violation logged');
    setStep('patrol');
  };

  const reportIncident = () => {
    if (!currentSessionId) return;
    const inc = {
      id: 'INC-' + Date.now(),
      sessionId: currentSessionId,
      severity: incidentForm.severity as any,
      type: incidentForm.type as any,
      description: incidentForm.description || 'No details provided',
      timestamp: new Date().toISOString(),
      gps: { lat: 6.927, lng: 79.861 },
      media: [],
      checkpointRef: activeCheckpoints[scanned.length]?.id,
    };
    addIncident(inc);
    toast.success('Incident reported');
    setStep('patrol');
    setIncidentForm({ severity: 'Medium', type: 'Suspicious Activity', description: '' });
  };

  const triggerSOS = () => {
    setStep('sos');
    setSosCountdown(3);
    const interval = setInterval(() => {
      setSosCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          if (currentSessionId && selectedOfficerId) {
            const sos = {
              id: 'SOS-' + Date.now(),
              sessionId: currentSessionId,
              officerId: selectedOfficerId,
              gps: { lat: 6.927, lng: 79.861 },
              triggeredAt: new Date().toISOString(),
              status: 'active' as const,
            };
            addSOSEvent(sos);
            if (isOffline) queueEvent({ type: 'sos', payload: sos });
          }
          toast.error('SOS ACTIVE', { description: 'GPS broadcast to all admins.' });
          setStep('patrol');
          setSosCountdown(0);
          return 0;
        }
        return c - 1;
      });
    }, 850);
  };

  const reset = () => {
    setStep('idle');
    setSelectedOfficerId(null);
    setCurrentSessionId(null);
    setScanned([]);
    setSosCountdown(0);
    if (hasPendingSync()) {
      syncQueue((n) => toast.info(`${n} events synced`));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-[380px] bg-zinc-950 border border-white/10 rounded-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-mono tracking-[2px] text-white/60">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> RUGGEDPAD X7
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <div>
              <div className="text-center mb-8">
                <QrCode className="mx-auto w-10 h-10 text-white/60 mb-3" />
                <div className="text-2xl font-semibold tracking-tight">Scan Officer NFC</div>
                <div className="text-sm text-white/50 mt-1">Non-linked • Session-bound</div>
              </div>
              <div className="space-y-2">
                {storeOfficers.filter(o => o.status !== 'off-duty').map(o => (
                  <button key={o.id} onClick={() => startPatrol(o.id)} className="w-full flex justify-between border border-white/10 hover:bg-white/5 px-5 py-4 rounded-2xl text-left text-sm">
                    <div>
                      <div className="font-medium">{o.name}</div>
                      <div className="font-mono text-xs text-white/40">{o.nic}</div>
                    </div>
                    <div className="text-emerald-400 text-xs self-center px-2 py-0.5 rounded bg-emerald-500/10">ON DUTY</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'patrol' && currentOfficer && (
            <div>
              <div className="flex justify-between mb-6">
                <div>
                  <div className="font-mono text-[10px] text-emerald-400 tracking-widest">ACTIVE PATROL</div>
                  <div className="text-xl font-semibold tracking-[-0.5px]">{currentOfficer.name}</div>
                </div>
                <div className="text-right text-xs font-mono text-white/50">
                  {currentRoute.name}<br />{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="flex gap-2 mb-5 text-xs">
                <div className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  {isOffline ? <WifiOff className="text-amber-400" size={14} /> : <Wifi className="text-emerald-400" size={14} />}
                  {isOffline ? 'OFFLINE — QUEUED' : 'LIVE SYNCED'}
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsOffline(!isOffline)} className="rounded-2xl border-white/20">Toggle</Button>
              </div>

              <div className="mb-5">
                <div className="uppercase text-[10px] tracking-[1.5px] text-white/40 mb-2 px-1">CHECKPOINTS</div>
                {activeCheckpoints.map((cp) => {
                  const done = scanned.includes(cp.id);
                  return (
                    <button key={cp.id} disabled={done} onClick={() => scanCheckpoint(cp.id)} className={`w-full flex items-center justify-between text-sm border rounded-2xl px-5 py-[15px] mb-1.5 ${done ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' : 'border-white/10 hover:bg-white/5'}`}>
                      <div className="flex items-center gap-3"><MapPin size={15} />{cp.name}</div>
                      {done && <div className="font-mono text-[10px]">VERIFIED</div>}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => setStep('violation')} variant="outline" className="h-12 rounded-2xl border-amber-500/30 text-amber-400 text-xs">VIOLATION</Button>
                <Button onClick={() => setStep('incident')} variant="outline" className="h-12 rounded-2xl border-white/20 text-xs"><Camera className="w-3.5 h-3.5 mr-1" /> INCIDENT</Button>
                <Button onClick={triggerSOS} variant="destructive" className="h-12 rounded-2xl text-xs">SOS</Button>
              </div>
            </div>
          )}

          {step === 'violation' && (
            <div>
              <div className="font-semibold text-xl tracking-tight mb-1">Report Violation</div>
              <div className="text-sm text-white/50 mb-6">Select reason. Timestamp + GPS attached.</div>
              {['Emergency on premises', 'Equipment failure', 'Supervisor instruction', 'Medical', 'Other (text required)'].map(r => (
                <button key={r} onClick={() => reportViolation(r)} className="w-full text-left border border-white/10 hover:bg-white/5 px-5 py-[15px] rounded-2xl mb-2 text-sm">{r}</button>
              ))}
              <Button variant="ghost" onClick={() => setStep('patrol')} className="w-full mt-2">Cancel</Button>
            </div>
          )}

          {step === 'incident' && (
            <div>
              <div className="font-semibold text-xl mb-4">Log Incident</div>
              <select value={incidentForm.type} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })} className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-sm mb-3">
                {['Trespasser','Theft','Fire','Injury','Suspicious Activity','Equipment Failure','Other'].map(t => <option key={t}>{t}</option>)}
              </select>
              <textarea value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} placeholder="Description..." className="w-full h-24 bg-zinc-900 border border-white/10 rounded-2xl p-4 text-sm mb-3" />
              <div className="flex gap-2">
                <Button onClick={reportIncident} className="flex-1 h-12 rounded-2xl">SUBMIT REPORT</Button>
                <Button variant="outline" onClick={() => setStep('patrol')} className="flex-1 h-12 rounded-2xl">Cancel</Button>
              </div>
            </div>
          )}

          {step === 'sos' && (
            <div className="text-center py-10">
              <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
              <div className="text-6xl tabular-nums font-mono tracking-[-3px] text-red-500 mb-2">{sosCountdown}</div>
              <div className="tracking-[3px] text-xs text-red-400 mb-8">CANCEL WITHIN 3 SECONDS</div>
              <Button variant="outline" onClick={() => { setStep('patrol'); setSosCountdown(0); }} className="rounded-full px-10">CANCEL</Button>
            </div>
          )}
        </AnimatePresence>

        <div className="text-center text-[10px] text-white/30 mt-8 tracking-[1px] font-mono">OFFLINE-FIRST • ROTATING HMAC QR • SESSION LOGGED</div>
      </div>
    </div>
  );
}
