import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { BASE_URL } from '../lib/api-client';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors, ui } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { deviceBinding, loginWithNIC, apiError } = usePatrol();
  const [nic, setNic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'dev';

  const handleLogin = async () => {
    setSubmitting(true);
    setError(null);
    const res = await loginWithNIC(nic);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    navigation.replace('Main');
  };

  const deviceBound = deviceBinding != null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.logoWrap}>
          <Ionicons name="shield-checkmark" size={28} color={colors.onPrimary} />
        </View>
        <Text style={styles.headerTitle}>Officer App</Text>
        <Text style={styles.headerSub}>Sign in to start patrols</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome</Text>
          <Text style={styles.cardSub}>
            Step 1: scan the device QR from admin. Step 2: sign in with your officer ID or NIC.
          </Text>

          {apiError ? (
            <View style={[ui.alertError, styles.alertSpacing]}>
              <Text style={ui.alertErrorText}>{apiError}</Text>
            </View>
          ) : null}

          {deviceBound ? (
            <View style={[styles.infoRow, styles.alertSpacing]}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Device registered</Text>
                <Text style={styles.infoSub}>
                  ID {deviceBinding.deviceId} · IMEI {deviceBinding.imeiNumber}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[ui.alertWarning, styles.alertSpacing]}>
              <Text style={ui.alertWarningText}>
                You must scan the device QR before signing in. The IMEI in the QR must match
                the device registered in the admin system.
              </Text>
            </View>
          )}

          <Pressable
            style={ui.btnPrimary}
            onPress={() => navigation.navigate('ScanAuthQr', { mode: 'device' })}
          >
            <Ionicons name="hardware-chip-outline" size={20} color={colors.onPrimary} />
            <Text style={ui.btnPrimaryText}>
              {deviceBound ? 'Re-scan device QR' : 'Scan device QR (required)'}
            </Text>
          </Pressable>

          {deviceBound ? (
            <>
              <Pressable
                style={[ui.btnSecondary, styles.btnGap]}
                onPress={() => navigation.navigate('ScanAuthQr', { mode: 'officer' })}
              >
                <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
                <Text style={ui.btnSecondaryText}>Scan officer QR</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={ui.inputLabel}>NIC number</Text>
              <TextInput
                style={ui.input}
                placeholder="e.g. 123456789V"
                placeholderTextColor={colors.textMuted}
                value={nic}
                onChangeText={setNic}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!submitting}
              />
              {error ? <Text style={styles.fieldError}>{error}</Text> : null}

              <Pressable
                style={[ui.btnPrimary, styles.btnGap, submitting && ui.btnDisabled]}
                onPress={() => void handleLogin()}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={ui.btnPrimaryText}>Sign in</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.linkBtn}
                onPress={() => navigation.navigate('OfficerBind')}
              >
                <Text style={styles.linkText}>Manual NIC entry</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <Text style={styles.footerMeta}>
          {BASE_URL.replace(/^https?:\/\//, '')} · v{version}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: {
      backgroundColor: c.headerBg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      alignItems: 'center',
    },
    logoWrap: {
      width: 56,
      height: 56,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    headerTitle: {
      ...typography.title,
      color: c.headerText,
    },
    headerSub: {
      ...typography.bodySm,
      color: 'rgba(255,255,255,0.85)',
      marginTop: spacing.xs,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    cardTitle: {
      ...typography.titleSm,
      color: c.textOnCard,
    },
    cardSub: {
      ...typography.bodySm,
      color: c.textMutedOnCard,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    alertSpacing: { marginBottom: spacing.md },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.primarySoft,
      padding: spacing.md,
      borderRadius: radius.md,
    },
    infoText: { flex: 1 },
    infoTitle: {
      ...typography.label,
      color: c.textOnCard,
    },
    infoSub: {
      ...typography.caption,
      color: c.textMutedOnCard,
      marginTop: 2,
    },
    btnGap: { marginTop: spacing.sm },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginVertical: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
    },
    dividerText: {
      ...typography.caption,
      color: c.textMuted,
    },
    fieldError: {
      ...typography.bodySm,
      color: c.danger,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    linkBtn: {
      marginTop: spacing.lg,
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    linkText: {
      ...typography.bodySm,
      color: c.primary,
      fontWeight: '600',
    },
    footerMeta: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
  });
}
