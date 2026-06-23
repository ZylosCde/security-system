import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import type { ThemePreference } from '../context/ThemeContext';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { formatImeiDisplay } from '../theme/fieldTheme';
import { rootNavigationRef } from '../navigation/rootNavigationRef';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors, preference, setPreference } = useAppTheme();
  const { officer, deviceBinding, deviceId, signOut } = usePatrol();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const imeiLabel = deviceBinding
    ? `IMEI ${deviceBinding.imeiNumber} (ID ${deviceBinding.deviceId})`
    : formatImeiDisplay(deviceId);

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again. This handset stays registered.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut();
          if (rootNavigationRef.isReady()) {
            rootNavigationRef.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              })
            );
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={40} color={colors.primary} />
      </View>
      <Text style={styles.name}>{officer?.name ?? 'Guest'}</Text>
      <Text style={styles.meta}>{officer ? `ID ${officer.nic}` : 'No officer bound to this device'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device</Text>
        <Text style={styles.mono}>{imeiLabel}</Text>
        <Pressable
          style={styles.linkRow}
          onPress={() => navigation.navigate('ScanAuthQr', { mode: 'device' })}
          accessibilityRole="button"
          accessibilityLabel="Re-scan device QR"
        >
          <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
          <Text style={styles.linkTxt}>Re-scan device QR</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={styles.linkRow}
          onPress={() => navigation.navigate('OfficerBind')}
          accessibilityRole="button"
          accessibilityLabel="Bind or switch officer"
        >
          <Ionicons name="id-card-outline" size={22} color={colors.primary} />
          <Text style={styles.linkTxt}>{officer ? 'Switch officer' : 'Bind officer'}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
        {!officer ? (
          <Pressable
            style={styles.linkRow}
            onPress={() => navigation.navigate('Auth')}
            accessibilityRole="button"
            accessibilityLabel="Open device authentication"
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            <Text style={styles.linkTxt}>Device authentication</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.section}>Appearance</Text>
      <View style={styles.segment}>
        {THEME_OPTIONS.map((o) => (
          <Pressable
            key={o.key}
            style={[styles.segBtn, preference === o.key && styles.segOn]}
            onPress={() => setPreference(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: preference === o.key }}
            accessibilityLabel={`Theme ${o.label}`}
          >
            <Text style={[styles.segTxt, preference === o.key && styles.segTxtOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>

      {officer ? (
        <Pressable style={styles.signOut} onPress={onSignOut} accessibilityRole="button">
          <Text style={styles.signOutTxt}>Sign out device</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: 16, alignItems: 'stretch' },
    avatar: {
      alignSelf: 'center',
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    name: {
      color: c.textOnDark,
      fontSize: 22,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 16,
    },
    meta: { color: c.textMuted, textAlign: 'center', marginTop: 6, fontSize: 14 },
    card: {
      marginTop: 24,
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    cardTitle: { color: c.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8 },
    mono: { color: c.textOnCard, fontSize: 14, fontVariant: ['tabular-nums'], marginBottom: 8 },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
    },
    linkTxt: { flex: 1, color: c.textOnCard, fontSize: 16, fontWeight: '500' },
    section: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 24,
      marginBottom: 8,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    segBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    segOn: { backgroundColor: c.primary },
    segTxt: { color: c.textMuted, fontWeight: '500', fontSize: 14 },
    segTxtOn: { color: c.onPrimary },
    signOut: {
      marginTop: 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.danger,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: c.dangerSoft,
    },
    signOutTxt: { color: c.danger, fontWeight: '600', fontSize: 16 },
  });
}
