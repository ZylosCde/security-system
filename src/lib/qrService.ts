import QRCode from 'qrcode';
import { Checkpoint, Officer } from './types';

// Simple rotating HMAC simulation using timestamp-based key
// In production: use Web Crypto subtle with server-shared secret
const SECRET_KEY = 'AEGIS-PATROL-SECRET-2026';
const OFFICER_PREFIX = 'OFFICER';

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

export function validateQRToken(token: string, checkpoints: Checkpoint[]): { valid: boolean; checkpoint?: Checkpoint } {
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

export async function getQRCodeDataURL(token: string): Promise<string> {
  return QRCode.toDataURL(token, { width: 200, margin: 2 });
}

export async function getOfficerQRDataURL(officerId: string): Promise<string> {
  return getQRCodeDataURL(generateOfficerToken(officerId));
}