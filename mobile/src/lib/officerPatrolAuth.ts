import {
  listDevices,
  officerLogin,
  listOfficers,
  ApiClientError,
  type ApiAssignment,
  type ApiDevice,
  type ApiOfficer,
} from './api-client';
import { parseOfficerLoginQr } from './qrService';
import { validateAssignmentAgainstBinding, type DeviceBinding } from './deviceBinding';

export type OfficerPatrolVerifyResult =
  | {
      ok: true;
      officer: ApiOfficer;
      assignment: ApiAssignment;
      device: ApiDevice;
      nic: string;
    }
  | { ok: false; message: string };

async function resolveNicFromQr(qrData: string): Promise<string | null> {
  const parsed = parseOfficerLoginQr(qrData);
  if (!parsed) return null;
  if (parsed.kind === 'nic') return parsed.nic;
  try {
    const res = await listOfficers();
    const match = res.officers.find((o) => String(o.id) === parsed.officerId);
    return match?.NIC ?? null;
  } catch {
    return null;
  }
}

export async function verifyOfficerForPatrol(
  qrData: string,
  binding: DeviceBinding
): Promise<OfficerPatrolVerifyResult> {
  const nic = await resolveNicFromQr(qrData);
  if (!nic) {
    return {
      ok: false,
      message: 'Invalid officer QR. Scan your officer badge from admin.',
    };
  }

  let device: ApiDevice | null;
  try {
    const { devices } = await listDevices();
    device = devices.find((d) => d.id === binding.deviceId) ?? null;
  } catch (e) {
    const msg =
      e instanceof ApiClientError
        ? e.message
        : 'Cannot reach admin server. Check network.';
    return { ok: false, message: msg };
  }

  if (!device) {
    return {
      ok: false,
      message: 'This device is not registered in admin. Re-scan the device QR.',
    };
  }

  if (!device.siteId) {
    return {
      ok: false,
      message: 'No site is allocated to this device. Contact your admin.',
    };
  }

  let loginRes: Awaited<ReturnType<typeof officerLogin>>;
  try {
    loginRes = await officerLogin(nic);
  } catch (e) {
    const msg = e instanceof ApiClientError ? e.message : 'Officer not found in admin.';
    return { ok: false, message: msg };
  }

  const { officer, assignment } = loginRes;

  const qrParsed = parseOfficerLoginQr(qrData);
  if (qrParsed?.kind === 'nic') {
    const qrNic = qrParsed.nic.trim().toUpperCase();
    const dbNic = officer.NIC.trim().toUpperCase();
    if (qrNic !== dbNic) {
      return {
        ok: false,
        message: 'Officer QR does not match admin records.',
      };
    }
  }

  const resolvedAssignment: ApiAssignment = {
    id: assignment?.id ?? Date.now(),
    deviceId: device.id,
    siteId: device.siteId,
    officerId: officer.id,
    device,
    site: device.site,
  };

  return { ok: true, officer, assignment: resolvedAssignment, device, nic };
}
