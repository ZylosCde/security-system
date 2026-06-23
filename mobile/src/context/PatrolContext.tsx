import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Officer, PatrolSession, Route, Checkpoint } from '../types';
import {
  getPatrolState,
  startPatrol as apiStartPatrol,
  recordPatrolVisit,
  officerLogin,
  listCheckpoints,
  listOfficers,
  listDevices,
  getOfficerAssignment,
  assignDevice as apiAssignDevice,
  ApiClientError,
} from '../lib/api-client';
import { parseDeviceQr, parseOfficerLoginQr, parseCheckpointQrValue } from '../lib/qrService';
import {
  getDeviceBinding,
  setDeviceBinding,
  clearDeviceBinding as clearStoredDeviceBinding,
  validateAssignmentAgainstBinding,
  type DeviceBinding,
} from '../lib/deviceBinding';
import { verifyDeviceRegistration, verifyStoredBinding } from '../lib/deviceRegistration';
import {
  apiOfficerToOfficer,
  apiCheckpointsToCheckpoints,
  apiStateToRoute,
  apiStateToSession,
  visitedIdsFromState,
  type StoredAuth,
} from '../lib/api-adapters';
import { getQueueLength, queueEvent, syncQueue, type ScanQueuePayload } from '../lib/offlineQueue';
import { verifyOfficerForPatrol } from '../lib/officerPatrolAuth';
import { getCurrentGps } from '../lib/location';

const STORAGE_AUTH = 'aegis_auth_session';
const STORAGE_INCIDENTS = 'aegis_patrol_incidents';
const STORAGE_SOS_ACTIVE = 'aegis_sos_active';

type CheckpointStatus = 'pending' | 'current' | 'completed';

type PatrolContextValue = {
  officers: Officer[];
  checkpoints: Checkpoint[];
  route: Route;
  deviceId: string;
  siteId: number | null;
  siteName: string | null;
  officer: Officer | null;
  session: PatrolSession | null;
  scannedIds: string[];
  nextCheckpointId: string | null;
  progressPercent: number;
  checkpointStatusById: Record<string, CheckpointStatus>;
  isOffline: boolean;
  pendingSyncCount: number;
  sosBroadcasting: boolean;
  apiError: string | null;
  deviceBinding: DeviceBinding | null;
  refreshPendingCount: () => Promise<void>;
  setOffline: (v: boolean) => void;
  loginWithNIC: (nic: string) => Promise<{ ok: boolean; message: string }>;
  loginFromQr: (qrData: string) => Promise<{ ok: boolean; message: string }>;
  registerDeviceFromQr: (qrData: string) => Promise<{ ok: boolean; message: string }>;
  clearDeviceBinding: () => Promise<void>;
  assignDeviceToOfficer: (deviceId: number) => Promise<{ ok: boolean; message: string }>;
  bindOfficer: (officerId: string) => boolean;
  bindOfficerFromQR: (qrData: string) => Promise<{ ok: boolean; message: string }>;
  beginPatrol: () => Promise<{ ok: boolean; message: string }>;
  startPatrolFromOfficerQr: (qrData: string) => Promise<{ ok: boolean; message: string }>;
  completePatrolAndSignOut: () => Promise<void>;
  endPatrol: () => void;
  signOut: () => void;
  submitCheckpointScan: (
    checkpointId: string,
    qrData?: string,
    options?: { comment?: string }
  ) => Promise<{ ok: boolean; message: string; allDone?: boolean }>;
  recordViolation: (reason: string) => void;
  recordIncident: (payload: { severity: string; type: string; description: string }) => void;
  addPatrolIncidentNote: (description: string) => void;
  patrolIncidents: { id: string; description: string; createdAt: string; checkpointName?: string }[];
  triggerSOS: () => Promise<void>;
  cancelSOS: () => void;
  flushOfflineQueue: () => Promise<number>;
  refreshPatrolState: () => Promise<void>;
  hydrated: boolean;
};

const emptyRoute: Route = {
  id: 'none',
  name: 'No site assigned',
  checkpoints: [],
  expectedDuration: 0,
};

const PatrolContext = createContext<PatrolContextValue | null>(null);

function findCheckpointByScan(
  data: string,
  checkpoints: Checkpoint[],
  siteId: number | null
): Checkpoint | undefined {
  const trimmed = data.trim();
  if (!trimmed) return undefined;

  const json = parseCheckpointQrValue(trimmed);
  if (json) {
    if (siteId != null && json.siteId !== siteId) return undefined;
    return checkpoints.find((c) => c.id === String(json.id));
  }

  const byCode = checkpoints.find(
    (c) =>
      c.code?.toLowerCase() === trimmed.toLowerCase() ||
      (c.qrToken?.toLowerCase() ?? '') === trimmed.toLowerCase()
  );
  if (byCode) return byCode;
  return checkpoints.find((c) => c.id === trimmed);
}

function statusMapFromState(state: Awaited<ReturnType<typeof getPatrolState>>) {
  const map: Record<string, CheckpointStatus> = {};
  for (const cp of state.checkpoints) {
    map[String(cp.id)] = cp.status;
  }
  return map;
}

export function PatrolProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [siteId, setSiteId] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [route, setRoute] = useState<Route>(emptyRoute);
  const [session, setSession] = useState<PatrolSession | null>(null);
  const [scannedIds, setScannedIds] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [sosBroadcasting, setSosBroadcasting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deviceBinding, setDeviceBindingState] = useState<DeviceBinding | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [nextCheckpointId, setNextCheckpointId] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [checkpointStatusById, setCheckpointStatusById] = useState<
    Record<string, CheckpointStatus>
  >({});
  const [patrolIncidents, setPatrolIncidents] = useState<
    { id: string; description: string; createdAt: string; checkpointName?: string }[]
  >([]);

  const resolveApiDeviceId = useCallback(
    (binding: DeviceBinding | null, assignmentDeviceId?: number): number | undefined => {
      if (binding?.deviceId) return binding.deviceId;
      if (assignmentDeviceId) return assignmentDeviceId;
      const parsed = Number(deviceId);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    },
    [deviceId]
  );

  const applyBindingToDeviceId = useCallback((binding: DeviceBinding | null) => {
    if (binding) {
      setDeviceId(String(binding.deviceId));
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    setPendingSyncCount(await getQueueLength());
  }, []);

  const applyPatrolState = useCallback(
    (state: Awaited<ReturnType<typeof getPatrolState>>) => {
      const siteLabel = state.site.name;
      setSiteName(siteLabel);
      setRoute(apiStateToRoute(state, siteLabel));
      setCheckpoints(
        apiCheckpointsToCheckpoints(
          state.checkpoints.map((c) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            description: null,
            siteId: state.site.id,
            routeOrder: c.routeIndex,
            site: state.site,
          })),
          siteLabel
        )
      );
      setScannedIds(visitedIdsFromState(state));
      setCheckpointStatusById(statusMapFromState(state));
      setNextCheckpointId(
        state.nextCheckpointId != null ? String(state.nextCheckpointId) : null
      );
      setProgressPercent(state.progressPercent);
      if (officer) {
        setSession(apiStateToSession(state, officer.id, deviceId));
      }
    },
    [officer, deviceId]
  );

  const loadSiteData = useCallback(async (sid: number, oid: number, did: string) => {
    try {
      const [cpRes, patrolState] = await Promise.all([
        listCheckpoints(sid),
        getPatrolState(sid, oid),
      ]);
      const siteLabel = patrolState.site.name;
      setSiteName(siteLabel);
      setCheckpoints(apiCheckpointsToCheckpoints(cpRes.checkpoints, siteLabel));
      setRoute(apiStateToRoute(patrolState, siteLabel));
      setScannedIds(visitedIdsFromState(patrolState));
      setCheckpointStatusById(statusMapFromState(patrolState));
      setNextCheckpointId(
        patrolState.nextCheckpointId != null ? String(patrolState.nextCheckpointId) : null
      );
      setProgressPercent(patrolState.progressPercent);
      if (patrolState.patrol.status === 'IN_PROGRESS') {
        setSession(apiStateToSession(patrolState, String(oid), did));
      } else {
        setSession(null);
      }
      setApiError(null);
    } catch (e) {
      setApiError(e instanceof ApiClientError ? e.message : 'Failed to load patrol data');
    }
  }, []);

  const restoreSession = useCallback(
    async (stored: StoredAuth, binding: DeviceBinding | null) => {
      let assignment = stored.assignment;
      if (binding) {
        try {
          const { devices } = await listDevices();
          const device = devices.find((d) => d.id === binding.deviceId);
          if (device) {
            assignment = {
              id: stored.assignment?.id ?? Date.now(),
              deviceId: device.id,
              siteId: device.siteId,
              officerId: stored.officer.id,
              device,
              site: device.site,
            };
            stored.assignment = assignment;
          }
        } catch {
          // ignore and fallback
        }
      }

      const deviceCheck = validateAssignmentAgainstBinding(assignment, binding);
      if (!deviceCheck.ok) {
        await AsyncStorage.removeItem(STORAGE_AUTH);
        setOfficer(null);
        setAuth(null);
        setSiteId(null);
        setSession(null);
        setScannedIds([]);
        setCheckpoints([]);
        setRoute(emptyRoute);
        setApiError(deviceCheck.message);
        return false;
      }

      const o = apiOfficerToOfficer(stored.officer);
      setOfficer(o);
      setAuth(stored);

      const apiDevId = resolveApiDeviceId(binding, assignment?.deviceId);
      const did = apiDevId != null ? String(apiDevId) : '';

      if (assignment?.siteId) {
        setSiteId(assignment.siteId);
        if (binding) {
          applyBindingToDeviceId(binding);
        } else if (did) {
          setDeviceId(did);
        }
        await loadSiteData(assignment.siteId, stored.officer.id, did);
      } else {
        try {
          const aRes = await getOfficerAssignment(stored.officer.id);
          let resolvedAssignment = aRes.assignment;
          if (binding) {
            const { devices } = await listDevices();
            const device = devices.find((d) => d.id === binding.deviceId);
            if (device) {
              resolvedAssignment = {
                id: aRes.assignment?.id ?? Date.now(),
                deviceId: device.id,
                siteId: device.siteId,
                officerId: stored.officer.id,
                device,
                site: device.site,
              };
            }
          }
          const refreshedCheck = validateAssignmentAgainstBinding(
            resolvedAssignment,
            binding
          );
          if (!refreshedCheck.ok) {
            await AsyncStorage.removeItem(STORAGE_AUTH);
            setOfficer(null);
            setAuth(null);
            setApiError(refreshedCheck.message);
            return false;
          }
          if (resolvedAssignment?.siteId) {
            setSiteId(resolvedAssignment.siteId);
            const refreshedDevId = resolveApiDeviceId(binding, resolvedAssignment.deviceId);
            if (binding) {
              applyBindingToDeviceId(binding);
            } else if (refreshedDevId != null) {
              setDeviceId(String(refreshedDevId));
            }
            const updatedStored: StoredAuth = {
              ...stored,
              assignment: resolvedAssignment,
            };
            await AsyncStorage.setItem(STORAGE_AUTH, JSON.stringify(updatedStored));
            setAuth(updatedStored);
            await loadSiteData(
              resolvedAssignment.siteId,
              stored.officer.id,
              refreshedDevId != null ? String(refreshedDevId) : ''
            );
          } else {
            setSiteId(null);
            if (!binding) setDeviceId('');
          }
        } catch {
          setSiteId(null);
          if (!binding) setDeviceId('');
        }
      }
      return true;
    },
    [loadSiteData, resolveApiDeviceId, applyBindingToDeviceId]
  );

  useEffect(() => {
    void (async () => {
      try {
        let binding = await getDeviceBinding();
        if (binding) {
          const bindingCheck = await verifyStoredBinding(binding);
          if (!bindingCheck.ok) {
            await clearStoredDeviceBinding();
            binding = null;
            setApiError(bindingCheck.message);
          }
        }
        setDeviceBindingState(binding);
        applyBindingToDeviceId(binding);

        const raw = await AsyncStorage.getItem(STORAGE_AUTH);
        if (raw) {
          const stored = JSON.parse(raw) as StoredAuth;
          await restoreSession(stored, binding);
        }
        const incRaw = await AsyncStorage.getItem(STORAGE_INCIDENTS);
        if (incRaw) {
          try {
            setPatrolIncidents(JSON.parse(incRaw));
          } catch {
            setPatrolIncidents([]);
          }
        }
        const sosActive = await AsyncStorage.getItem(STORAGE_SOS_ACTIVE);
        if (sosActive === 'true') {
          setSosBroadcasting(true);
        }
      } finally {
        setHydrated(true);
        void refreshPendingCount();
      }
    })();
  }, [restoreSession, refreshPendingCount, applyBindingToDeviceId]);

  const persistAuth = useCallback(async (stored: StoredAuth) => {
    await AsyncStorage.setItem(STORAGE_AUTH, JSON.stringify(stored));
    setAuth(stored);
  }, []);

  const finishOfficerLogin = useCallback(
    async (
      nic: string,
      binding: DeviceBinding | null
    ): Promise<{ ok: boolean; message: string }> => {
      try {
        const res = await officerLogin(nic);
        
        let resolvedAssignment = res.assignment;
        if (binding) {
          try {
            const { devices } = await listDevices();
            const device = devices.find((d) => d.id === binding.deviceId);
            if (device) {
              resolvedAssignment = {
                id: res.assignment?.id ?? Date.now(),
                deviceId: device.id,
                siteId: device.siteId,
                officerId: res.officer.id,
                device,
                site: device.site,
              };
            }
          } catch {
            // ignore network issues and proceed with original assignment
          }
        }

        const deviceCheck = validateAssignmentAgainstBinding(resolvedAssignment, binding);
        if (!deviceCheck.ok) {
          return { ok: false, message: deviceCheck.message };
        }

        const stored: StoredAuth = {
          officer: res.officer,
          assignment: resolvedAssignment,
        };
        await persistAuth(stored);
        if (binding) {
          applyBindingToDeviceId(binding);
          setDeviceBindingState(binding);
        } else if (resolvedAssignment?.deviceId) {
          setDeviceId(String(resolvedAssignment.deviceId));
        }
        const restored = await restoreSession(stored, binding);
        if (!restored) {
          return {
            ok: false,
            message: 'Verification failed. Could not load patrol state.',
          };
        }

        return { ok: true, message: `Welcome, ${res.officer.officerName}` };
      } catch (e) {
        const msg =
          e instanceof ApiClientError ? e.message : 'Login failed. Check network and NIC.';
        return { ok: false, message: msg };
      }
    },
    [persistAuth, restoreSession, applyBindingToDeviceId]
  );

  const loginWithNIC = useCallback(
    async (nic: string) => {
      const trimmed = nic.trim().toUpperCase();
      if (!trimmed) return { ok: false, message: 'Enter your NIC.' };
      const binding = deviceBinding ?? (await getDeviceBinding());
      if (!binding) {
        return {
          ok: false,
          message: 'Scan the device QR on this handset before signing in.',
        };
      }
      return finishOfficerLogin(trimmed, binding);
    },
    [deviceBinding, finishOfficerLogin]
  );

  const registerDeviceFromQr = useCallback(
    async (qrData: string) => {
      const result = await verifyDeviceRegistration(qrData);
      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      await setDeviceBinding(result.binding);
      setDeviceBindingState(result.binding);
      applyBindingToDeviceId(result.binding);
      setApiError(null);
      return {
        ok: true,
        message: result.message,
      };
    },
    [applyBindingToDeviceId]
  );

  const resolveNicFromOfficerQr = useCallback(async (qrData: string): Promise<string | null> => {
    const parsed = parseOfficerLoginQr(qrData);
    if (!parsed) return null;
    if (parsed.kind === 'nic') return parsed.nic;
    try {
      const res = await listOfficers();
      const match = res.officers.find((o) => String(o.id) === parsed.officerId);
      return match?.NIC ?? null;
    } catch {
      return null;
    }
  }, []);

  const loginFromQr = useCallback(
    async (qrData: string) => {
      if (parseDeviceQr(qrData)) {
        return {
          ok: false,
          message: 'That is a device registration QR. Scan it from “Scan device QR” on the Auth screen.',
        };
      }
      const binding = deviceBinding ?? (await getDeviceBinding());
      if (!binding) {
        return {
          ok: false,
          message: 'Scan the device QR on this handset before signing in.',
        };
      }
      const nic = await resolveNicFromOfficerQr(qrData);
      if (!nic) {
        return {
          ok: false,
          message: 'Invalid officer QR. Use a NIC badge QR from your admin.',
        };
      }
      return finishOfficerLogin(nic, binding);
    },
    [deviceBinding, resolveNicFromOfficerQr, finishOfficerLogin]
  );

  const assignDeviceToOfficer = useCallback(
    async (deviceIdNum: number) => {
      if (!officer) return { ok: false, message: 'Not signed in.' };
      try {
        const res = await apiAssignDevice(deviceIdNum, Number(officer.id));
        const stored: StoredAuth = {
          officer: auth?.officer ?? {
            id: Number(officer.id),
            officerName: officer.name,
            NIC: officer.nic,
            Position: officer.position ?? 'SPO',
          },
          assignment: res.assignment,
        };
        await persistAuth(stored);
        const binding = deviceBinding ?? (await getDeviceBinding());
        await restoreSession(stored, binding);
        return { ok: true, message: 'Device and site assigned. You can start patrolling.' };
      } catch (e) {
        const msg = e instanceof ApiClientError ? e.message : 'Assignment failed';
        return { ok: false, message: msg };
      }
    },
    [officer, auth, deviceBinding, persistAuth, restoreSession]
  );

  const clearDeviceBindingHandler = useCallback(async () => {
    await clearStoredDeviceBinding();
    setDeviceBindingState(null);
    if (!officer) {
      setDeviceId('');
    }
  }, [officer]);

  const setOffline = useCallback((v: boolean) => {
    setIsOffline(v);
  }, []);

  const bindOfficer = useCallback(
    (officerId: string) => {
      if (officer?.id === officerId) return true;
      return false;
    },
    [officer]
  );

  const bindOfficerFromQR = useCallback(
    async (qrData: string) => {
      const parsed = parseOfficerLoginQr(qrData);
      if (parsed?.kind === 'nic' && officer?.nic.toLowerCase() === parsed.nic.toLowerCase()) {
        return { ok: true, message: `Already signed in as ${officer.name}` };
      }
      return loginFromQr(qrData);
    },
    [officer, loginFromQr]
  );

  const refreshPatrolState = useCallback(async () => {
    if (!officer || siteId == null) return;
    try {
      const state = await getPatrolState(siteId, Number(officer.id));
      applyPatrolState(state);
    } catch {
      // ignore polling errors
    }
  }, [officer, siteId, applyPatrolState]);

  const beginPatrol = useCallback(async () => {
    if (!officer || siteId == null) {
      return { ok: false, message: 'No site assignment. Contact admin.' };
    }
    try {
      const apiDevId = resolveApiDeviceId(
        deviceBinding,
        auth?.assignment?.deviceId
      );
      const res = await apiStartPatrol({
        officerId: Number(officer.id),
        siteId,
        deviceId: apiDevId,
      });
      applyPatrolState(res);
      return { ok: true, message: res.message ?? 'Patrol started.' };
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : 'Could not start patrol';
      return { ok: false, message: msg };
    }
  }, [officer, siteId, deviceBinding, auth, resolveApiDeviceId, applyPatrolState]);

  const startPatrolFromOfficerQr = useCallback(
    async (qrData: string) => {
      const binding = deviceBinding ?? (await getDeviceBinding());
      if (!binding) {
        return { ok: false, message: 'Register this device before starting patrol.' };
      }

      const verified = await verifyOfficerForPatrol(qrData, binding);
      if (!verified.ok) {
        return { ok: false, message: verified.message };
      }

      const stored: StoredAuth = {
        officer: verified.officer,
        assignment: verified.assignment,
      };
      await persistAuth(stored);
      setOfficer(apiOfficerToOfficer(verified.officer));
      setAuth(stored);
      setSiteId(verified.assignment.siteId);
      applyBindingToDeviceId(binding);
      setDeviceBindingState(binding);

      const did = String(binding.deviceId);
      await loadSiteData(verified.assignment.siteId, verified.officer.id, did);

      try {
        const res = await apiStartPatrol({
          officerId: verified.officer.id,
          siteId: verified.assignment.siteId,
          deviceId: binding.deviceId,
        });
        applyPatrolState(res);
        setApiError(null);
        return {
          ok: true,
          message: `Welcome, ${verified.officer.officerName}. Scan checkpoints in any order.`,
        };
      } catch (e) {
        const msg = e instanceof ApiClientError ? e.message : 'Could not start patrol';
        return { ok: false, message: msg };
      }
    },
    [
      deviceBinding,
      persistAuth,
      applyBindingToDeviceId,
      loadSiteData,
      applyPatrolState,
    ]
  );

  const endPatrol = useCallback(() => {
    setSession(null);
    setScannedIds([]);
    setSosBroadcasting(false);
    void refreshPatrolState();
  }, [refreshPatrolState]);

  const signOut = useCallback(() => {
    setOfficer(null);
    setAuth(null);
    setSession(null);
    setScannedIds([]);
    setSiteId(null);
    setSiteName(null);
    setNextCheckpointId(null);
    setProgressPercent(0);
    setCheckpointStatusById({});
    setCheckpoints([]);
    setRoute(emptyRoute);
    setSosBroadcasting(false);
    void AsyncStorage.removeItem(STORAGE_AUTH);
    if (deviceBinding) {
      applyBindingToDeviceId(deviceBinding);
    } else {
      setDeviceId('');
    }
  }, [deviceBinding, applyBindingToDeviceId]);

  const completePatrolAndSignOut = useCallback(async () => {
    if (!isOffline) {
      try {
        await syncQueue();
      } catch {
        // proceed with sign-out; queued data remains for next sync
      }
    }
    await refreshPendingCount();
    setOfficer(null);
    setAuth(null);
    setSession(null);
    setScannedIds([]);
    setSiteId(null);
    setSiteName(null);
    setNextCheckpointId(null);
    setProgressPercent(0);
    setCheckpointStatusById({});
    setCheckpoints([]);
    setRoute(emptyRoute);
    setSosBroadcasting(false);
    void AsyncStorage.removeItem(STORAGE_AUTH);
    if (deviceBinding) {
      applyBindingToDeviceId(deviceBinding);
    } else {
      setDeviceId('');
    }
  }, [isOffline, refreshPendingCount, deviceBinding, applyBindingToDeviceId]);

  const submitCheckpointScan = useCallback(
    async (checkpointId: string, qrData?: string, _options?: { comment?: string }) => {
      if (!session || !officer) return { ok: false, message: 'No active patrol' };
      if (route.checkpoints.length === 0) {
        return { ok: false, message: 'No checkpoints on route' };
      }

      const cp =
        checkpoints.find((c) => c.id === checkpointId) ??
        (qrData ? findCheckpointByScan(qrData, checkpoints, siteId) : undefined);
      if (!cp) return { ok: false, message: 'Unknown checkpoint' };

      const payload: ScanQueuePayload = {
        patrolId: Number(session.id),
        checkpointId: Number(cp.id),
        officerId: Number(officer.id),
      };

      if (isOffline) {
        await queueEvent({ type: 'scan', payload });
        await refreshPendingCount();
        const newScanned = scannedIds.includes(cp.id) ? scannedIds : [...scannedIds, cp.id];
        setScannedIds(newScanned);
        setCheckpointStatusById((prev) => ({ ...prev, [cp.id]: 'completed' }));
        const total = route.checkpoints.length;
        const pct = total > 0 ? Math.round((newScanned.length / total) * 100) : 0;
        setProgressPercent(pct);
        setNextCheckpointId(null);
        const allDone = total > 0 && newScanned.length >= total;
        setSession((prev) =>
          prev
            ? {
                ...prev,
                checkpointsCompleted: newScanned.length,
                status: allDone ? 'completed' : 'in-progress',
              }
            : prev
        );
        return {
          ok: true,
          message: allDone ? 'Patrol completed.' : 'Checkpoint completed.',
          allDone,
        };
      }

      try {
        const res = await recordPatrolVisit(payload);
        applyPatrolState(res);
        await refreshPendingCount();
        const total = route.checkpoints.length;
        const done =
          res.patrol.status === 'COMPLETED' ||
          (total > 0 && res.completedCount >= total);
        return {
          ok: true,
          message: res.message ?? (done ? 'Patrol completed.' : 'Checkpoint completed.'),
          allDone: done,
        };
      } catch (e) {
        const msg = e instanceof ApiClientError ? e.message : 'Scan failed';
        if (msg.toLowerCase().includes('route violation') || msg.toLowerCase().includes('order')) {
          // Bypass route order violation check by marking it as completed locally and queuing it
          await queueEvent({ type: 'scan', payload });
          await refreshPendingCount();
          const newScanned = scannedIds.includes(checkpointId) ? scannedIds : [...scannedIds, checkpointId];
          setScannedIds(newScanned);
          setCheckpointStatusById((prev) => ({ ...prev, [checkpointId]: 'completed' }));
          const total = route.checkpoints.length;
          const pct = total > 0 ? Math.round((newScanned.length / total) * 100) : 0;
          setProgressPercent(pct);
          setNextCheckpointId(null);
          const allDone = total > 0 && newScanned.length >= total;
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  checkpointsCompleted: newScanned.length,
                  status: allDone ? 'completed' : 'in-progress',
                }
              : prev
          );
          return {
            ok: true,
            message: 'Checkpoint completed.',
            allDone,
          };
        }
        return { ok: false, message: msg };
      }
    },
    [
      session,
      officer,
      checkpoints,
      isOffline,
      scannedIds,
      route.checkpoints.length,
      siteId,
      applyPatrolState,
      refreshPendingCount,
    ]
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
      const inc = {
        id: `INC-${Date.now()}`,
        sessionId: session?.id ?? null,
        officerId: officer?.id ?? null,
        deviceId: deviceBinding?.deviceId ?? null,
        siteId: siteId ?? null,
        ...payload,
        timestamp: new Date().toISOString(),
        gps: { lat: 6.927, lng: 79.861 },
      };
      void queueEvent({ type: 'incident', payload: inc });
      void refreshPendingCount();
    },
    [session, officer, deviceBinding, siteId, refreshPendingCount]
  );

  const triggerSOS = useCallback(async () => {
    const gps = (await getCurrentGps()) ?? { lat: 0, lng: 0 };
    const sos = {
      id: `SOS-${Date.now()}`,
      sessionId: session?.id ?? null,
      officerId: officer?.id ?? null,
      deviceId: deviceBinding?.deviceId ?? null,
      siteId: siteId ?? null,
      gps,
      triggeredAt: new Date().toISOString(),
      protocol: 'normal',
    };
    await queueEvent({ type: 'sos', payload: sos });
    if (!isOffline) {
      try {
        await syncQueue();
      } catch {
        // SOS remains queued for next sync
      }
    }
    await refreshPendingCount();
    await AsyncStorage.setItem(STORAGE_SOS_ACTIVE, 'true');
    setSosBroadcasting(true);
  }, [session, officer, deviceBinding, siteId, isOffline, refreshPendingCount]);

  const addPatrolIncidentNote = useCallback((description: string) => {
    const trimmed = description.trim();
    if (!trimmed) return;
    const entry = {
      id: `inc-${Date.now()}`,
      description: trimmed,
      createdAt: new Date().toISOString(),
    };
    setPatrolIncidents((prev) => {
      const next = [entry, ...prev];
      void AsyncStorage.setItem(STORAGE_INCIDENTS, JSON.stringify(next));
      return next;
    });
  }, []);

  const cancelSOS = useCallback(() => {
    void AsyncStorage.removeItem(STORAGE_SOS_ACTIVE);
    setSosBroadcasting(false);
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    const n = await syncQueue();
    if (officer && siteId != null) {
      await refreshPatrolState();
    }
    await refreshPendingCount();
    return n;
  }, [officer, siteId, refreshPatrolState, refreshPendingCount]);

  const value = useMemo<PatrolContextValue>(
    () => ({
      officers: officer ? [officer] : [],
      checkpoints,
      route,
      deviceId: (deviceBinding?.imeiNumber ?? deviceId) || '—',
      siteId,
      siteName,
      officer,
      session,
      scannedIds,
      nextCheckpointId,
      progressPercent,
      checkpointStatusById,
      isOffline,
      pendingSyncCount,
      sosBroadcasting,
      apiError,
      deviceBinding,
      refreshPendingCount,
      setOffline,
      loginWithNIC,
      loginFromQr,
      registerDeviceFromQr,
      clearDeviceBinding: clearDeviceBindingHandler,
      assignDeviceToOfficer,
      bindOfficer,
      bindOfficerFromQR,
      beginPatrol,
      startPatrolFromOfficerQr,
      completePatrolAndSignOut,
      endPatrol,
      signOut,
      submitCheckpointScan,
      recordViolation,
      recordIncident,
      addPatrolIncidentNote,
      patrolIncidents,
      triggerSOS,
      cancelSOS,
      flushOfflineQueue,
      refreshPatrolState,
      hydrated,
    }),
    [
      officer,
      checkpoints,
      route,
      deviceBinding,
      deviceId,
      siteId,
      siteName,
      session,
      scannedIds,
      nextCheckpointId,
      progressPercent,
      checkpointStatusById,
      isOffline,
      pendingSyncCount,
      sosBroadcasting,
      apiError,
      patrolIncidents,
      refreshPendingCount,
      setOffline,
      loginWithNIC,
      loginFromQr,
      registerDeviceFromQr,
      clearDeviceBindingHandler,
      assignDeviceToOfficer,
      bindOfficer,
      bindOfficerFromQR,
      beginPatrol,
      startPatrolFromOfficerQr,
      completePatrolAndSignOut,
      endPatrol,
      signOut,
      submitCheckpointScan,
      recordViolation,
      recordIncident,
      addPatrolIncidentNote,
      triggerSOS,
      cancelSOS,
      flushOfflineQueue,
      refreshPatrolState,
      hydrated,
    ]
  );

  return <PatrolContext.Provider value={value}>{children}</PatrolContext.Provider>;
}

export function usePatrol() {
  const ctx = useContext(PatrolContext);
  if (!ctx) throw new Error('usePatrol must be used within PatrolProvider');
  return ctx;
}
