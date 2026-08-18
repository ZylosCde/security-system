export type DeviceType = "DESKTOP" | "LAPTOP" | "MOBILE" | "TABLET";
export type PatrolStatus = "IN_PROGRESS" | "COMPLETED" | "PAUSED";
export type ScheduleTaskStatus = "PENDING" | "COMPLETED" | "MISSED";

export interface ApiError {
  success: false;
  message: string;
}

export interface ApiRole {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiOfficerType {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiUser {
  id: number;
  email: string;
  username: string;
  roleId: number;
  role: ApiRole;
}

export interface ApiSite {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface ApiClient {
  id: number;
  name: string;
  description?: string | null;
  siteId: number;
  site?: ApiSite;
}

export interface ApiOfficer {
  id: number;
  officerName: string;
  NIC: string;
  officerType: ApiOfficerType;
}

export interface ApiDevice {
  id: number;
  deviceName: string;
  deviceType: DeviceType;
  imeiNumber: string;
  siteId: number;
  site?: ApiSite;
}

export interface ApiAssignment {
  id: number;
  deviceId: number;
  officerId: number;
  siteId: number;
  device?: ApiDevice;
  site?: ApiSite;
}

export interface ApiCheckpoint {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  siteId: number;
  routeOrder: number;
  site?: ApiSite;
}

export interface ApiPatrolCheckpoint {
  id: number;
  name: string;
  code: string;
  routeIndex: number;
  status: "pending" | "current" | "completed";
}

export interface ApiPatrolState {
  site: ApiSite;
  patrol: {
    id: number;
    status: PatrolStatus;
    startedAt: string;
    completedAt: string | null;
  };
  checkpoints: ApiPatrolCheckpoint[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  nextCheckpointId: number | null;
  visitedCheckpointIds: number[];
}

export interface ApiPatrolListItem {
  id: number;
  status: PatrolStatus;
  startedAt: string;
  completedAt: string | null;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  officer?: ApiOfficer;
  site?: ApiSite;
  device?: ApiDevice;
  visits?: unknown[];
}

export interface ApiSiteWithCounts extends ApiSite {
  checkpointCount?: number;
  deviceCount?: number;
}

export interface ApiRosterAssignment {
  id: number;
  rosterId: number;
  officerId: number;
  shiftStart: string;
  shiftEnd: string;
  roster?: ApiRoster;
  officer?: ApiOfficer;
}

export interface ApiRoster {
  id: number;
  siteId: number;
  name: string;
  startDate: string;
  endDate: string;
  site?: ApiSite;
  assignments?: ApiRosterAssignment[];
}

export interface ApiScheduleTask {
  id: number;
  scheduleId: number;
  checkpointId: number;
  scheduledTime: string;
  status: ScheduleTaskStatus | string;
  checkpoint?: ApiCheckpoint;
}

export interface ApiSchedule {
  id: number;
  rosterAssignmentId: number;
  officerId: number;
  date: string;
  rosterAssignment?: ApiRosterAssignment;
  officer?: ApiOfficer;
  tasks?: ApiScheduleTask[];
}
