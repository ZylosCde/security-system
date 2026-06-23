import type {
  ApiAssignment,
  ApiCheckpoint,
  ApiClient,
  ApiDevice,
  ApiOfficer,
  ApiPatrolListItem,
  ApiPatrolState,
  ApiSite,
  ApiSiteWithCounts,
  ApiUser,
} from "./api-types";

/** In the browser, use same-origin `/api` (proxied by Next.js). On server, call backend directly. */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.API_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "https://catalyst-security.zyloscode.com"
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

// Auth
export async function login(email: string, password: string) {
  return request<SuccessEnvelope<{ user: ApiUser }>>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function officerLogin(nic: string) {
  return request<
    SuccessEnvelope<{ officer: ApiOfficer; assignment: ApiAssignment | null }>
  >("/api/officer-login", {
    method: "POST",
    body: JSON.stringify({ NIC: nic }),
  });
}

// Master
export async function listMasterClients() {
  return request<SuccessEnvelope<{ clients: ApiClient[] }>>("/api/master/client");
}

export async function createMasterClient(data: {
  name: string;
  description?: string;
  siteId: number;
}) {
  return request<SuccessEnvelope<{ client: ApiClient }>>("/api/master/client", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listMasterSites() {
  return request<SuccessEnvelope<{ sites: ApiSite[] }>>("/api/master/site");
}

export async function createMasterSite(data: {
  name: string;
  lat: number;
  lng: number;
}) {
  return request<SuccessEnvelope<{ site: ApiSite }>>("/api/master/site", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listMasterUsers() {
  return request<SuccessEnvelope<{ users: ApiUser[] }>>("/api/master/user");
}

export async function createMasterUser(data: {
  email: string;
  username: string;
  password: string;
  role?: string;
}) {
  return request<SuccessEnvelope<{ user: ApiUser }>>("/api/master/user", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteMasterUser(id: number) {
  return request<SuccessEnvelope<{ message: string }>>(
    `/api/master/user?id=${id}`,
    { method: "DELETE" }
  );
}

// Sites
export async function listSites(siteId?: number) {
  const q = siteId != null ? `?siteId=${siteId}` : "";
  return request<
    SuccessEnvelope<{ sites: ApiSiteWithCounts[] } | { site: ApiSiteWithCounts }>
  >(`/api/site${q}`);
}

// Officers
export async function listOfficers() {
  return request<SuccessEnvelope<{ officers: ApiOfficer[] }>>("/api/officer");
}

export async function createOfficer(data: {
  officerName: string;
  NIC: string;
  Position: "JPO" | "SPO";
}) {
  return request<SuccessEnvelope<{ officer: ApiOfficer }>>("/api/officer", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOfficerAssignment(officerId: number) {
  return request<SuccessEnvelope<{ assignment: ApiAssignment | null }>>(
    `/api/officer/assignment?officerId=${officerId}`
  );
}

// Devices
export async function listDevices() {
  return request<SuccessEnvelope<{ devices: ApiDevice[] }>>("/api/device");
}

export async function createDevice(data: {
  deviceName: string;
  deviceType: string;
  imeiNumber: string;
  siteId: number;
}) {
  return request<SuccessEnvelope<{ device: ApiDevice }>>("/api/device", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listDeviceAssignments() {
  return request<SuccessEnvelope<{ assignments: ApiAssignment[] }>>(
    "/api/device/assign"
  );
}

export async function assignDevice(deviceId: number, officerId: number) {
  return request<SuccessEnvelope<{ assignment: ApiAssignment }>>(
    "/api/device/assign",
    {
      method: "POST",
      body: JSON.stringify({ deviceId, officerId }),
    }
  );
}

export async function deleteDeviceAssignment(id: number) {
  return request<SuccessEnvelope<{ message: string }>>(
    `/api/device/assign?id=${id}`,
    { method: "DELETE" }
  );
}

// Checkpoints
export async function listCheckpoints(siteId?: number) {
  const q = siteId != null ? `?siteId=${siteId}` : "";
  return request<SuccessEnvelope<{ checkpoints: ApiCheckpoint[] }>>(
    `/api/checkpoint${q}`
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
    "/api/checkpoint",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// Patrols
export async function listPatrols(siteId?: number | "all") {
  const siteQ =
    siteId != null && siteId !== "all" ? `&siteId=${siteId}` : "";
  return request<SuccessEnvelope<{ patrols: ApiPatrolListItem[] }>>(
    `/api/patrol?list=1${siteQ}`
  );
}

export async function getPatrolState(siteId: number, officerId: number) {
  return request<ApiPatrolState & { success: true }>(
    `/api/patrol?siteId=${siteId}&officerId=${officerId}`
  );
}

export async function startPatrol(data: {
  officerId: number;
  siteId: number;
  deviceId?: number;
}) {
  return request<ApiPatrolState & { success: true; message?: string }>(
    "/api/patrol",
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
    "/api/patrol?action=visit",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export function getApiBaseUrl() {
  return getBaseUrl() || "(proxied via /api)";
}
