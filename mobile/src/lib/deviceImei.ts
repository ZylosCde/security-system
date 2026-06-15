import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { normalizeImei } from './deviceBinding';
import * as Application from 'expo-application';

const MOCK_IMEI = process.env.EXPO_PUBLIC_MOCK_DEVICE_IMEI?.trim() ?? '';

export function imeiValuesMatch(expected: string, actual: string): boolean {
  const a = normalizeImei(expected);
  const b = normalizeImei(actual);
  return a.length > 0 && b.length > 0 && a === b;
}

/**
 * Returns handset IMEI (or unique device ID) when the runtime exposes it.
 */
export async function getLocalDeviceImei(): Promise<string | null> {
  if (MOCK_IMEI) return MOCK_IMEI;

  if (!Device.isDevice) return null;

  try {
    if (Platform.OS === 'android') {
      const androidId = Application.getAndroidId();
      return androidId ? androidId.toString() : null;
    } else if (Platform.OS === 'ios') {
      const iosId = await Application.getIosIdForVendorAsync();
      return iosId ? iosId.toString() : null;
    }
  } catch (e) {
    console.warn('Failed to get unique device ID:', e);
  }

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
