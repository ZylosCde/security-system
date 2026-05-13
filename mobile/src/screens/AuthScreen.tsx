import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import { FieldTheme, formatImeiDisplay } from '../theme/fieldTheme';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { deviceId } = usePatrol();
  const imeiLabel = formatImeiDisplay(deviceId);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.hero}>
        <View style={styles.shieldWrap}>
          <Ionicons name="shield-checkmark" size={40} color="#fff" />
        </View>
        <View style={styles.idPill}>
          <Ionicons name="hardware-chip-outline" size={14} color={FieldTheme.primaryLight} />
          <Text style={styles.idPillText}>ID: {imeiLabel}</Text>
        </View>
        <View style={styles.okPill}>
          <Ionicons name="checkmark-circle" size={14} color={FieldTheme.success} />
          <Text style={styles.okPillText}>DEVICE REGISTERED</Text>
        </View>
        <Text style={styles.title}>Authentication Required</Text>
        <Text style={styles.sub}>
          Scan your officer ID card or QR code to bind your session to this device.
        </Text>
      </View>

      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
        <View style={styles.camCircle}>
          <Ionicons name="camera" size={36} color="#fff" />
        </View>
        <Pressable style={styles.readyBtn} onPress={() => navigation.navigate('OfficerBind')}>
          <Text style={styles.readyBtnText}>READY TO SCAN</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => navigation.navigate('OfficerBind')}>
        <Text style={styles.manualLink}>Enter ID manually</Text>
      </Pressable>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerRow}>
          <Ionicons name="help-circle-outline" size={16} color={FieldTheme.textMuted} />
          <Text style={styles.footerMuted}>Support</Text>
        </View>
        <Text style={styles.version}>v2.4.12-secure</Text>
      </View>
    </View>
  );
}

const cornerSize = 28;
const cornerThick = 3;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: FieldTheme.bg,
    paddingHorizontal: 24,
  },
  hero: { alignItems: 'center' },
  shieldWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: FieldTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: FieldTheme.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 10,
  },
  idPillText: { color: FieldTheme.textOnDark, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  okPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  okPillText: { color: FieldTheme.success, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: {
    color: FieldTheme.textOnDark,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  sub: {
    color: FieldTheme.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  scanFrame: {
    marginTop: 36,
    minHeight: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: cornerSize,
    height: cornerSize,
    borderColor: FieldTheme.primaryLight,
  },
  tl: { top: 12, left: 12, borderTopWidth: cornerThick, borderLeftWidth: cornerThick, borderTopLeftRadius: 4 },
  tr: { top: 12, right: 12, borderTopWidth: cornerThick, borderRightWidth: cornerThick, borderTopRightRadius: 4 },
  bl: { bottom: 12, left: 12, borderBottomWidth: cornerThick, borderLeftWidth: cornerThick, borderBottomLeftRadius: 4 },
  br: { bottom: 12, right: 12, borderBottomWidth: cornerThick, borderRightWidth: cornerThick, borderBottomRightRadius: 4 },
  camCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: FieldTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  readyBtn: {
    backgroundColor: FieldTheme.card,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  readyBtnText: { color: FieldTheme.textOnCard, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  manualLink: {
    marginTop: 20,
    textAlign: 'center',
    color: FieldTheme.primaryLight,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: { alignItems: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerMuted: { color: FieldTheme.textMuted, fontSize: 13 },
  version: { color: FieldTheme.textMuted, fontSize: 11, marginTop: 8, opacity: 0.7 },
});
