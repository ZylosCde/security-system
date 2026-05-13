/** Shared design tokens — dark (default) and light surfaces for international-ready UI */
export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  card: string;
  cardSecondary: string;
  textOnDark: string;
  textMuted: string;
  textOnCard: string;
  textMutedOnCard: string;
  primary: string;
  primaryLight: string;
  primarySoft: string;
  border: string;
  borderLight: string;
  success: string;
  warning: string;
  danger: string;
  dangerDeep: string;
  sosPulse: string;
  tabInactive: string;
  tabActive: string;
};

export const darkColors: ThemeColors = {
  bg: '#0B1120',
  bgElevated: '#111827',
  surface: '#1E293B',
  card: '#FFFFFF',
  cardSecondary: '#F8FAFC',
  textOnDark: '#F8FAFC',
  textMuted: '#94A3B8',
  textOnCard: '#0F172A',
  textMutedOnCard: '#64748B',
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primarySoft: 'rgba(37, 99, 235, 0.12)',
  border: '#1E293B',
  borderLight: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#DC2626',
  dangerDeep: '#7F1D1D',
  sosPulse: '#EF4444',
  tabInactive: '#64748B',
  tabActive: '#3B82F6',
};

export const lightColors: ThemeColors = {
  bg: '#F1F5F9',
  bgElevated: '#FFFFFF',
  surface: '#E2E8F0',
  card: '#FFFFFF',
  cardSecondary: '#F8FAFC',
  textOnDark: '#0F172A',
  textMuted: '#64748B',
  textOnCard: '#0F172A',
  textMutedOnCard: '#64748B',
  primary: '#2563EB',
  primaryLight: '#1D4ED8',
  primarySoft: 'rgba(37, 99, 235, 0.1)',
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  dangerDeep: '#991B1B',
  sosPulse: '#EF4444',
  tabInactive: '#64748B',
  tabActive: '#2563EB',
};
