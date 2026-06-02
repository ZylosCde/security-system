/**
 * Generates PNG QR codes for all demo checkpoints into mobile/assets/sample-qrs/.
 * Tokens rotate daily — re-run this script or use the in-app Sample QR screen for current codes.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SECRET_KEY = 'AEGIS-PATROL-SECRET-2026';

const CHECKPOINTS = [
  { id: 'C-01', name: 'Main Gate - North', premises: 'VISTA Towers' },
  { id: 'C-02', name: 'Loading Bay', premises: 'VISTA Towers' },
  { id: 'C-03', name: 'Parking Level B2', premises: 'VISTA Towers' },
  { id: 'C-04', name: 'Rooftop Access', premises: 'VISTA Towers' },
];

function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

function generateRotatingToken(checkpointId, premises, date = new Date()) {
  const dayKey = date.toISOString().split('T')[0];
  const payload = `${checkpointId}:${premises}:${dayKey}:${SECRET_KEY}`;
  const signature = simpleHash(payload);
  return `${checkpointId}:${premises}:${signature}`;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'assets', 'sample-qrs');

async function main() {
  let QRCode;
  try {
    QRCode = (await import('qrcode')).default;
  } catch {
    console.error('Install qrcode: npm install --save-dev qrcode (from mobile/)');
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const day = new Date().toISOString().split('T')[0];

  for (const cp of CHECKPOINTS) {
    const token = generateRotatingToken(cp.id, cp.premises);
    const filename = `${cp.id}-${day}.png`;
    const filepath = join(outDir, filename);
    await QRCode.toFile(filepath, token, { width: 400, margin: 2 });
    console.log(`${cp.name}: ${filepath}`);
    console.log(`  token: ${token}`);
  }
  console.log('\nDone. Tokens expire daily; use Sample QR screen in the app for live codes.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
