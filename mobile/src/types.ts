export type PatrolStatus = 'scheduled' | 'in-progress' | 'completed' | 'violated' | 'cancelled';

export interface Checkpoint {
  id: string;
  name: string;
  premises: string;
  lat: number;
  lng: number;
  qrToken: string;
  code?: string;
  routeOrder?: number;
}

export interface Route {
  id: string;
  name: string;
  checkpoints: string[];
  expectedDuration: number;
}

export interface Officer {
  id: string;
  name: string;
  nic: string;
  position?: 'JPO' | 'SPO';
  status: 'on-duty' | 'off-duty' | 'on-break';
}

export interface PatrolSession {
  id: string;
  deviceId: string;
  officerId: string;
  startTime: string;
  status: PatrolStatus;
  checkpointsCompleted: number;
  totalCheckpoints: number;
}

export interface Violation {
  id: string;
  sessionId: string;
  type: string;
  reason: string;
  timestamp: string;
  gps: { lat: number; lng: number };
  critical: boolean;
}

export interface ScanEvent {
  id: string;
  sessionId: string;
  checkpointId: string;
  timestamp: string;
  gps: { lat: number; lng: number };
  deviceId: string;
  comment?: string;
}
