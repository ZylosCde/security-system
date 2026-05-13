import { getLocales } from 'expo-localization';

export function formatLocaleDate(date: Date = new Date()): string {
  const tag = getLocales()[0]?.languageTag ?? 'en-US';
  try {
    return new Intl.DateTimeFormat(tag, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 16);
  }
}

export function formatLocaleNumber(value: number, options?: Intl.NumberFormatOptions): string {
  const tag = getLocales()[0]?.languageTag ?? 'en-US';
  try {
    return new Intl.NumberFormat(tag, options).format(value);
  } catch {
    return String(value);
  }
}
