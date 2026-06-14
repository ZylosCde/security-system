import { listDevices, ApiClientError, type ApiDevice } from './api-client';
import { parseDeviceQr } from './qrService';
import { validateQrImeiMatch, type DeviceBinding } from './deviceBinding';
import {
  getLocalDeviceImei,
  imeiValuesMatch,
  validateStoredBindingImei,
} from './deviceImei';

export type DeviceRegistrationResult =
  | {
      ok: true;
      binding: DeviceBinding;
      deviceName: string;
      siteName: string | null;
      message: string;
    }
  | { ok: false; message: string };

async function fetchDeviceFromDatabase(deviceId: number): Promise<ApiDevice | null> {
  const { devices } = await listDevices();
  return devices.find((d) => d.id === deviceId) ?? null;
}

/**
 * When hardware IMEI is readable, it must match the admin record.
 * Expo Go cannot read IMEI — in that case admin DB + QR match is sufficient.
 */
async function validateHandsetImei(recordImei: string): Promise<{ ok: boolean; message: string }> {
  const localImei = await getLocalDeviceImei();

  if (!localImei) {
    return { ok: true, message: '' };
  }

  return validateQrImeiMatch(recordImei, localImei);
}

export async function verifyStoredBinding(
  binding: DeviceBinding
): Promise<{ ok: boolean; message: string }> {
  try {
    const dbDevice = await fetchDeviceFromDatabase(binding.deviceId);
    if (!dbDevice) {
      return {
        ok: false,
        message: 'This device is no longer registered in admin. Scan the device QR again.',
      };
    }
    if (!imeiValuesMatch(binding.imeiNumber, dbDevice.imeiNumber)) {
      return {
        ok: false,
        message: 'Stored device registration is out of date. Scan the device QR again.',
      };
    }
    return validateHandsetImei(dbDevice.imeiNumber);
  } catch (e) {
    if (__DEV__) {
      return validateStoredBindingImei(binding.imeiNumber);
    }
    const msg =
      e instanceof ApiClientError ? e.message : 'Cannot verify device registration with admin.';
    return { ok: false, message: msg };
  }
}

export async function verifyDeviceRegistration(qrData: string): Promise<DeviceRegistrationResult> {
  const parsed = parseDeviceQr(qrData);
  if (!parsed) {
    return {
      ok: false,
      message: 'Invalid device QR. Scan the code shown in web admin → Devices → Show QR.',
    };
  }

  let dbDevice: ApiDevice | null;
  try {
    dbDevice = await fetchDeviceFromDatabase(parsed.deviceId);
  } catch (e) {
    const msg =
      e instanceof ApiClientError
        ? e.message
        : 'Cannot reach admin server. Check network and EXPO_PUBLIC_API_URL.';
    return { ok: false, message: msg };
  }

  if (!dbDevice) {
    return {
      ok: false,
      message: `Device #${parsed.deviceId} is not registered in admin. Ask your supervisor to add this device first.`,
    };
  }

  if (!imeiValuesMatch(parsed.imeiNumber, dbDevice.imeiNumber)) {
    return {
      ok: false,
      message: `Invalid QR. The IMEI in this code does not match device "${dbDevice.deviceName}" in admin.`,
    };
  }

  const handsetCheck = await validateHandsetImei(dbDevice.imeiNumber);
  if (!handsetCheck.ok) {
    return {
      ok: false,
      message:
        handsetCheck.message ||
        'Invalid device. This handset IMEI does not match the admin record.',
    };
  }

  const binding: DeviceBinding = {
    deviceId: dbDevice.id,
    imeiNumber: dbDevice.imeiNumber,
  };

  const siteName = dbDevice.site?.name ?? null;
  return {
    ok: true,
    binding,
    deviceName: dbDevice.deviceName,
    siteName,
    message: siteName
      ? `Device registered: ${dbDevice.deviceName} · ${siteName}`
      : `Device registered: ${dbDevice.deviceName}`,
  };
}
