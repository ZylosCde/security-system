import { StyleSheet } from 'react-native';
import type { ThemeColors } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

/** Shared UI primitives for a clean, flat design system */
export function createUiStyles(c: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
    },
    screenPadded: {
      flex: 1,
      backgroundColor: c.bg,
      paddingHorizontal: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: c.headerBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headerLight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: c.bgElevated,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    headerTitle: {
      ...typography.titleSm,
      color: c.headerText,
    },
    headerTitleDark: {
      ...typography.titleSm,
      color: c.textOnDark,
    },
    headerSub: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 2,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.lg,
    },
    section: {
      backgroundColor: c.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.listRow,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    btnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.primary,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
    },
    btnPrimaryText: {
      ...typography.button,
      color: c.onPrimary,
    },
    btnSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.bgElevated,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    btnSecondaryText: {
      ...typography.button,
      color: c.primary,
    },
    btnDisabled: {
      opacity: 0.5,
    },
    input: {
      backgroundColor: c.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md + 2,
      color: c.textOnDark,
      fontSize: 16,
    },
    inputLabel: {
      ...typography.label,
      color: c.textMuted,
      marginBottom: spacing.sm,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: c.primarySoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
    },
    badgeText: {
      ...typography.caption,
      fontWeight: '600',
      color: c.primary,
    },
    alertError: {
      backgroundColor: c.dangerSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.danger,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    alertErrorText: {
      ...typography.bodySm,
      color: c.danger,
    },
    alertWarning: {
      backgroundColor: c.warningSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.warning,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    alertWarningText: {
      ...typography.bodySm,
      color: c.warning,
    },
    muted: {
      ...typography.bodySm,
      color: c.textMuted,
    },
    title: {
      ...typography.title,
      color: c.textOnDark,
    },
    subtitle: {
      ...typography.bodySm,
      color: c.textMuted,
      marginTop: spacing.xs,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.cardSecondary,
    },
  });
}

export type UiStyles = ReturnType<typeof createUiStyles>;
