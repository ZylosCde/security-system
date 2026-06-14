import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiAssignment } from './api-client';

export const STORAGE_DEVICE_BINDING = 'aegis_device_binding';

export type DeviceBinding = {
  deviceId: number;
  imeiNumber: string;
};

export async function getDeviceBinding(): Promise<DeviceBinding | null> {
  const raw = await AsyncStorage.getItem(STORAGE_DEVICE_BINDING);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DeviceBinding;
    if (
      typeof parsed.deviceId === 'number' &&
      typeof parsed.imeiNumber === 'string' &&
      parsed.imeiNumber.trim()
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export async function setDeviceBinding(binding: DeviceBinding): Promise<void> {
  await AsyncStorage.setItem(STORAGE_DEVICE_BINDING, JSON.stringify(binding));
}

export async function clearDeviceBinding(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_DEVICE_BINDING);
}

export function normalizeImei(imei: string): string {
  return imei.replace(/\D/g, '');
}

export function validateQrImeiMatch(
  qrImei: string,
  localImei: string
): { ok: boolean; message: string } {
  const qr = normalizeImei(qrImei);
  const local = normalizeImei(localImei);
  if (!qr || !local) {
    return { ok: false, message: 'Invalid IMEI in device QR.' };
  }
  if (qr !== local) {
    return {
      ok: false,
      message: 'Invalid device. The IMEI in this QR does not match this handset.',
    };
  }
  return { ok: true, message: '' };
}

export function validateAssignmentAgainstBinding(
  assignment: ApiAssignment | null,
  binding: DeviceBinding | null
): { ok: boolean; message: string } {
  if (!binding) {
    return {
      ok: false,
      message: 'Scan the device QR on this handset before signing in.',
    };
  }
  return { ok: true, message: '' };
}
