/** Field officer UI — aligned with command-center / Visily-style mockups */
export const FieldTheme = {
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
} as const;

export const formatImeiDisplay = (deviceId: string) =>
  deviceId.replace(/^D-/, 'IMEI-9920-8441-').slice(0, 24);
