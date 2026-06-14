"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  PatrolSession,
  Violation,
  SOSEvent,
  Incident,
  Officer,
  Device,
  Checkpoint,
  Route,
  Schedule,
  ScheduleHistory,
  ScheduleFrequencyPreset,
} from "@/lib/types";
import { routes as initialRoutes, schedules as initialSchedules } from "@/lib/mockData";
import {
  buildRouteFromSite,
  formatRecurrenceLabel,
  frequencyPresetToMinutes,
  nextRouteId,
  nextScheduleId,
  scheduleToHistory,
  timeStringToIso,
} from "@/lib/scheduleUtils";
import * as api from "@/lib/api-client";
import { ApiClientError } from "@/lib/api-client";
import {
  apiOfficerToOfficer,
  apiDeviceToDevice,
  apiCheckpointToCheckpoint,
  apiPatrolListToSession,
} from "@/lib/api-adapters";
import { useAuth } from "@/context/AuthContext";

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
  scheduleHistory: ScheduleHistory[];
  sites: { id: number; name: string; lat: number; lng: number }[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refreshAll: () => Promise<void>;
  refreshPatrols: () => Promise<void>;
  updateSession: (id: string, updates: Partial<PatrolSession>) => void;
  addViolation: (v: Violation) => void;
  resolveViolation: (id: string) => void;
  addSOSEvent: (sos: SOSEvent) => void;
  resolveSOS: (id: string, note: string) => void;
  addIncident: (inc: Incident) => void;
  addSession: (session: PatrolSession) => void;
  updateOfficerStatus: (id: string, status: Officer["status"]) => void;
  addOfficer: (data: {
    officerName: string;
    NIC: string;
    Position: "JPO" | "SPO";
  }) => Promise<void>;
  addDevice: (data: {
    deviceName: string;
    deviceType: string;
    imeiNumber: string;
    siteId: number;
  }) => Promise<void>;
  addCheckpoint: (data: {
    name: string;
    code: string;
    description?: string;
    siteId: number;
    routeOrder: number;
  }) => Promise<void>;
  assignDevice: (deviceId: number, officerId: number) => Promise<void>;
  createSchedule: (data: {
    siteId: number;
    startTime: string;
    endTime: string;
    frequency: ScheduleFrequencyPreset;
    officerId?: string;
  }) => void;
  renewSchedule: (
    scheduleId: string,
    data: {
      startTime: string;
      endTime: string;
      frequency: ScheduleFrequencyPreset;
    }
  ) => void;
  setScheduleStatus: (scheduleId: string, status: Schedule["status"]) => void;
  getScheduleHistory: (scheduleId: string) => ScheduleHistory[];
}

const PatrolContext = createContext<PatrolStore | null>(null);

function errorMessage(e: unknown): string {
  if (e instanceof ApiClientError) return e.message;
  if (e instanceof Error) return e.message;
  return "Failed to load data from API";
}

export function PatrolProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PatrolSession[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [sites, setSites] = useState<
    { id: number; name: string; lat: number; lng: number }[]
  >([]);
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [scheduleHistory, setScheduleHistory] = useState<ScheduleHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refreshPatrols = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.listPatrols();
      setSessions(res.patrols.map(apiPatrolListToSession));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [user]);

  const refreshAll = useCallback(async () => {
    if (!user) {
      setOfficers([]);
      setDevices([]);
      setCheckpoints([]);
      setSessions([]);
      setSites([]);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const [offRes, devRes, cpRes, patrolRes, siteRes] = await Promise.all([
        api.listOfficers(),
        api.listDevices(),
        api.listCheckpoints(),
        api.listPatrols(),
        api.listSites(),
      ]);

      const siteList =
        "sites" in siteRes
          ? siteRes.sites
          : siteRes.site
            ? [siteRes.site]
            : [];
      setSites(siteList);
      const siteById = new Map(siteList.map((s) => [s.id, s]));

      setOfficers(offRes.officers.map(apiOfficerToOfficer));
      setDevices(devRes.devices.map(apiDeviceToDevice));
      setCheckpoints(
        cpRes.checkpoints.map((cp) => {
          const site = siteById.get(cp.siteId);
          return apiCheckpointToCheckpoint(
            cp,
            site?.name,
            site?.lat,
            site?.lng
          );
        })
      );
      setSessions(patrolRes.patrols.map(apiPatrolListToSession));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const updateSession = (id: string, updates: Partial<PatrolSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const addViolation = (v: Violation) => setViolations((prev) => [v, ...prev]);
  const resolveViolation = (id: string) =>
    setViolations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, resolved: true } : v))
    );

  const addSOSEvent = (sos: SOSEvent) => setSosEvents((prev) => [sos, ...prev]);
  const resolveSOS = (id: string, note: string) => {
    setSosEvents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "resolved" as const,
              resolvedAt: new Date().toISOString(),
              resolutionNote: note,
            }
          : s
      )
    );
  };

  const addIncident = (inc: Incident) => setIncidents((prev) => [inc, ...prev]);
  const addSession = (session: PatrolSession) =>
    setSessions((prev) => [session, ...prev]);

  const updateOfficerStatus = (id: string, status: Officer["status"]) => {
    setOfficers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  };

  const addOfficer = async (data: {
    officerName: string;
    NIC: string;
    Position: "JPO" | "SPO";
  }) => {
    const res = await api.createOfficer(data);
    setOfficers((prev) => [...prev, apiOfficerToOfficer(res.officer)]);
  };

  const addDevice = async (data: {
    deviceName: string;
    deviceType: string;
    imeiNumber: string;
    siteId: number;
  }) => {
    const res = await api.createDevice(data);
    setDevices((prev) => [...prev, apiDeviceToDevice(res.device)]);
  };

  const addCheckpoint = async (data: {
    name: string;
    code: string;
    description?: string;
    siteId: number;
    routeOrder: number;
  }) => {
    const res = await api.createCheckpoint(data);
    const site = sites.find((s) => s.id === data.siteId);
    setCheckpoints((prev) => [
      ...prev,
      apiCheckpointToCheckpoint(res.checkpoint, site?.name, site?.lat, site?.lng),
    ]);
  };

  const assignDevice = async (deviceId: number, officerId: number) => {
    await api.assignDevice(deviceId, officerId);
  };

  const createSchedule = (data: {
    siteId: number;
    startTime: string;
    endTime: string;
    frequency: ScheduleFrequencyPreset;
    officerId?: string;
  }) => {
    const site = sites.find((s) => s.id === data.siteId);
    if (!site) throw new Error("Site not found");

    const siteCheckpoints = checkpoints.filter(
      (cp) => cp.siteId === data.siteId || cp.premises === site.name
    );
    if (siteCheckpoints.length === 0) {
      throw new Error("No checkpoints found for this site. Add checkpoints first.");
    }

    const now = new Date().toISOString();
    const intervalMinutes = frequencyPresetToMinutes(data.frequency);
    const routeId = nextRouteId(routes);
    const route = buildRouteFromSite(
      data.siteId,
      site.name,
      checkpoints,
      routeId
    );
    const schedule: Schedule = {
      id: nextScheduleId(schedules),
      siteId: data.siteId,
      siteName: site.name,
      routeId,
      officerId: data.officerId,
      startTime: timeStringToIso(data.startTime),
      endTime: timeStringToIso(data.endTime),
      frequencyIntervalMinutes: intervalMinutes,
      recurrence: formatRecurrenceLabel(intervalMinutes),
      status: "active",
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    setRoutes((prev) => [...prev, route]);
    setSchedules((prev) => [...prev, schedule]);
  };

  const renewSchedule = (
    scheduleId: string,
    data: {
      startTime: string;
      endTime: string;
      frequency: ScheduleFrequencyPreset;
    }
  ) => {
    const current = schedules.find((s) => s.id === scheduleId);
    if (!current) throw new Error("Schedule not found");

    setScheduleHistory((history) => [
      scheduleToHistory(current, "renew"),
      ...history,
    ]);

    const intervalMinutes = frequencyPresetToMinutes(data.frequency);
    const now = new Date().toISOString();

    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              startTime: timeStringToIso(data.startTime),
              endTime: timeStringToIso(data.endTime),
              frequencyIntervalMinutes: intervalMinutes,
              recurrence: formatRecurrenceLabel(intervalMinutes),
              version: s.version + 1,
              updatedAt: now,
              status: "active" as const,
            }
          : s
      )
    );
  };

  const setScheduleStatus = (scheduleId: string, status: Schedule["status"]) => {
    const current = schedules.find((s) => s.id === scheduleId);
    if (!current) return;

    if (status === "paused" && current.status === "active") {
      setScheduleHistory((history) => [
        scheduleToHistory({ ...current, status: "paused" }, "deactivate"),
        ...history,
      ]);
    }

    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? { ...s, status, updatedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const getScheduleHistory = (scheduleId: string) =>
    scheduleHistory.filter((h) => h.scheduleId === scheduleId);

  const value: PatrolStore = {
    sessions,
    violations,
    sosEvents,
    incidents,
    officers,
    devices,
    checkpoints,
    routes,
    schedules,
    scheduleHistory,
    sites,
    loading,
    error,
    clearError,
    refreshAll,
    refreshPatrols,
    updateSession,
    addViolation,
    resolveViolation,
    addSOSEvent,
    resolveSOS,
    addIncident,
    addSession,
    updateOfficerStatus,
    addOfficer,
    addDevice,
    addCheckpoint,
    assignDevice,
    createSchedule,
    renewSchedule,
    setScheduleStatus,
    getScheduleHistory,
  };

  return React.createElement(PatrolContext.Provider, { value }, children);
}

export function usePatrolStore() {
  const ctx = useContext(PatrolContext);
  if (!ctx) throw new Error("usePatrolStore must be used within PatrolProvider");
  return ctx;
}
