import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Officer, PatrolSession, Route, Checkpoint } from '../types';
import { CHECKPOINTS, DEFAULT_ROUTE, DEVICE_ID, OFFICERS } from '../data/patrolData';
import { validateQRToken } from '../lib/qrService';
import { generateScanEvent, validateCheckpointScan } from '../lib/routeEngine';
import { getQueueLength, queueEvent, syncQueue } from '../lib/offlineQueue';

type PatrolContextValue = {
  officers: Officer[];
  checkpoints: Checkpoint[];
  route: Route;
  deviceId: string;
  /** Bound field identity (after auth scan) */
  officer: Officer | null;
  session: PatrolSession | null;
  scannedIds: string[];
  isOffline: boolean;
  pendingSyncCount: number;
  sosBroadcasting: boolean;
  refreshPendingCount: () => Promise<void>;
  setOffline: (v: boolean) => void;
  bindOfficer: (officerId: string) => boolean;
  beginPatrol: () => void;
  /** Ends active patrol only; keeps officer bound to device */
  endPatrol: () => void;
  /** Clears officer + session (return to auth) */
  signOut: () => void;
  submitCheckpointScan: (checkpointId: string, qrData?: string) => { ok: boolean; message: string };
  recordViolation: (reason: string) => void;
  recordIncident: (payload: { severity: string; type: string; description: string }) => void;
  triggerSOS: () => void;
  cancelSOS: () => void;
  flushOfflineQueue: () => Promise<number>;
};

const PatrolContext = createContext<PatrolContextValue | null>(null);

export function PatrolProvider({ children }: { children: ReactNode }) {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [session, setSession] = useState<PatrolSession | null>(null);
  const [scannedIds, setScannedIds] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [sosBroadcasting, setSosBroadcasting] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    setPendingSyncCount(await getQueueLength());
  }, []);

  const setOffline = useCallback((v: boolean) => {
    setIsOffline(v);
  }, []);

  const bindOfficer = useCallback((officerId: string) => {
    const o = OFFICERS.find((x) => x.id === officerId && x.status !== 'off-duty');
    if (!o) return false;
    setOfficer(o);
    return true;
  }, []);

  const beginPatrol = useCallback(() => {
    if (!officer) return;
    const id = `PS-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    setScannedIds([]);
    setSession({
      id,
      deviceId: DEVICE_ID,
      officerId: officer.id,
      startTime: now,
      status: 'in-progress',
      checkpointsCompleted: 0,
      totalCheckpoints: DEFAULT_ROUTE.checkpoints.length,
    });
  }, [officer]);

  const endPatrol = useCallback(() => {
    setSession(null);
    setScannedIds([]);
    setSosBroadcasting(false);
  }, []);

  const signOut = useCallback(() => {
    setOfficer(null);
    setSession(null);
    setScannedIds([]);
    setSosBroadcasting(false);
  }, []);

  const submitCheckpointScan = useCallback(
    (checkpointId: string, qrData?: string) => {
      if (!session) return { ok: false, message: 'No active session' };

      const cp = CHECKPOINTS.find((c) => c.id === checkpointId);
      if (!cp) return { ok: false, message: 'Unknown checkpoint' };
      if (scannedIds.includes(checkpointId)) return { ok: false, message: 'Already scanned' };

      const tokenToValidate = qrData?.trim() || cp.qrToken;
      const qr = validateQRToken(tokenToValidate, CHECKPOINTS);
      if (!qr.valid || !qr.checkpoint) {
        return { ok: false, message: 'Invalid or expired QR token' };
      }
      if (qr.checkpoint.id !== checkpointId) {
        return { ok: false, message: 'QR does not match this checkpoint' };
      }

      const sessionForEngine: PatrolSession = {
        ...session,
        checkpointsCompleted: scannedIds.length,
      };

      const validation = validateCheckpointScan(sessionForEngine, DEFAULT_ROUTE, CHECKPOINTS, {
        checkpointId,
        timestamp: new Date().toISOString(),
        gps: { lat: cp.lat, lng: cp.lng },
      });

      if (!validation.valid && validation.violation) {
        const v = { ...validation.violation, id: `V-${Date.now()}` };
        if (isOffline) void queueEvent({ type: 'violation', payload: v });
        void refreshPendingCount();
      }

      if (validation.valid === false) {
        return { ok: false, message: validation.violation?.reason ?? 'Scan rejected' };
      }

      const newScanned = [...scannedIds, checkpointId];
      setScannedIds(newScanned);

      const event = generateScanEvent(session.id, checkpointId, { lat: cp.lat, lng: cp.lng }, DEVICE_ID);
      if (isOffline) void queueEvent({ type: 'scan', payload: event });
      void refreshPendingCount();

      setSession((prev) =>
        prev
          ? {
              ...prev,
              checkpointsCompleted: newScanned.length,
              status: newScanned.length >= DEFAULT_ROUTE.checkpoints.length ? 'completed' : 'in-progress',
            }
          : prev
      );

      if (newScanned.length >= DEFAULT_ROUTE.checkpoints.length) {
        return { ok: true, message: 'Patrol complete' };
      }
      return { ok: true, message: `Verified: ${cp.name}` };
    },
    [session, scannedIds, isOffline, refreshPendingCount]
  );

  const recordViolation = useCallback(
    (reason: string) => {
      if (!session) return;
      const v = {
        id: `V-${Date.now()}`,
        sessionId: session.id,
        type: 'manual',
        reason,
        timestamp: new Date().toISOString(),
        gps: { lat: 6.927, lng: 79.861 },
        critical: reason.toLowerCase().includes('emergency'),
      };
      if (isOffline) void queueEvent({ type: 'violation', payload: v });
      void refreshPendingCount();
    },
    [session, isOffline, refreshPendingCount]
  );

  const recordIncident = useCallback(
    (payload: { severity: string; type: string; description: string }) => {
      if (!session) return;
      const inc = {
        id: `INC-${Date.now()}`,
        sessionId: session.id,
        ...payload,
        timestamp: new Date().toISOString(),
        gps: { lat: 6.927, lng: 79.861 },
      };
      if (isOffline) void queueEvent({ type: 'incident', payload: inc });
      void refreshPendingCount();
    },
    [session, isOffline, refreshPendingCount]
  );

  const triggerSOS = useCallback(() => {
    if (!session || !officer) return;
    const sos = {
      id: `SOS-${Date.now()}`,
      sessionId: session.id,
      officerId: officer.id,
      gps: { lat: 6.927, lng: 79.861 },
      triggeredAt: new Date().toISOString(),
    };
    if (isOffline) void queueEvent({ type: 'sos', payload: sos });
    void refreshPendingCount();
    setSosBroadcasting(true);
  }, [session, officer, isOffline, refreshPendingCount]);

  const cancelSOS = useCallback(() => {
    setSosBroadcasting(false);
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    const n = await syncQueue();
    await refreshPendingCount();
    return n;
  }, [refreshPendingCount]);

  const value = useMemo<PatrolContextValue>(
    () => ({
      officers: OFFICERS,
      checkpoints: CHECKPOINTS,
      route: DEFAULT_ROUTE,
      deviceId: DEVICE_ID,
      officer,
      session,
      scannedIds,
      isOffline,
      pendingSyncCount,
      sosBroadcasting,
      refreshPendingCount,
      setOffline,
      bindOfficer,
      beginPatrol,
      endPatrol,
      signOut,
      submitCheckpointScan,
      recordViolation,
      recordIncident,
      triggerSOS,
      cancelSOS,
      flushOfflineQueue,
    }),
    [
      officer,
      session,
      scannedIds,
      isOffline,
      pendingSyncCount,
      sosBroadcasting,
      refreshPendingCount,
      setOffline,
      bindOfficer,
      beginPatrol,
      endPatrol,
      signOut,
      submitCheckpointScan,
      recordViolation,
      recordIncident,
      triggerSOS,
      cancelSOS,
      flushOfflineQueue,
    ]
  );

  return <PatrolContext.Provider value={value}>{children}</PatrolContext.Provider>;
}

export function usePatrol() {
  const ctx = useContext(PatrolContext);
  if (!ctx) throw new Error('usePatrol must be used within PatrolProvider');
  return ctx;
}
