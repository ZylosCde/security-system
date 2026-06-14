import type { ApiAssignment, ApiCheckpoint, ApiOfficer, ApiPatrolState } from './api-client';
import type { Checkpoint, Officer, PatrolSession, Route } from '../types';

export function apiOfficerToOfficer(o: ApiOfficer): Officer {
  return {
    id: String(o.id),
    name: o.officerName,
    nic: o.NIC,
    position: o.Position,
    status: 'on-duty',
  };
}

export function apiCheckpointsToCheckpoints(
  cps: ApiCheckpoint[],
  siteName?: string
): Checkpoint[] {
  return cps.map((cp) => ({
    id: String(cp.id),
    name: cp.name,
    premises: siteName ?? cp.site?.name ?? `Site ${cp.siteId}`,
    lat: cp.site?.lat ?? 0,
    lng: cp.site?.lng ?? 0,
    qrToken: cp.code,
    code: cp.code,
    routeOrder: cp.routeOrder,
  }));
}

export function apiStateToRoute(state: ApiPatrolState, siteName: string): Route {
  const ordered = [...state.checkpoints].sort((a, b) => a.routeIndex - b.routeIndex);
  return {
    id: `site-${state.site.id}`,
    name: siteName,
    checkpoints: ordered.map((c) => String(c.id)),
    expectedDuration: 60,
  };
}

export function apiStateToSession(
  state: ApiPatrolState,
  officerId: string,
  deviceId: string
): PatrolSession {
  const status = state.patrol.status === 'COMPLETED' ? 'completed' : 'in-progress';
  return {
    id: String(state.patrol.id),
    deviceId,
    officerId,
    startTime: state.patrol.startedAt,
    status,
    checkpointsCompleted: state.completedCount,
    totalCheckpoints: state.totalCount,
  };
}

export function visitedIdsFromState(state: ApiPatrolState): string[] {
  return state.visitedCheckpointIds.map(String);
}

export type StoredAuth = {
  officer: ApiOfficer;
  assignment: ApiAssignment | null;
};
