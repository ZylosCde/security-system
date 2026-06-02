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

export function formatLocaleTime(date: Date = new Date()): string {
  const tag = getLocales()[0]?.languageTag ?? 'en-US';
  try {
    return new Intl.DateTimeFormat(tag, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(11, 19);
  }
}

export function formatLocaleDateOnly(date: Date = new Date()): string {
  const tag = getLocales()[0]?.languageTag ?? 'en-US';
  try {
    return new Intl.DateTimeFormat(tag, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${formatLocaleNumber(lat, { minimumFractionDigits: 5, maximumFractionDigits: 5 })}, ${formatLocaleNumber(lng, { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`;
}

export function formatLocaleNumber(value: number, options?: Intl.NumberFormatOptions): string {
  const tag = getLocales()[0]?.languageTag ?? 'en-US';
  try {
    return new Intl.NumberFormat(tag, options).format(value);
  } catch {
    return String(value);
  }
}
