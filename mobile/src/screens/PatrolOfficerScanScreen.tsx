import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { PatrolStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { parseOfficerLoginQr } from '../lib/qrService';

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'OfficerPatrolScan'>;

export function PatrolOfficerScanScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { startPatrolFromOfficerQr, deviceBinding } = usePatrol();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const lastData = useRef<string | null>(null);

  const handlePayload = useCallback(
    async (data: string) => {
      const trimmed = data.trim();
      if (!trimmed || busy) return;
      if (lastData.current === trimmed) return;
      lastData.current = trimmed;
      setBusy(true);
      try {
        if (!parseOfficerLoginQr(trimmed)) {
          Alert.alert('Invalid QR', 'Scan your officer badge QR from admin.');
          lastData.current = null;
          return;
        }

        const res = await startPatrolFromOfficerQr(trimmed);
        if (res.ok) {
          navigation.replace('ScanCheckpoint');
        } else {
          Alert.alert('Verification failed', res.message);
          lastData.current = null;
        }
      } finally {
        setBusy(false);
        setTimeout(() => {
          lastData.current = null;
        }, 2500);
      }
    },
    [busy, startPatrolFromOfficerQr, navigation]
  );

  const onBarcode = useCallback(
    ({ data }: { data: string }) => {
      void handlePayload(data);
    },
    [handlePayload]
  );

  const submitManual = () => {
    if (!manual.trim()) return;
    void handlePayload(manual);
    setManual('');
  };

  if (!deviceBinding) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Device not registered</Text>
        <Text style={styles.info}>Register this device before starting patrol.</Text>
        <Pressable style={styles.primary} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
        </Pressable>
        <Text style={styles.title}>Scan officer QR</Text>
        <Text style={styles.info}>Camera access is required to verify your officer badge.</Text>
        <Pressable style={styles.primary} onPress={() => void requestPermission()}>
          <Text style={styles.primaryText}>Grant permission</Text>
        </Pressable>
        <View style={styles.manualBox}>
          <TextInput
            style={styles.input}
            placeholder="NIC:123456789V"
            placeholderTextColor={colors.textMuted}
            value={manual}
            onChangeText={setManual}
            autoCapitalize="characters"
          />
          <Pressable style={styles.secondary} onPress={submitManual} disabled={busy}>
            <Text style={styles.secondaryText}>Submit</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
        </Pressable>
        <Text style={styles.title}>Scan officer QR</Text>
        {busy ? <ActivityIndicator color={colors.primary} /> : <View style={{ width: 24 }} />}
      </View>
      <Text style={styles.hint}>
        Your site must match this device. Admin records are checked before patrol starts.
      </Text>
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={busy ? undefined : onBarcode}
        />
        <View style={styles.frame} />
      </View>
      <View style={styles.manualBox}>
        <Text style={styles.manualLabel}>Manual entry</Text>
        <TextInput
          style={styles.input}
          placeholder="NIC:…"
          placeholderTextColor={colors.textMuted}
          value={manual}
          onChangeText={setManual}
          autoCapitalize="characters"
        />
        <Pressable style={styles.secondary} onPress={submitManual} disabled={busy}>
          <Text style={styles.secondaryText}>Submit</Text>
        </Pressable>
      </View>
      {Platform.OS === 'web' ? (
        <Text style={styles.webNote}>QR scanning may be limited on web; use manual entry.</Text>
      ) : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 16 },
    center: {
      flex: 1,
      backgroundColor: c.bg,
      padding: 24,
      justifyContent: 'center',
    },
    backBtn: { position: 'absolute', top: 48, left: 20 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: { color: c.textOnDark, fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
    hint: { color: c.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 12, textAlign: 'center' },
    info: { color: c.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    cameraWrap: {
      flex: 1,
      minHeight: 280,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#000',
      marginBottom: 16,
    },
    frame: {
      ...StyleSheet.absoluteFillObject,
      margin: 32,
      borderWidth: 2,
      borderColor: c.primary,
      borderRadius: 12,
    },
    manualBox: { marginBottom: 8 },
    manualLabel: { color: c.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8 },
    input: {
      backgroundColor: c.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      color: c.textOnDark,
      fontSize: 14,
      marginBottom: 10,
    },
    primary: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    primaryText: { color: c.onPrimary, fontWeight: '600' },
    secondary: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: c.card,
    },
    secondaryText: { color: c.primary, fontWeight: '600' },
    webNote: { color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  });
}
