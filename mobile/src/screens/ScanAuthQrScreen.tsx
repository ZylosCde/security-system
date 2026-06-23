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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { parseDeviceQr, parseOfficerLoginQr } from '../lib/qrService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ScanAuthQr'>;
type Route = RouteProp<RootStackParamList, 'ScanAuthQr'>;

export function ScanAuthQrScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const mode = route.params.mode;
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { registerDeviceFromQr, loginFromQr, deviceBinding } = usePatrol();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const lastData = useRef<string | null>(null);

  const title = mode === 'device' ? 'Scan device QR' : 'Scan officer QR';
  const hint =
    mode === 'device'
      ? 'Step 1: Scan the device QR from web admin (Devices → Show QR). Not your officer badge.'
      : 'Step 2: Scan your officer badge QR after this device is registered.';

  const handlePayload = useCallback(
    async (data: string) => {
      const trimmed = data.trim();
      if (!trimmed || busy) return;
      if (lastData.current === trimmed) return;
      lastData.current = trimmed;
      setBusy(true);
      try {
        const isDeviceQr = parseDeviceQr(trimmed) != null;
        const isOfficerQr = parseOfficerLoginQr(trimmed) != null;

        if (mode === 'device') {
          if (isOfficerQr && !isDeviceQr) {
            if (deviceBinding) {
              const res = await loginFromQr(trimmed);
              if (res.ok) {
                navigation.replace('Main');
              } else {
                Alert.alert('Sign-in failed', res.message);
                lastData.current = null;
              }
            } else {
              Alert.alert(
                'Officer badge detected',
                'You scanned your officer sign-in QR. Register this tablet first:\n\n1. Open the web admin → Devices\n2. Tap Show QR on your assigned device\n3. Scan that device QR here\n\nThen on the sign-in screen use Scan officer QR for this badge.',
                [
                  { text: 'Back to sign-in', onPress: () => navigation.goBack() },
                  { text: 'OK', style: 'cancel' },
                ]
              );
              lastData.current = null;
            }
            return;
          }

          const res = await registerDeviceFromQr(trimmed);
          if (res.ok) {
            Alert.alert('Device registered', res.message, [
              { text: 'Continue', onPress: () => navigation.replace('Main') },
            ]);
          } else {
            Alert.alert('Registration failed', res.message);
            lastData.current = null;
          }
        } else {
          if (isDeviceQr && !isOfficerQr) {
            const res = await registerDeviceFromQr(trimmed);
            if (res.ok) {
              Alert.alert('Device registered', res.message, [
                { text: 'Continue', onPress: () => navigation.replace('Main') },
              ]);
            } else {
              Alert.alert('Registration failed', res.message);
              lastData.current = null;
            }
            return;
          }

          const res = await loginFromQr(trimmed);
          if (res.ok) {
            navigation.replace('Main');
          } else {
            Alert.alert('Sign-in failed', res.message);
            lastData.current = null;
          }
        }
      } finally {
        setBusy(false);
        setTimeout(() => {
          lastData.current = null;
        }, 2500);
      }
    },
    [busy, mode, deviceBinding, registerDeviceFromQr, loginFromQr, navigation]
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

  if (!permission?.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.info}>Camera access is required to scan QR codes.</Text>
        <Pressable style={styles.primary} onPress={() => void requestPermission()}>
          <Text style={styles.primaryText}>Grant permission</Text>
        </Pressable>
        <View style={styles.manualBox}>
          <Text style={styles.manualLabel}>Or paste QR payload</Text>
          <TextInput
            style={styles.input}
            placeholder={mode === 'device' ? 'DEVICE:3:356938…' : 'NIC:123456789V'}
            placeholderTextColor={colors.textMuted}
            value={manual}
            onChangeText={setManual}
            autoCapitalize="none"
            autoCorrect={false}
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
        <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {busy ? <ActivityIndicator color={colors.primary} /> : <View style={{ width: 24 }} />}
      </View>
      <Text style={styles.hint}>{hint}</Text>
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
          placeholder={mode === 'device' ? 'DEVICE:id:imei' : 'NIC:…'}
          placeholderTextColor={colors.textMuted}
          value={manual}
          onChangeText={setManual}
          autoCapitalize="none"
          autoCorrect={false}
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
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
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
