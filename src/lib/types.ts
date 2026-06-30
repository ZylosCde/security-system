// AEGIS Patrol System - Core Type Definitions
// Complete data model matching the spec

export type DeviceStatus = 'active' | 'offline' | 'maintenance';
export type OfficerStatus = 'on-duty' | 'off-duty' | 'on-break';
export type PatrolStatus = 'scheduled' | 'in-progress' | 'completed' | 'violated' | 'cancelled';
export type ViolationType = 'skipped-checkpoint' | 'out-of-order' | 'late-start' | 'route-deviation' | 'missed-window';
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentType = 'Trespasser' | 'Theft' | 'Fire' | 'Injury' | 'Suspicious Activity' | 'Equipment Failure' | 'Other';

export interface Device {
  id: string;
  imei: string;
  model: string;
  status: DeviceStatus;
  lastSync: string;
  registeredDate: string;
  battery?: number;
  signal?: number;
  siteId?: number;
  siteName?: string;
}

export interface Officer {
  id: string;
  name: string;
  nic: string;
  status: OfficerStatus;
  shift: string;
  phone: string;
  avatar?: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  premises: string;
  lat: number;
  lng: number;
  qrToken: string;
  lastScanned?: string;
  code?: string;
  routeOrder?: number;
  siteId?: number;
}

export interface Route {
  id: string;
  name: string;
  checkpoints: string[]; // checkpoint IDs in order
  expectedDuration: number; // minutes
  recurrence: string;
}

export type ScheduleStatus = 'active' | 'paused' | 'archived';

export type ScheduleFrequencyPreset =
  | 'hourly'
  | 'every-2h'
  | 'every-4h'
  | 'every-6h'
  | 'daily';

export interface Schedule {
  id: string;
  siteId: number;
  siteName?: string;
  routeId: string;
  officerId?: string;
  startTime: string;
  endTime: string;
  frequencyIntervalMinutes: number;
  recurrence: string;
  status: ScheduleStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleHistory {
  id: string;
  scheduleId: string;
  version: number;
  siteId: number;
  siteName?: string;
  routeId: string;
  officerId?: string;
  startTime: string;
  endTime: string;
  frequencyIntervalMinutes: number;
  recurrence: string;
  status: Exclude<ScheduleStatus, 'archived'>;
  archivedAt: string;
  changeReason: 'renew' | 'edit' | 'deactivate';
}

export interface PatrolSession {
  id: string;
  deviceId: string;
  officerId: string;
  scheduleId: string;
  startTime: string;
  endTime?: string;
  status: PatrolStatus;
  checkpointsCompleted: number;
  totalCheckpoints: number;
  currentLocation?: { lat: number; lng: number };
  violations: number;
  officerName?: string;
  siteName?: string;
  siteId?: number;
  deviceName?: string;
  progressPercent?: number;
}

export interface ScanEvent {
  id: string;
  sessionId: string;
  checkpointId: string;
  timestamp: string;
  gps: { lat: number; lng: number };
  deviceId: string;
}

export interface Violation {
  id: string;
  sessionId: string;
  type: ViolationType;
  reason: string;
  timestamp: string;
  gps: { lat: number; lng: number };
  critical: boolean;
  resolved: boolean;
}

export interface Incident {
  id: string;
  sessionId: string;
  severity: Severity;
  type: IncidentType;
  description: string;
  timestamp: string;
  gps: { lat: number; lng: number };
  media?: string[];
  checkpointRef?: string;
}

export interface SOSEvent {
  id: string;
  sessionId: string;
  officerId: string;
  gps: { lat: number; lng: number };
  triggeredAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
  status: 'active' | 'resolved';
}

// Live dashboard stats
export interface DashboardStats {
  activePatrols: number;
  complianceRate: number;
  openSOS: number;
  pendingViolations: number;
}