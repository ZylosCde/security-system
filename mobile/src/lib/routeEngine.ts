import type { Checkpoint, Route, PatrolSession, Violation, ScanEvent } from '../types';

export interface ValidationResult {
  valid: boolean;
  violation?: Omit<Violation, 'id'>;
  nextExpectedCheckpointId?: string;
}

const EXPECTED_TRANSIT_BUFFER_MIN = 5;

export function validateCheckpointScan(
  session: PatrolSession,
  route: Route,
  _checkpoints: Checkpoint[],
  scan: { checkpointId: string; timestamp: string; gps: { lat: number; lng: number } },
  _scannedIds: string[] = []
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
  const isNextInSequence = scan.checkpointId === expectedCheckpointId;

  let result: ValidationResult = { valid: true };

  if (!isNextInSequence) {
    const skippedAhead = checkpointIndex > expectedNext;
    result = {
      valid: true,
      violation: {
        sessionId: session.id,
        type: skippedAhead ? 'skipped-checkpoint' : 'out-of-order',
        reason: skippedAhead
          ? 'Checkpoint scanned out of route sequence'
          : 'Checkpoint scanned out of sequence',
        timestamp: scan.timestamp,
        gps: scan.gps,
        critical: false,
      },
    };
  }

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
      nextExpectedCheckpointId: route.checkpoints[expectedNext + 1],
    };
  }

  return {
    ...result,
    nextExpectedCheckpointId: route.checkpoints[expectedNext + 1],
  };
}

export function generateScanEvent(
  sessionId: string,
  checkpointId: string,
  gps: { lat: number; lng: number },
  deviceId: string,
  comment?: string
): ScanEvent {
  return {
    id: `SE-${Date.now()}`,
    sessionId,
    checkpointId,
    timestamp: new Date().toISOString(),
    gps,
    deviceId,
    ...(comment ? { comment } : {}),
  };
}
