import { Device, Officer, Checkpoint, Route, Schedule, PatrolSession, Violation, Incident, SOSEvent } from './types';

export const devices: Device[] = [
  { id: 'D-001', imei: '356938035643809', model: 'RuggedPad Pro X7', status: 'active', lastSync: '2026-05-12T18:45:00Z', registeredDate: '2025-11-02', battery: 87, signal: 4 },
  { id: 'D-002', imei: '354872109384721', model: 'SecureTab R5', status: 'active', lastSync: '2026-05-12T18:44:12Z', registeredDate: '2025-09-14', battery: 62, signal: 3 },
  { id: 'D-003', imei: '359201938475612', model: 'RuggedPad Pro X7', status: 'offline', lastSync: '2026-05-12T16:12:00Z', registeredDate: '2026-01-20', battery: 12, signal: 0 },
  { id: 'D-004', imei: '351928374650192', model: 'SecureTab R5', status: 'active', lastSync: '2026-05-12T18:46:30Z', registeredDate: '2025-12-05', battery: 94, signal: 5 },
];

export const officers: Officer[] = [
  { id: 'O-101', name: 'Rohan Silva', nic: '982345678V', status: 'on-duty', shift: '22:00–06:00', phone: '+94 77 123 4567' },
  { id: 'O-102', name: 'Amara Perera', nic: '951234567V', status: 'on-duty', shift: '22:00–06:00', phone: '+94 71 987 6543' },
  { id: 'O-103', name: 'Kasun Fernando', nic: '200145678V', status: 'off-duty', shift: '06:00–14:00', phone: '+94 76 555 1234' },
  { id: 'O-104', name: 'Nimali Wijesinghe', nic: '887654321V', status: 'on-break', shift: '14:00–22:00', phone: '+94 75 222 8899' },
];

export const checkpoints: Checkpoint[] = [
  { id: 'C-01', name: 'Main Gate - North', premises: 'VISTA Towers', lat: 6.9271, lng: 79.8612, qrToken: 'C01-VT-9f3k2m' },
  { id: 'C-02', name: 'Loading Bay', premises: 'VISTA Towers', lat: 6.9268, lng: 79.8625, qrToken: 'C02-VT-4p8x9q' },
  { id: 'C-03', name: 'Parking Level B2', premises: 'VISTA Towers', lat: 6.9274, lng: 79.8601, qrToken: 'C03-VT-7r2n5t' },
  { id: 'C-04', name: 'Rooftop Access', premises: 'VISTA Towers', lat: 6.9281, lng: 79.8619, qrToken: 'C04-VT-2m6v8w' },
  { id: 'C-05', name: 'South Perimeter', premises: 'Harbour Logistics', lat: 6.9123, lng: 79.8554, qrToken: 'C05-HL-1k9p4x' },
];

export const routes: Route[] = [
  { id: 'R-01', name: 'VISTA Night Perimeter', checkpoints: ['C-01', 'C-02', 'C-03', 'C-04'], expectedDuration: 42, recurrence: 'Every 2 hours • 22:00–06:00' },
  { id: 'R-02', name: 'Harbour South Loop', checkpoints: ['C-05', 'C-01'], expectedDuration: 18, recurrence: 'Hourly • 20:00–04:00' },
];

export const schedules: Schedule[] = [
  {
    id: 'S-001',
    siteId: 1,
    siteName: 'VISTA Towers',
    routeId: 'R-01',
    officerId: 'O-101',
    startTime: '2026-05-12T22:00:00.000Z',
    endTime: '2026-05-13T06:00:00.000Z',
    frequencyIntervalMinutes: 120,
    recurrence: 'Every 2 hours',
    status: 'active',
    version: 1,
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-01T08:00:00.000Z',
  },
  {
    id: 'S-002',
    siteId: 2,
    siteName: 'Harbour Logistics',
    routeId: 'R-02',
    officerId: 'O-102',
    startTime: '2026-05-12T22:15:00.000Z',
    endTime: '2026-05-13T05:00:00.000Z',
    frequencyIntervalMinutes: 60,
    recurrence: 'Every hour',
    status: 'active',
    version: 1,
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-01T08:00:00.000Z',
  },
];

export const activeSessions: PatrolSession[] = [
  { 
    id: 'PS-3921', deviceId: 'D-001', officerId: 'O-101', scheduleId: 'S-001',
    startTime: '2026-05-12T22:02:00Z', status: 'in-progress', 
    checkpointsCompleted: 2, totalCheckpoints: 4, 
    currentLocation: { lat: 6.9269, lng: 79.8618 }, violations: 0 
  },
  { 
    id: 'PS-3922', deviceId: 'D-002', officerId: 'O-102', scheduleId: 'S-002',
    startTime: '2026-05-12T22:18:00Z', status: 'in-progress', 
    checkpointsCompleted: 1, totalCheckpoints: 2, 
    currentLocation: { lat: 6.9131, lng: 79.8549 }, violations: 1 
  },
];

export const violations: Violation[] = [
  { id: 'V-084', sessionId: 'PS-3922', type: 'late-start', reason: 'Equipment failure', timestamp: '2026-05-12T22:24:00Z', gps: { lat: 6.9129, lng: 79.8551 }, critical: false, resolved: false },
];

export const incidents: Incident[] = [
  { id: 'INC-017', sessionId: 'PS-3921', severity: 'Medium', type: 'Suspicious Activity', description: 'Unidentified individual near loading bay. Photos captured.', timestamp: '2026-05-12T23:14:00Z', gps: { lat: 6.9267, lng: 79.8623 }, checkpointRef: 'C-02' },
];

export const sosEvents: SOSEvent[] = [
  { id: 'SOS-003', sessionId: 'PS-3922', officerId: 'O-102', gps: { lat: 6.9134, lng: 79.8547 }, triggeredAt: '2026-05-12T23:41:00Z', status: 'active' },
];

export const dashboardStats = {
  activePatrols: 2,
  complianceRate: 94,
  openSOS: 1,
  pendingViolations: 1,
};