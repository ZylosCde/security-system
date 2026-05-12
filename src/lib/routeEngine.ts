import { Checkpoint, Route, PatrolSession, Violation, ScanEvent } from './types';

export interface ValidationResult {
  valid: boolean;
  violation?: Omit<Violation, 'id' | 'resolved'>;
  nextExpectedCheckpointId?: string;
}

const EXPECTED_TRANSIT_BUFFER_MIN = 5;

export function validateCheckpointScan(
  session: PatrolSession,
  route: Route,
  checkpoints: Checkpoint[],
  scan: { checkpointId: string; timestamp: string; gps: { lat: number; lng: number } }
): ValidationResult {
  const checkpointIndex = route.checkpoints.indexOf(scan.checkpointId);
  if (checkpointIndex === -1) {
    return {
      valid: false,
      violation: {
        sessionId: session.id,
        type: 'route-deviation',
        reason: 'Checkpoint not on assigned route',
        timestamp: scan.timestamp,
        gps: scan.gps,
        critical: false,
      },
    };
  }

  const expectedNext = session.checkpointsCompleted;
  const expectedCheckpointId = route.checkpoints[expectedNext];

  if (scan.checkpointId !== expectedCheckpointId) {
    if (checkpointIndex < expectedNext) {
      return {
        valid: false,
        violation: {
          sessionId: session.id,
          type: 'out-of-order',
          reason: 'Checkpoint scanned out of sequence',
          timestamp: scan.timestamp,
          gps: scan.gps,
          critical: false,
        },
      };
    }
    return {
      valid: false,
      violation: {
        sessionId: session.id,
        type: 'skipped-checkpoint',
        reason: 'Checkpoint skipped or scanned out of order',
        timestamp: scan.timestamp,
        gps: scan.gps,
        critical: false,
      },
    };
  }

  // Check timing if we have previous scan time (simplified)
  const now = new Date(scan.timestamp);
  const startTime = new Date(session.startTime);
  const elapsedMin = (now.getTime() - startTime.getTime()) / 60000;
  const expectedMin = (expectedNext + 1) * (route.expectedDuration / route.checkpoints.length);

  if (elapsedMin > expectedMin + EXPECTED_TRANSIT_BUFFER_MIN) {
    return {
      valid: true,
      violation: {
        sessionId: session.id,
        type: 'late-start',
        reason: 'Patrol behind schedule',
        timestamp: scan.timestamp,
        gps: scan.gps,
        critical: false,
      },
    };
  }

  return { valid: true, nextExpectedCheckpointId: route.checkpoints[expectedNext + 1] };
}

export function detectRouteDeviation(
  session: PatrolSession,
  route: Route,
  checkpoints: Checkpoint[],
  currentGps: { lat: number; lng: number }
): Violation | null {
  // Simple corridor check: within ~200m of any checkpoint on route (demo)
  const isNearRoute = route.checkpoints.some((cpId) => {
    const cp = checkpoints.find((c) => c.id === cpId);
    if (!cp) return false;
    const dist = Math.hypot(cp.lat - currentGps.lat, cp.lng - currentGps.lng);
    return dist < 0.002; // ~200m rough
  });

  if (!isNearRoute) {
    return {
      id: `V-${Date.now()}`,
      sessionId: session.id,
      type: 'route-deviation',
      reason: 'Officer left expected route corridor',
      timestamp: new Date().toISOString(),
      gps: currentGps,
      critical: false,
      resolved: false,
    };
  }
  return null;
}

export function calculateComplianceRate(sessions: PatrolSession[]): number {
  if (sessions.length === 0) return 100;
  const completedOnTime = sessions.filter(
    (s) => s.status === 'completed' && s.violations === 0
  ).length;
  return Math.round((completedOnTime / sessions.length) * 100);
}

export function generateScanEvent(
  sessionId: string,
  checkpointId: string,
  gps: { lat: number; lng: number },
  deviceId: string
): ScanEvent {
  return {
    id: `SE-${Date.now()}`,
    sessionId,
    checkpointId,
    timestamp: new Date().toISOString(),
    gps,
    deviceId,
  };
}