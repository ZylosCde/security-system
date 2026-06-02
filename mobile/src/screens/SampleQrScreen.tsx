import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { generateRotatingToken } from '../lib/qrService';

export function SampleQrScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { checkpoints } = usePatrol();
  const qrRefs = useRef<Record<string, View | null>>({});

  const shareQr = async (checkpointId: string, name: string) => {
    const node = qrRefs.current[checkpointId];
    if (!node) {
      Alert.alert('Error', 'Could not capture QR image.');
      return;
    }
    try {
      const uri = await captureRef(node, { format: 'png', quality: 1 });
      const dest = `${FileSystem.cacheDirectory}patrol-qr-${checkpointId}.png`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Saved', `QR saved to cache for ${name}. Sharing is not available on this device.`);
        return;
      }
      await Sharing.shareAsync(dest, {
        mimeType: 'image/png',
        dialogTitle: `Share QR — ${name}`,
      });
    } catch {
      Alert.alert('Error', 'Could not share QR image. Try again.');
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Text style={styles.intro}>
        Scan these codes during a patrol session. Tokens rotate every 24 hours — refresh this screen
        for today&apos;s codes.
      </Text>
      {checkpoints.map((cp) => {
        const token = generateRotatingToken(cp.id, cp.premises);
        return (
          <View key={cp.id} style={styles.card}>
            <Text style={styles.cardTitle}>{cp.name}</Text>
            <Text style={styles.cardSub}>{cp.premises} · {cp.id}</Text>
            <View
              style={styles.qrWrap}
              ref={(r) => {
                qrRefs.current[cp.id] = r;
              }}
              collapsable={false}
            >
              <QRCode value={token} size={180} backgroundColor="#fff" color="#0f172a" />
            </View>
            <Text style={styles.token} selectable>
              {token}
            </Text>
            <Pressable
              style={styles.shareBtn}
              onPress={() => void shareQr(cp.id, cp.name)}
              accessibilityRole="button"
              accessibilityLabel={`Share QR for ${cp.name}`}
            >
              <Text style={styles.shareBtnText}>Share QR</Text>
            </Pressable>
          </View>
        );
      })}
      {Platform.OS === 'web' ? (
        <Text style={styles.webNote}>Sharing may be limited on web; use token text for manual entry.</Text>
      ) : null}
    </ScrollView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    intro: { color: c.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 20 },
    card: {
      backgroundColor: c.bgElevated,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
    },
    cardTitle: { color: c.textOnDark, fontSize: 18, fontWeight: '800' },
    cardSub: { color: c.textMuted, fontSize: 13, marginTop: 4, marginBottom: 16 },
    qrWrap: {
      padding: 16,
      backgroundColor: '#fff',
      borderRadius: 12,
      marginBottom: 12,
    },
    token: {
      color: c.textMuted,
      fontSize: 11,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      textAlign: 'center',
      marginBottom: 14,
    },
    shareBtn: {
      backgroundColor: c.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    shareBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    webNote: { color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  });
}
