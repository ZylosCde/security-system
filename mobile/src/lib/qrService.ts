import type { Checkpoint, Officer } from '../types';

const SECRET_KEY = 'AEGIS-PATROL-SECRET-2026';
const OFFICER_PREFIX = 'OFFICER';
const DEVICE_PREFIX = 'DEVICE';
const NIC_PREFIX = 'NIC';

/** Old NIC: 9 digits + V/X; new format: 12 digits */
const NIC_PATTERN = /^\d{9}[VXvx]$|^\d{12}$/;

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

export function generateRotatingToken(checkpointId: string, premises: string, date = new Date()): string {
  const dayKey = date.toISOString().split('T')[0];
  const payload = `${checkpointId}:${premises}:${dayKey}:${SECRET_KEY}`;
  const signature = simpleHash(payload);
  return `${checkpointId}:${premises}:${signature}`;
}

export function validateQRToken(
  token: string,
  checkpoints: Checkpoint[]
): { valid: boolean; checkpoint?: Checkpoint } {
  const parts = token.split(':');
  if (parts.length !== 3) return { valid: false };

  const [cpId, premises] = parts;
  const checkpoint = checkpoints.find((c) => c.id === cpId && c.premises === premises);
  if (!checkpoint) return { valid: false };

  const expectedToday = generateRotatingToken(cpId, premises);
  const expectedYesterday = generateRotatingToken(cpId, premises, new Date(Date.now() - 86400000));

  const valid = token === expectedToday || token === expectedYesterday;
  return { valid, checkpoint: valid ? checkpoint : undefined };
}

export type CheckpointQrPayload = {
  type: 'checkpoint';
  id: number;
  code: string;
  name: string;
  description?: string | null;
  siteId: number;
};

export function buildCheckpointQrValue(cp: {
  id: number | string;
  code: string;
  name: string;
  description?: string | null;
  siteId: number;
}): string {
  return JSON.stringify({
    type: 'checkpoint',
    id: Number(cp.id),
    code: cp.code,
    name: cp.name,
    description: cp.description ?? null,
    siteId: cp.siteId,
  });
}

export function parseCheckpointQrValue(raw: string): CheckpointQrPayload | null {
  try {
    const parsed = JSON.parse(raw.trim()) as Partial<CheckpointQrPayload>;
    if (parsed?.type !== 'checkpoint' || !parsed.id || !parsed.siteId) return null;
    return parsed as CheckpointQrPayload;
  } catch {
    return null;
  }
}

export function parseQRPayload(token: string): { checkpointId: string; premises: string } | null {
  const parts = token.trim().split(':');
  if (parts.length !== 3) return null;
  return { checkpointId: parts[0], premises: parts[1] };
}

export function generateOfficerToken(officerId: string): string {
  const payload = `${officerId}:${SECRET_KEY}`;
  const signature = simpleHash(payload);
  return `${OFFICER_PREFIX}:${officerId}:${signature}`;
}

export function parseOfficerToken(token: string): { officerId: string } | null {
  const parts = token.trim().split(':');
  if (parts.length !== 3 || parts[0] !== OFFICER_PREFIX) return null;
  return { officerId: parts[1] };
}

export function validateOfficerToken(
  token: string,
  officers: Officer[]
): { valid: boolean; officer?: Officer } {
  const parsed = parseOfficerToken(token);
  if (!parsed) return { valid: false };

  const expected = generateOfficerToken(parsed.officerId);
  if (token.trim() !== expected) return { valid: false };

  const officer = officers.find((o) => o.id === parsed.officerId);
  if (!officer || officer.status === 'off-duty') return { valid: false };

  return { valid: true, officer };
}

export function isOfficerScanPayload(token: string): boolean {
  return parseOfficerToken(token.trim()) !== null;
}

export function generateDeviceToken(deviceId: number | string, imeiNumber: string): string {
  return `${DEVICE_PREFIX}:${deviceId}:${imeiNumber.trim()}`;
}

export function generateNicLoginToken(nic: string): string {
  return `${NIC_PREFIX}:${nic.trim().toUpperCase()}`;
}

export function parseDeviceQr(
  payload: string
): { deviceId: number; imeiNumber: string } | null {
  const trimmed = payload.trim();
  const parts = trimmed.split(':');
  if (parts.length < 3 || parts[0] !== DEVICE_PREFIX) return null;
  const deviceId = Number(parts[1]);
  const imeiNumber = parts.slice(2).join(':').trim();
  if (!Number.isFinite(deviceId) || deviceId <= 0 || !imeiNumber) return null;
  return { deviceId, imeiNumber };
}

export function parseNicFromPayload(payload: string): string | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;
  if (trimmed.toUpperCase().startsWith(`${NIC_PREFIX}:`)) {
    const nic = trimmed.slice(NIC_PREFIX.length + 1).trim().toUpperCase();
    return nic || null;
  }
  if (NIC_PATTERN.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  // Allow any alphanumeric string between 3 and 20 chars for manual entry / other NIC formats
  const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(trimmed);
  if (isAlphanumeric && trimmed.length >= 3 && trimmed.length <= 20) {
    return trimmed.toUpperCase();
  }
  return null;
}

export type OfficerLoginQrParse =
  | { kind: 'nic'; nic: string }
  | { kind: 'legacy_officer'; officerId: string }
  | null;

export function parseOfficerLoginQr(payload: string): OfficerLoginQrParse {
  const trimmed = payload.trim();
  const nic = parseNicFromPayload(trimmed);
  if (nic) return { kind: 'nic', nic };

  const legacy = parseOfficerToken(trimmed);
  if (legacy && trimmed === generateOfficerToken(legacy.officerId)) {
    return { kind: 'legacy_officer', officerId: legacy.officerId };
  }
  return null;
}

export function isDeviceScanPayload(token: string): boolean {
  return parseDeviceQr(token.trim()) !== null;
}

export function describeCheckpointScanFailure(
  token: string,
  checkpoints: Checkpoint[]
): { title: string; message: string; canOpenSampleQr: boolean } {
  const trimmed = token.trim();

  if (isDeviceScanPayload(trimmed)) {
    return {
      title: 'Device QR detected',
      message:
        'This code registers the handset on the Auth screen. Sign out and scan it under “Scan device QR”.',
      canOpenSampleQr: false,
    };
  }

  if (parseNicFromPayload(trimmed)) {
    return {
      title: 'Officer sign-in QR',
      message:
        'This code is for officer login on the Auth screen, not a patrol checkpoint.',
      canOpenSampleQr: false,
    };
  }

  if (isOfficerScanPayload(trimmed)) {
    return {
      title: 'Officer QR detected',
      message:
        'This code is for officer login, not a patrol checkpoint. Open test checkpoint QR codes and scan one of those instead.',
      canOpenSampleQr: true,
    };
  }

  const parsed = parseQRPayload(trimmed);
  if (parsed) {
    const known = checkpoints.find(
      (c) => c.id === parsed.checkpointId && c.premises === parsed.premises
    );
    if (known) {
      return {
        title: 'Checkpoint QR expired',
        message: `${known.name} was recognized but the code is no longer valid. Refresh test checkpoint QR codes and try again.`,
        canOpenSampleQr: true,
      };
    }
  }

  return {
    title: 'Invalid QR',
    message: 'Use a checkpoint QR from your patrol route. Officer login codes cannot be used here.',
    canOpenSampleQr: true,
  };
}
