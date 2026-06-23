/** Flat, professional palette — no gradients */
export type ThemeColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  card: string;
  cardSecondary: string;
  headerBg: string;
  headerText: string;
  textOnDark: string;
  textMuted: string;
  textOnCard: string;
  textMutedOnCard: string;
  primary: string;
  primaryLight: string;
  primarySoft: string;
  onPrimary: string;
  border: string;
  borderLight: string;
  divider: string;
  listRow: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  dangerDeep: string;
  sosPulse: string;
  tabInactive: string;
  tabActive: string;
  tabBar: string;
};

export const lightColors: ThemeColors = {
  bg: '#ECEFF2',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardSecondary: '#F7F8FA',
  headerBg: '#1A7B64',
  headerText: '#FFFFFF',
  textOnDark: '#111B21',
  textMuted: '#667781',
  textOnCard: '#111B21',
  textMutedOnCard: '#667781',
  primary: '#1A7B64',
  primaryLight: '#15856C',
  primarySoft: '#E7F5F1',
  onPrimary: '#FFFFFF',
  border: '#E9EDEF',
  borderLight: '#F0F2F5',
  divider: '#E9EDEF',
  listRow: '#FFFFFF',
  success: '#1A7B64',
  successSoft: '#E7F5F1',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  dangerDeep: '#991B1B',
  sosPulse: '#DC2626',
  tabInactive: '#667781',
  tabActive: '#1A7B64',
  tabBar: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  bg: '#000000', // True black for maximum OLED battery saving
  bgElevated: '#000000', // Pushed to true black
  surface: '#050505', // Barely off-black
  card: '#000000', // True black
  cardSecondary: '#0A0A0A',
  headerBg: '#000000', // True black
  headerText: '#FFFFFF', // High contrast
  textOnDark: '#FFFFFF', // High contrast
  textMuted: '#A1A1AA', // High contrast muted
  textOnCard: '#FFFFFF',
  textMutedOnCard: '#A1A1AA',
  primary: '#10B981', // Brighter green for contrast
  primaryLight: '#34D399',
  primarySoft: '#022C22', // Deeper soft primary
  onPrimary: '#000000', // Black text on primary for contrast
  border: '#27272A', // Using border to define edges instead of background colors
  borderLight: '#18181B',
  divider: '#27272A',
  listRow: '#000000', // True black
  success: '#10B981',
  successSoft: '#022C22',
  warning: '#FBBF24',
  warningSoft: '#451A03',
  danger: '#EF4444',
  dangerSoft: '#450A0A',
  dangerDeep: '#7F1D1D',
  sosPulse: '#EF4444',
  tabInactive: '#A1A1AA',
  tabActive: '#10B981',
  tabBar: '#000000', // True black
};
