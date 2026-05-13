import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { RootStackParamList } from '../navigation/types';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ScanCheckpoint'>;
type RProp = RouteProp<RootStackParamList, 'ScanCheckpoint'>;

export function ScanCheckpointScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RProp>();
  const { submitCheckpointScan, checkpoints } = usePatrol();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const lastData = useRef<string | null>(null);
  const cooldown = useRef(false);

  const checkpointId = route.params?.checkpointId;

  const handlePayload = useCallback(
    (data: string) => {
      if (cooldown.current) return;
      const parts = data.split(':');
      if (parts.length < 3) {
        Alert.alert('Invalid QR', 'Expected format checkpointId:premises:token');
        return;
      }
      const cpId = parts[0];
      const targetId = checkpointId ?? cpId;
      const res = submitCheckpointScan(targetId, data.trim());
      if (res.ok) {
        cooldown.current = true;
        Alert.alert('Verified', res.message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        setTimeout(() => {
          cooldown.current = false;
        }, 1500);
      } else {
        Alert.alert('Scan failed', res.message);
      }
    },
    [checkpointId, submitCheckpointScan, navigation]
  );

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (data === lastData.current) return;
      lastData.current = data;
      handlePayload(data);
    },
    [handlePayload]
  );

  const submitManual = () => {
    if (!manual.trim()) return;
    handlePayload(manual.trim());
    setManual('');
  };

  const cp = checkpointId ? checkpoints.find((c) => c.id === checkpointId) : null;

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>Camera access is required to scan checkpoint QR codes.</Text>
        <Pressable style={styles.primary} onPress={() => void requestPermission()}>
          <Text style={styles.primaryText}>Grant permission</Text>
        </Pressable>
        {cp && (
          <View style={styles.manualBox}>
            <Text style={styles.manualLabel}>Or paste token for {cp.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="C-01:VISTA Towers:…"
              placeholderTextColor="#52525b"
              value={manual}
              onChangeText={setManual}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable style={styles.secondary} onPress={submitManual}>
              <Text style={styles.secondaryText}>Submit</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>
        {cp ? `Scanning for ${cp.name}` : 'Point at checkpoint QR'}
      </Text>
      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        />
      </View>
      <View style={styles.manualBox}>
        <Text style={styles.manualLabel}>Manual token (demo / low light)</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste full QR payload"
          placeholderTextColor="#52525b"
          value={manual}
          onChangeText={setManual}
          autoCapitalize="none"
        />
        <Pressable style={styles.secondary} onPress={submitManual}>
          <Text style={styles.secondaryText}>Submit token</Text>
        </Pressable>
      </View>
      {Platform.OS === 'web' ? (
        <Text style={styles.webNote}>QR scanning in Expo web may be limited; use manual token.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b', padding: 16 },
  center: { flex: 1, backgroundColor: '#09090b', padding: 24, justifyContent: 'center' },
  hint: { color: '#a1a1aa', marginBottom: 12, fontSize: 15 },
  cameraWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  camera: { flex: 1, minHeight: 280 },
  manualBox: { marginTop: 16 },
  manualLabel: { color: '#71717a', fontSize: 12, marginBottom: 8 },
  input: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 14,
    color: '#fafafa',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  primary: {
    backgroundColor: '#fafafa',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: { color: '#09090b', fontWeight: '700' },
  secondary: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: { color: '#e4e4e7', fontWeight: '600' },
  info: { color: '#a1a1aa', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  webNote: { color: '#52525b', fontSize: 12, marginTop: 8, textAlign: 'center' },
});
