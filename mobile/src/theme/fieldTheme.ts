import { darkColors, lightColors, type ThemeColors } from './colors';

export type { ThemeColors };
export { darkColors, lightColors };

export function formatImeiDisplay(deviceId: string): string {
  return deviceId.replace(/^D-/, 'IMEI-9920-8441-').slice(0, 24);
}

/** @deprecated Use useAppTheme().colors — kept for gradual migration */
export const FieldTheme = darkColors;
