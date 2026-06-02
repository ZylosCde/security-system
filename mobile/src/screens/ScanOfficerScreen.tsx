import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ScanOfficer'>;

type ScanPhase = 'scanning' | 'success';

export function ScanOfficerScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { bindOfficerFromQR } = usePatrol();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>('scanning');
  const [torchOn, setTorchOn] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [manual, setManual] = useState('');
  const lastData = useRef<string | null>(null);

  const goMainDashboard = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            state: { routes: [{ name: 'Dashboard' }], index: 0 },
          },
        ],
      })
    );
  }, [navigation]);

  const handleScan = useCallback(
    (data: string) => {
      const res = bindOfficerFromQR(data);
      if (res.ok) {
        setSuccessMessage(res.message);
        setPhase('success');
        setTimeout(() => goMainDashboard(), 1200);
      } else {
        Alert.alert('Scan failed', res.message);
        lastData.current = null;
      }
    },
    [bindOfficerFromQR, goMainDashboard]
  );

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (phase !== 'scanning') return;
      if (data === lastData.current) return;
      lastData.current = data;
      handleScan(data);
    },
    [phase, handleScan]
  );

  const submitManual = () => {
    if (!manual.trim() || phase !== 'scanning') return;
    lastData.current = manual.trim();
    handleScan(manual.trim());
    setManual('');
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textOnDark} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.info}>Camera access is required to scan your officer ID QR code.</Text>
        <Pressable style={styles.primary} onPress={() => void requestPermission()}>
          <Text style={styles.primaryText}>Grant permission</Text>
        </Pressable>
        <View style={styles.manualBox}>
          <Text style={styles.manualLabel}>Or paste officer token</Text>
          <TextInput
            style={styles.input}
            placeholder="OFFICER:O-101:… or O-101"
            placeholderTextColor={colors.textMuted}
            value={manual}
            onChangeText={setManual}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.secondary} onPress={submitManual}>
            <Text style={styles.secondaryText}>Submit</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const scanningActive = phase === 'scanning';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textOnDark} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable style={styles.torchBtn} onPress={() => setTorchOn((v) => !v)}>
          <Ionicons name={torchOn ? 'flash' : 'flash-outline'} size={22} color={colors.textOnDark} />
        </Pressable>
      </View>

      <Text style={styles.hint}>
        {phase === 'success' ? successMessage : 'Point camera at your officer ID QR code'}
      </Text>

      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanningActive ? onBarcodeScanned : undefined}
        />
        {scanningActive ? (
          <View style={styles.overlay}>
            <View style={styles.frame} />
          </View>
        ) : (
          <View style={styles.successOverlay}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.successText}>{successMessage}</Text>
            <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
          </View>
        )}
      </View>

      {scanningActive ? (
        <View style={styles.manualBox}>
          <Text style={styles.manualLabel}>Manual entry</Text>
          <TextInput
            style={styles.input}
            placeholder="OFFICER:O-101:… or O-101"
            placeholderTextColor={colors.textMuted}
            value={manual}
            onChangeText={setManual}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.secondary} onPress={submitManual}>
            <Text style={styles.secondaryText}>Submit token</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 20 },
    center: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 24, justifyContent: 'center' },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
    backText: { color: c.textOnDark, fontSize: 16, fontWeight: '600' },
    torchBtn: { padding: 8 },
    hint: {
      color: c.textMuted,
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 16,
    },
    cameraWrap: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: c.bgElevated,
      minHeight: 280,
    },
    camera: { flex: 1 },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    frame: {
      width: 220,
      height: 220,
      borderWidth: 2,
      borderColor: 'rgba(59, 130, 246, 0.85)',
      borderRadius: 12,
    },
    successOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.75)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    successText: {
      color: c.textOnDark,
      fontSize: 18,
      fontWeight: '700',
      marginTop: 12,
      textAlign: 'center',
    },
    info: {
      color: c.textMuted,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 24,
    },
    primary: {
      backgroundColor: c.primary,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      marginBottom: 24,
    },
    primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    manualBox: { marginTop: 20, gap: 10 },
    manualLabel: { color: c.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
    input: {
      backgroundColor: c.bgElevated,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      color: c.textOnDark,
      fontSize: 15,
    },
    secondary: {
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryText: { color: c.textOnDark, fontWeight: '700', fontSize: 15 },
  });
}
