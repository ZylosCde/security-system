import * as Device from 'expo-device';
import { normalizeImei } from './deviceBinding';

const MOCK_IMEI = process.env.EXPO_PUBLIC_MOCK_DEVICE_IMEI?.trim() ?? '';

export function imeiValuesMatch(expected: string, actual: string): boolean {
  const a = normalizeImei(expected);
  const b = normalizeImei(actual);
  return a.length > 0 && b.length > 0 && a === b;
}

/**
 * Returns handset IMEI when the runtime exposes it (mock env var or future native build).
 * Expo Go on physical devices cannot read hardware IMEI — returns null in that case.
 */
export async function getLocalDeviceImei(): Promise<string | null> {
  if (MOCK_IMEI) return MOCK_IMEI;

  if (!Device.isDevice) return null;

  // Native IMEI access is added in custom Android production builds.
  return null;
}

export function canVerifyHandsetImei(): boolean {
  return MOCK_IMEI.length > 0;
}

export async function validateStoredBindingImei(
  storedImei: string
): Promise<{ ok: boolean; message: string }> {
  const localImei = await getLocalDeviceImei();

  if (!localImei) {
    return { ok: true, message: '' };
  }

  if (!imeiValuesMatch(storedImei, localImei)) {
    return {
      ok: false,
      message: 'Invalid device. Stored registration does not match this handset.',
    };
  }

  return { ok: true, message: '' };
}
