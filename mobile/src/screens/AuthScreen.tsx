import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import QRCode from 'react-native-qrcode-svg';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { formatImeiDisplay } from '../theme/fieldTheme';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { generateOfficerToken } from '../lib/qrService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

const cornerSize = 28;
const cornerThick = 3;

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { deviceId, officers } = usePatrol();
  const [testQrVisible, setTestQrVisible] = useState(false);
  const imeiLabel = formatImeiDisplay(deviceId);
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? 'dev';

  const testOfficer = officers.find((o) => o.status !== 'off-duty') ?? officers[0];
  const testToken = testOfficer ? generateOfficerToken(testOfficer.id) : '';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.hero}>
        <View style={styles.shieldWrap}>
          <Ionicons name="shield-checkmark" size={40} color="#fff" />
        </View>
        <View style={styles.idPill}>
          <Ionicons name="hardware-chip-outline" size={14} color={colors.primaryLight} />
          <Text style={styles.idPillText}>ID: {imeiLabel}</Text>
        </View>
        <View style={styles.okPill}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
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
        <Pressable style={styles.readyBtn} onPress={() => navigation.navigate('ScanOfficer')}>
          <Text style={styles.readyBtnText}>READY TO SCAN</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => navigation.navigate('OfficerBind')}>
        <Text style={styles.manualLink}>Enter ID manually</Text>
      </Pressable>

      <Pressable onPress={() => setTestQrVisible(true)}>
        <Text style={styles.testLink}>Get test login QR</Text>
      </Pressable>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerRow}>
          <Ionicons name="help-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.footerMuted}>Support</Text>
        </View>
        <Text style={styles.version}>v{version}</Text>
      </View>

      <Modal
        visible={testQrVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTestQrVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Test login QR</Text>
            {testOfficer ? (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.modalOfficer}>{testOfficer.name}</Text>
                <Text style={styles.modalMeta}>
                  {testOfficer.id} · {testOfficer.nic}
                </Text>
                <View style={styles.qrWrap}>
                  <QRCode value={testToken} size={200} backgroundColor="#fff" color="#000" />
                </View>
                <Text style={styles.tokenLabel} selectable>
                  {testToken}
                </Text>
                <Text style={styles.modalHint}>
                  For officer login only — not for patrol checkpoint scans. Use Patrol → Test checkpoint QRs
                  for checkpoint testing.
                </Text>
              </ScrollView>
            ) : (
              <Text style={styles.modalHint}>No officers available.</Text>
            )}
            <Pressable style={styles.modalClose} onPress={() => setTestQrVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.bg,
      paddingHorizontal: 24,
    },
    hero: { alignItems: 'center' },
    shieldWrap: {
      width: 88,
      height: 88,
      borderRadius: 22,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    idPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.surface,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      marginBottom: 10,
    },
    idPillText: { color: c.textOnDark, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
    okPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 28,
    },
    okPillText: { color: c.success, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    title: {
      color: c.textOnDark,
      fontSize: 26,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 10,
    },
    sub: {
      color: c.textMuted,
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
      borderColor: c.primaryLight,
    },
    tl: { top: 12, left: 12, borderTopWidth: cornerThick, borderLeftWidth: cornerThick, borderTopLeftRadius: 4 },
    tr: { top: 12, right: 12, borderTopWidth: cornerThick, borderRightWidth: cornerThick, borderTopRightRadius: 4 },
    bl: { bottom: 12, left: 12, borderBottomWidth: cornerThick, borderLeftWidth: cornerThick, borderBottomLeftRadius: 4 },
    br: { bottom: 12, right: 12, borderBottomWidth: cornerThick, borderRightWidth: cornerThick, borderBottomRightRadius: 4 },
    camCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
    },
    readyBtn: {
      backgroundColor: c.card,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 999,
    },
    readyBtnText: { color: c.textOnCard, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
    manualLink: {
      marginTop: 20,
      textAlign: 'center',
      color: c.primaryLight,
      fontSize: 15,
      fontWeight: '600',
    },
    testLink: {
      marginTop: 12,
      textAlign: 'center',
      color: c.textMuted,
      fontSize: 14,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    footer: { alignItems: 'center' },
    footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerMuted: { color: c.textMuted, fontSize: 13 },
    version: { color: c.textMuted, fontSize: 11, marginTop: 8, opacity: 0.7 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: c.bgElevated,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 24,
      maxHeight: '85%',
    },
    modalTitle: {
      color: c.textOnDark,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 16,
    },
    modalBody: { alignItems: 'center', paddingBottom: 16 },
    modalOfficer: { color: c.textOnDark, fontSize: 18, fontWeight: '700' },
    modalMeta: { color: c.textMuted, fontSize: 13, marginTop: 4, marginBottom: 20 },
    qrWrap: {
      padding: 16,
      backgroundColor: '#fff',
      borderRadius: 12,
      marginBottom: 16,
    },
    tokenLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      textAlign: 'center',
      marginBottom: 12,
    },
    modalHint: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    modalClose: {
      backgroundColor: c.primary,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    modalCloseText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  });
}
