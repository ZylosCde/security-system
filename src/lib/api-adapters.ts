import type {
  ApiCheckpoint,
  ApiDevice,
  ApiOfficer,
  ApiPatrolListItem,
  ApiPatrolState,
  ApiSite,
} from "./api-types";
import type { Checkpoint, Device, Officer, PatrolSession } from "./types";

export function apiOfficerToOfficer(o: ApiOfficer): Officer {
  return {
    id: String(o.id),
    name: o.officerName,
    nic: o.NIC,
    status: "on-duty",
    shift: o.Position,
    phone: "",
  };
}

export function apiDeviceToDevice(d: ApiDevice): Device {
  return {
    id: String(d.id),
    imei: d.imeiNumber,
    model: d.deviceName,
    status: "active",
    lastSync: new Date().toISOString(),
    registeredDate: new Date().toISOString().slice(0, 10),
    siteId: d.siteId,
  };
}

export function apiCheckpointToCheckpoint(
  cp: ApiCheckpoint,
  siteName?: string,
  siteLat?: number,
  siteLng?: number
): Checkpoint {
  return {
    id: String(cp.id),
    name: cp.name,
    premises: siteName ?? cp.site?.name ?? `Site ${cp.siteId}`,
    lat: siteLat ?? cp.site?.lat ?? 0,
    lng: siteLng ?? cp.site?.lng ?? 0,
    qrToken: cp.code,
    code: cp.code,
    routeOrder: cp.routeOrder,
    siteId: cp.siteId,
  };
}

export function apiPatrolListToSession(p: ApiPatrolListItem): PatrolSession {
  const status =
    p.status === "COMPLETED"
      ? "completed"
      : p.status === "IN_PROGRESS"
        ? "in-progress"
        : "scheduled";
  return {
    id: String(p.id),
    deviceId: p.device ? String(p.device.id) : "",
    officerId: p.officer ? String(p.officer.id) : "",
    scheduleId: "",
    startTime: p.startedAt,
    endTime: p.completedAt ?? undefined,
    status,
    checkpointsCompleted: p.completedCount,
    totalCheckpoints: p.totalCount,
    currentLocation: p.site
      ? { lat: p.site.lat, lng: p.site.lng }
      : undefined,
    violations: 0,
    officerName: p.officer?.officerName,
    siteName: p.site?.name,
    siteId: p.site?.id,
    deviceName: p.device?.deviceName,
    progressPercent: p.progressPercent,
  };
}

export function siteLabel(site: ApiSite | undefined): string {
  return site?.name ?? "Unknown site";
}

export type PatrolSessionExtended = PatrolSession & {
  officerName?: string;
  siteName?: string;
  deviceName?: string;
  progressPercent?: number;
};

export function patrolStateToSession(
  state: ApiPatrolState,
  officerId: string,
  deviceId?: string
): PatrolSession {
  const status =
    state.patrol.status === "COMPLETED" ? "completed" : "in-progress";
  return {
    id: String(state.patrol.id),
    deviceId: deviceId ?? "",
    officerId,
    scheduleId: "",
    startTime: state.patrol.startedAt,
    endTime: state.patrol.completedAt ?? undefined,
    status,
    checkpointsCompleted: state.completedCount,
    totalCheckpoints: state.totalCount,
    currentLocation: { lat: state.site.lat, lng: state.site.lng },
    violations: 0,
    siteName: state.site.name,
    progressPercent: state.progressPercent,
  };
}
