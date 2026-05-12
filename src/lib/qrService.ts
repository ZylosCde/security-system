import { Checkpoint } from './types';

// Simple rotating HMAC simulation using timestamp-based key
// In production: use Web Crypto subtle with server-shared secret
const SECRET_KEY = 'AEGIS-PATROL-SECRET-2026';

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

export function getQRCodeDataURL(token: string): string {
  // Placeholder: in real app use qrcode lib or canvas
  // Returns a data URL for a simple SVG QR-like representation
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><text x="100" y="100" text-anchor="middle" font-size="12" fill="#000">${token}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}