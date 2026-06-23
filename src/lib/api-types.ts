// API response shapes from Catalyst Security Demo backend

export type UserRole = "MASTER" | "ADMIN" | "USER";
export type OfficerPosition = "JPO" | "SPO";
export type DeviceType = "DESKTOP" | "LAPTOP" | "MOBILE" | "TABLET";
export type PatrolStatus = "IN_PROGRESS" | "COMPLETED";

export interface ApiError {
  success: false;
  message: string;
}

export interface ApiUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
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
  Position: OfficerPosition;
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
