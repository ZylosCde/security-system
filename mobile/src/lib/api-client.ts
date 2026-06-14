const BASE_URL =
  (typeof process !== "undefined" &&
    process.env?.EXPO_PUBLIC_API_URL?.replace(/\/$/, "")) ||
  "http://localhost:3001";

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

export type ApiOfficer = {
  id: number;
  officerName: string;
  NIC: string;
  Position: "JPO" | "SPO";
};

export type ApiSite = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

export type ApiDevice = {
  id: number;
  deviceName: string;
  deviceType: string;
  imeiNumber: string;
  siteId: number;
  site?: ApiSite;
};

export type ApiAssignment = {
  id: number;
  deviceId: number;
  officerId: number;
  siteId: number;
  device?: ApiDevice;
  site?: ApiSite;
};

export type ApiCheckpoint = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  siteId: number;
  routeOrder: number;
  site?: ApiSite;
};

export type ApiPatrolCheckpoint = {
  id: number;
  name: string;
  code: string;
  routeIndex: number;
  status: "pending" | "current" | "completed";
};

export type ApiPatrolState = {
  success: true;
  site: ApiSite;
  patrol: {
    id: number;
    status: "IN_PROGRESS" | "COMPLETED";
    startedAt: string;
    completedAt: string | null;
  };
  checkpoints: ApiPatrolCheckpoint[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  nextCheckpointId: number | null;
  visitedCheckpointIds: number[];
  message?: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
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
    throw new ApiClientError(
      `Cannot reach API at ${BASE_URL}. Check Wi‑Fi and EXPO_PUBLIC_API_URL.`,
      0
    );
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

export async function officerLogin(nic: string) {
  return request<
    SuccessEnvelope<{ officer: ApiOfficer; assignment: ApiAssignment | null }>
  >("/api/officer-login", {
    method: "POST",
    body: JSON.stringify({ NIC: nic }),
  });
}

export async function listOfficers() {
  return request<SuccessEnvelope<{ officers: ApiOfficer[] }>>("/api/officer");
}

export async function listSites() {
  return request<SuccessEnvelope<{ sites: ApiSite[] }>>("/api/site");
}

export async function listDevices() {
  return request<SuccessEnvelope<{ devices: ApiDevice[] }>>("/api/device");
}

export async function assignDevice(deviceId: number, officerId: number) {
  return request<SuccessEnvelope<{ assignment: ApiAssignment }>>("/api/device/assign", {
    method: "POST",
    body: JSON.stringify({ deviceId, officerId }),
  });
}

export async function getOfficerAssignment(officerId: number) {
  return request<SuccessEnvelope<{ assignment: ApiAssignment | null }>>(
    `/api/officer/assignment?officerId=${officerId}`
  );
}

export async function listCheckpoints(siteId: number) {
  return request<SuccessEnvelope<{ checkpoints: ApiCheckpoint[] }>>(
    `/api/checkpoint?siteId=${siteId}`
  );
}

export async function getPatrolState(siteId: number, officerId: number) {
  return request<ApiPatrolState>(
    `/api/patrol?siteId=${siteId}&officerId=${officerId}`
  );
}

export async function startPatrol(data: {
  officerId: number;
  siteId: number;
  deviceId?: number;
}) {
  return request<ApiPatrolState>("/api/patrol", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function recordPatrolVisit(data: {
  patrolId: number;
  checkpointId: number;
  officerId?: number;
}) {
  return request<ApiPatrolState>("/api/patrol?action=visit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export { BASE_URL };
