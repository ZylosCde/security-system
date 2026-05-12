"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PatrolSession, Violation, SOSEvent, Incident, Officer, Device, Checkpoint, Route, Schedule } from '@/lib/types';
import { activeSessions as initialSessions, violations as initialViolations, sosEvents as initialSOS, incidents as initialIncidents, officers as initialOfficers, devices as initialDevices, checkpoints as initialCheckpoints, routes as initialRoutes, schedules as initialSchedules } from '@/lib/mockData';

interface PatrolStore {
  sessions: PatrolSession[];
  violations: Violation[];
  sosEvents: SOSEvent[];
  incidents: Incident[];
  officers: Officer[];
  devices: Device[];
  checkpoints: Checkpoint[];
  routes: Route[];
  schedules: Schedule[];
  updateSession: (id: string, updates: Partial<PatrolSession>) => void;
  addViolation: (v: Violation) => void;
  resolveViolation: (id: string) => void;
  addSOSEvent: (sos: SOSEvent) => void;
  resolveSOS: (id: string, note: string) => void;
  addIncident: (inc: Incident) => void;
  addSession: (session: PatrolSession) => void;
  updateOfficerStatus: (id: string, status: Officer['status']) => void;
}

const PatrolContext = createContext<PatrolStore | null>(null);

export function PatrolProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<PatrolSession[]>(initialSessions);
  const [violations, setViolations] = useState<Violation[]>(initialViolations);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>(initialSOS);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [officers, setOfficers] = useState<Officer[]>(initialOfficers);
  const [devices] = useState<Device[]>(initialDevices);
  const [checkpoints] = useState<Checkpoint[]>(initialCheckpoints);
  const [routes] = useState<Route[]>(initialRoutes);
  const [schedules] = useState<Schedule[]>(initialSchedules);

  const updateSession = (id: string, updates: Partial<PatrolSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addViolation = (v: Violation) => setViolations(prev => [v, ...prev]);
  const resolveViolation = (id: string) => setViolations(prev => prev.map(v => v.id === id ? { ...v, resolved: true } : v));

  const addSOSEvent = (sos: SOSEvent) => setSosEvents(prev => [sos, ...prev]);
  const resolveSOS = (id: string, note: string) => {
    setSosEvents(prev => prev.map(s => s.id === id ? { ...s, status: 'resolved' as const, resolvedAt: new Date().toISOString(), resolutionNote: note } : s));
  };

  const addIncident = (inc: Incident) => setIncidents(prev => [inc, ...prev]);
  const addSession = (session: PatrolSession) => setSessions(prev => [session, ...prev]);

  const updateOfficerStatus = (id: string, status: Officer['status']) => {
    setOfficers(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const value: PatrolStore = {
    sessions, violations, sosEvents, incidents, officers, devices, checkpoints, routes, schedules,
    updateSession, addViolation, resolveViolation, addSOSEvent, resolveSOS, addIncident, addSession, updateOfficerStatus,
  };

  return React.createElement(PatrolContext.Provider, { value }, children);
}

export function usePatrolStore() {
  const ctx = useContext(PatrolContext);
  if (!ctx) throw new Error('usePatrolStore must be used within PatrolProvider');
  return ctx;
}