import type {
  ApiAssignment,
  ApiCheckpoint,
  ApiClient,
  ApiDevice,
  ApiOfficer,
  ApiOfficerType,
  ApiPatrolListItem,
  ApiPatrolState,
  ApiRole,
  ApiRoster,
  ApiRosterAssignment,
  ApiSchedule,
  ApiScheduleTask,
  ApiSite,
  ApiSiteWithCounts,
  ApiUser,
} from "./api-types";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    "https://catalyst-security.zyloscode.com/api/v1"
  ).replace(/\/$/, "");
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type SuccessEnvelope<T> = { success: true } & T;

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    const hint = base
      ? `Cannot reach API at ${base}. Is the backend running?`
      : "Cannot reach API. Check API_BACKEND_URL in .env.local and restart `npm run dev`.";
    throw new ApiClientError(hint, 0);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiClientError("Invalid JSON response", res.status);
  }

  const envelope = body as { success?: boolean; message?: string };
  if (!res.ok || envelope.success === false) {
    throw new ApiClientError(
      envelope.message ?? `Request failed (${res.status})`,
      res.status
    );
  }

  return body as T;
}

export async function login(email: string, password: string) {
  return request<SuccessEnvelope<{ user: ApiUser }>>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function officerLogin(nic: string) {
  return request<
    SuccessEnvelope<{ officer: ApiOfficer; assignment: ApiAssignment | null }>
  >("/officer-login", {
    method: "POST",
    body: JSON.stringify({ NIC: nic }),
  });
}

export async function listMasterClients() {
  return request<SuccessEnvelope<{ clients: ApiClient[] }>>("/master/client");
}

export async function createMasterClient(data: {
  name: string;
  description?: string;
  siteId: number;
}) {
  return request<SuccessEnvelope<{ client: ApiClient }>>("/master/client", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listMasterSites() {
  return request<SuccessEnvelope<{ sites: ApiSite[] }>>("/master/site");
}

export async function createMasterSite(data: {
  name: string;
  lat: number;
  lng: number;
}) {
  return request<SuccessEnvelope<{ site: ApiSite }>>("/master/site", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listMasterUsers() {
  return request<SuccessEnvelope<{ users: ApiUser[] }>>("/master/user");
}

export async function createMasterUser(data: {
  email: string;
  username: string;
  password: string;
  roleId: number;
}) {
  return request<SuccessEnvelope<{ user: ApiUser }>>("/master/user", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteMasterUser(id: number) {
  return request<SuccessEnvelope<{ message: string }>>(
    `/master/user?id=${id}`,
    { method: "DELETE" }
  );
}

export async function listSites(siteId?: number) {
  const q = siteId != null ? `?siteId=${siteId}` : "";
  return request<
    SuccessEnvelope<{ sites: ApiSiteWithCounts[] } | { site: ApiSiteWithCounts }>
  >(`/site${q}`);
}

export async function listOfficers() {
  return request<SuccessEnvelope<{ officers: ApiOfficer[] }>>("/officer");
}

export async function createOfficer(data: {
  officerName: string;
  NIC: string;
  officerTypeId: number;
}) {
  return request<SuccessEnvelope<{ officer: ApiOfficer }>>("/officer", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOfficerAssignment(officerId: number) {
  return request<SuccessEnvelope<{ assignment: ApiAssignment | null }>>(
    `/officer/assignment?officerId=${officerId}`
  );
}

export async function listDevices() {
  return request<SuccessEnvelope<{ devices: ApiDevice[] }>>("/device");
}

export async function createDevice(data: {
  deviceName: string;
  deviceType: string;
  imeiNumber: string;
  siteId: number;
}) {
  return request<SuccessEnvelope<{ device: ApiDevice }>>("/device", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listDeviceAssignments() {
  return request<SuccessEnvelope<{ assignments: ApiAssignment[] }>>(
    "/device/assign"
  );
}

export async function assignDevice(deviceId: number, officerId: number) {
  return request<SuccessEnvelope<{ assignment: ApiAssignment }>>(
    "/device/assign",
    {
      method: "POST",
      body: JSON.stringify({ deviceId, officerId }),
    }
  );
}

export async function deleteDeviceAssignment(id: number) {
  return request<SuccessEnvelope<{ message: string }>>(
    `/device/assign?id=${id}`,
    { method: "DELETE" }
  );
}

export async function listCheckpoints(siteId?: number) {
  const q = siteId != null ? `?siteId=${siteId}` : "";
  return request<SuccessEnvelope<{ checkpoints: ApiCheckpoint[] }>>(
    `/checkpoint${q}`
  );
}

export async function createCheckpoint(data: {
  name: string;
  code: string;
  description?: string;
  siteId: number;
  routeOrder: number;
}) {
  return request<SuccessEnvelope<{ checkpoint: ApiCheckpoint }>>(
    "/checkpoint",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function listPatrols(siteId?: number | "all") {
  const siteQ =
    siteId != null && siteId !== "all" ? `&siteId=${siteId}` : "";
  return request<SuccessEnvelope<{ patrols: ApiPatrolListItem[] }>>(
    `/patrol?list=1${siteQ}`
  );
}

export async function getPatrolState(siteId: number, officerId: number) {
  return request<ApiPatrolState & { success: true }>(
    `/patrol?siteId=${siteId}&officerId=${officerId}`
  );
}

export async function startPatrol(data: {
  officerId: number;
  siteId: number;
  deviceId?: number;
}) {
  return request<ApiPatrolState & { success: true; message?: string }>(
    "/patrol",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function recordPatrolVisit(data: {
  patrolId: number;
  checkpointId: number;
  officerId?: number;
}) {
  return request<ApiPatrolState & { success: true; message?: string }>(
    "/patrol?action=visit",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function listRoles() {
  return request<SuccessEnvelope<{ roles: ApiRole[] }>>("/role");
}

export async function getRole(id: number) {
  return request<SuccessEnvelope<{ role: ApiRole }>>(`/role/${id}`);
}

export async function createRole(data: { name: string; description?: string }) {
  return request<SuccessEnvelope<{ role: ApiRole }>>("/role", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRole(
  id: number,
  data: { name?: string; description?: string }
) {
  return request<SuccessEnvelope<{ role: ApiRole }>>(`/role/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRole(id: number) {
  return request<SuccessEnvelope<{ message: string }>>(`/role/${id}`, {
    method: "DELETE",
  });
}

export async function listOfficerTypes() {
  return request<SuccessEnvelope<{ officerTypes: ApiOfficerType[] }>>(
    "/officer-type"
  );
}

export async function getOfficerType(id: number) {
  return request<SuccessEnvelope<{ officerType: ApiOfficerType }>>(
    `/officer-type/${id}`
  );
}

export async function createOfficerType(data: {
  name: string;
  description?: string;
}) {
  return request<SuccessEnvelope<{ officerType: ApiOfficerType }>>(
    "/officer-type",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function updateOfficerType(
  id: number,
  data: { name?: string; description?: string }
) {
  return request<SuccessEnvelope<{ officerType: ApiOfficerType }>>(
    `/officer-type/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteOfficerType(id: number) {
  return request<SuccessEnvelope<{ message: string }>>(
    `/officer-type/${id}`,
    { method: "DELETE" }
  );
}

export async function listRosters(siteId?: number) {
  const q = siteId != null ? `?siteId=${siteId}` : "";
  return request<SuccessEnvelope<{ rosters: ApiRoster[] }>>(`/roster${q}`);
}

export async function getRoster(id: number) {
  return request<SuccessEnvelope<{ roster: ApiRoster }>>(`/roster/${id}`);
}

export async function createRoster(data: {
  siteId: number;
  name: string;
  startDate: string;
  endDate: string;
}) {
  return request<SuccessEnvelope<{ roster: ApiRoster }>>("/roster", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteRoster(id: number) {
  return request<SuccessEnvelope<{ message: string }>>(`/roster/${id}`, {
    method: "DELETE",
  });
}

export async function assignRosterOfficer(
  rosterId: number,
  data: { officerId: number; shiftStart: string; shiftEnd: string }
) {
  return request<SuccessEnvelope<{ assignment: ApiRosterAssignment }>>(
    `/roster/${rosterId}/assign`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function removeRosterAssignment(assignmentId: number) {
  return request<SuccessEnvelope<{ message: string }>>(
    `/roster/assign/${assignmentId}`,
    { method: "DELETE" }
  );
}

export async function listSchedules(officerId?: number) {
  const q = officerId != null ? `?officerId=${officerId}` : "";
  return request<SuccessEnvelope<{ schedules: ApiSchedule[] }>>(
    `/schedule${q}`
  );
}

export async function getSchedule(id: number) {
  return request<SuccessEnvelope<{ schedule: ApiSchedule }>>(
    `/schedule/${id}`
  );
}

export async function createSchedule(data: {
  rosterAssignmentId: number;
  officerId: number;
  date: string;
}) {
  return request<SuccessEnvelope<{ schedule: ApiSchedule }>>("/schedule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteSchedule(id: number) {
  return request<SuccessEnvelope<{ message: string }>>(`/schedule/${id}`, {
    method: "DELETE",
  });
}

export async function addScheduleTask(
  scheduleId: number,
  data: { checkpointId: number; scheduledTime: string }
) {
  return request<SuccessEnvelope<{ task: ApiScheduleTask }>>(
    `/schedule/${scheduleId}/task`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function updateScheduleTaskStatus(taskId: number, status: string) {
  return request<SuccessEnvelope<{ message: string }>>(
    `/schedule/task/${taskId}`,
    {
      method: "PUT",
      body: JSON.stringify({ status }),
    }
  );
}

export async function removeScheduleTask(taskId: number) {
  return request<SuccessEnvelope<{ message: string }>>(
    `/schedule/task/${taskId}`,
    { method: "DELETE" }
  );
}

export function getApiBaseUrl() {
  return getBaseUrl() || "(proxied via /api)";
}
