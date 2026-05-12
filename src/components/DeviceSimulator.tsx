"use client";

import React, { useState } from 'react';
import { X, Play, AlertTriangle, Shield, QrCode, Clock, MapPin, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { officers, checkpoints } from '@/lib/mockData';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceSimulatorProps {
  onClose: () => void;
}

export function DeviceSimulator({ onClose }: DeviceSimulatorProps) {
  const [step, setStep] = useState<'idle' | 'scanning' | 'patrol' | 'violation' | 'sos'>('idle');
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [currentPatrol, setCurrentPatrol] = useState<any>(null);
  const [scannedCheckpoints, setScannedCheckpoints] = useState<string[]>([]);
  const [sosCountdown, setSosCountdown] = useState(0);

  const startPatrol = (officerId: string) => {
    const officer = officers.find(o => o.id === officerId)!;
    const patrol = {
      id: 'PS-' + Math.floor(1000 + Math.random() * 9000),
      officer,
      startedAt: new Date(),
      route: 'VISTA Night Perimeter',
    };
    setSelectedOfficer(officerId);
    setCurrentPatrol(patrol);
    setStep('patrol');
    setScannedCheckpoints([]);
    toast.success(`Session started`, { description: `${officer.name} authenticated via NFC. Patrol active.` });
  };

  const scanCheckpoint = (cpId: string) => {
    if (scannedCheckpoints.includes(cpId)) return;
    
    const newScanned = [...scannedCheckpoints, cpId];
    setScannedCheckpoints(newScanned);

    if (newScanned.length === 3) {
      toast.success('Patrol complete', { description: 'All checkpoints scanned. Session logged.' });
      setTimeout(() => {
        resetSimulator();
      }, 1400);
    } else {
      toast.info(`Checkpoint scanned`, { description: checkpoints.find(c => c.id === cpId)?.name });
    }
  };

  const triggerViolation = () => {
    setStep('violation');
  };

  const submitViolation = (reason: string) => {
    toast.error('Violation recorded', { description: reason });
    setStep('patrol');
    // In real app would sync to backend even offline
  };

  const triggerSOS = () => {
    setStep('sos');
    setSosCountdown(3);

    const countdown = setInterval(() => {
      setSosCountdown(c => {
        if (c <= 1) {
          clearInterval(countdown);
          setTimeout(() => {
            toast.error('SOS BROADCAST ACTIVE', { 
              description: 'GPS location streamed to all admins. Push + SMS sent.', 
              duration: 8000 
            });
            setStep('patrol');
            setSosCountdown(0);
          }, 800);
          return 0;
        }
        return c - 1;
      });
    }, 900);
  };

  const resetSimulator = () => {
    setStep('idle');
    setSelectedOfficer(null);
    setCurrentPatrol(null);
    setScannedCheckpoints([]);
    setSosCountdown(0);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-[380px]" onClick={e => e.stopPropagation()}>
        {/* Device Frame */}
        <div className="qr-simulator relative">
          {/* Device Header */}
          <div className="flex items-center justify-between mb-8 w-full">
            <div className="flex items-center gap-2 text-xs font-mono tracking-[2px] text-white/60">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> RUGGEDPAD X7
            </div>
            <div onClick={onClose} className="text-white/40 hover:text-white cursor-pointer"><X size={18} /></div>
          </div>

          <AnimatePresence mode="wait">
            {/* IDLE: Officer Selection */}
            {step === 'idle' && (
              <div className="w-full text-center">
                <div className="mx-auto mb-6 w-16 h-16 rounded-2xl border border-white/20 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-white/70" />
                </div>
                <div className="text-2xl tracking-tight font-semibold">Scan Officer NFC</div>
                <div className="text-sm text-white/60 mt-2 mb-9">Non-linked authentication • No password required</div>

                <div className="space-y-2">
                  {officers.filter(o => o.status !== 'off-duty').map(officer => (
                    <button
                      key={officer.id}
                      onClick={() => startPatrol(officer.id)}
                      className="w-full border border-white/10 hover:bg-white/5 transition flex justify-between px-6 py-4 rounded-2xl text-left"
                    >
                      <div>
                        <div className="font-medium">{officer.name}</div>
                        <div className="text-xs text-white/50 font-mono">{officer.nic}</div>
                      </div>
                      <div className="text-xs px-3 py-1 self-center rounded bg-emerald-500/10 text-emerald-400">ON DUTY</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PATROL ACTIVE */}
            {step === 'patrol' && currentPatrol && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="font-mono text-xs tracking-[2px] text-emerald-400">PATROL ACTIVE</div>
                    <div className="font-semibold text-2xl tracking-[-1px] mt-px">{currentPatrol.officer.name}</div>
                  </div>
                  <div className="text-right text-xs font-mono text-white/60">
                    {currentPatrol.route}<br />{currentPatrol.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex gap-2 mb-6 text-xs">
                  <div className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                    {isOffline ? <WifiOff className="text-amber-400" size={15} /> : <Wifi className="text-emerald-400" size={15} />}
                    <div>{isOffline ? 'OFFLINE MODE' : 'SYNCED • LIVE'}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsOffline(!isOffline)} className="rounded-2xl border-white/20 px-5">
                    Toggle Offline
                  </Button>
                </div>

                {/* Checkpoints */}
                <div className="mb-6">
                  <div className="uppercase tracking-[1.5px] text-xs text-white/50 mb-3 px-1">TODAY’S CHECKPOINTS</div>
                  {checkpoints.slice(0, 4).map((cp, idx) => {
                    const scanned = scannedCheckpoints.includes(cp.id);
                    return (
                      <button 
                        key={idx} 
                        disabled={scanned}
                        onClick={() => scanCheckpoint(cp.id)}
                        className={`w-full flex items-center justify-between text-sm border rounded-2xl px-5 py-[17px] mb-2 transition ${scanned ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400' : 'border-white/10 hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3"><MapPin size={15} /> {cp.name}</div>
                        {scanned && <div className="font-mono text-[10px]">SCANNED ✓</div>}
                      </button>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={triggerViolation} variant="outline" className="h-14 rounded-2xl border-amber-500/30 text-amber-400 hover:bg-amber-950/40">REPORT VIOLATION</Button>
                  <Button onClick={triggerSOS} variant="destructive" className="h-14 rounded-2xl">SOS</Button>
                </div>
              </div>
            )}

            {/* VIOLATION FLOW */}
            {step === 'violation' && (
              <div>
                <div className="font-semibold tracking-tight text-xl mb-2">Select Violation Reason</div>
                <div className="text-white/60 text-sm mb-6">Reason will be timestamped and attached to patrol log.</div>
                
                {['Emergency on premises', 'Equipment failure', 'Supervisor instruction', 'Medical', 'Other (text required)'].map(reason => (
                  <button key={reason} onClick={() => submitViolation(reason)} className="w-full text-left border border-white/10 hover:bg-white/5 px-6 py-4 rounded-2xl mb-2 text-sm">
                    {reason}
                  </button>
                ))}
                <Button variant="ghost" onClick={() => setStep('patrol')} className="mt-4 w-full">CANCEL</Button>
              </div>
            )}

            {/* SOS COUNTDOWN */}
            {step === 'sos' && (
              <div className="text-center py-12">
                <div className="mx-auto mb-6 text-red-500"><AlertTriangle size={52} /></div>
                <div className="text-7xl tabular-nums font-mono tracking-[-4px] font-semibold text-red-500 mb-3">{sosCountdown}</div>
                <div className="uppercase tracking-[4px] text-xs text-red-400 mb-6">CANCEL WITHIN 3 SECONDS</div>
                <Button variant="outline" size="lg" onClick={() => { setStep('patrol'); setSosCountdown(0); }} className="rounded-full px-12">CANCEL SOS</Button>
              </div>
            )}
          </AnimatePresence>

          {/* Footer Info */}
          <div className="text-center text-[10px] text-white/30 mt-10 tracking-[1px] font-mono">OFFLINE-FIRST • HMAC QR • SESSION-BASED</div>
        </div>
      </div>
    </div>
  );
}
