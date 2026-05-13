import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';

export function DevicesTabScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { deviceId } = usePatrol();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Devices</Text>
      <Text style={styles.sub}>This handset is registered for field patrol.</Text>
      <View style={styles.card}>
        <Ionicons name="hardware-chip" size={28} color={colors.primary} />
        <Text style={styles.cardTitle}>Patrol device</Text>
        <Text
          style={[
            styles.mono,
            { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
          ]}
        >
          {deviceId}
        </Text>
        <Text style={styles.small}>Last sync: live (demo)</Text>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, padding: 20 },
    title: { color: c.textOnDark, fontSize: 24, fontWeight: '800' },
    sub: { color: c.textMuted, marginTop: 6, marginBottom: 20 },
    card: {
      backgroundColor: c.bgElevated,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      gap: 8,
    },
    cardTitle: { color: c.textOnDark, fontSize: 18, fontWeight: '700', marginTop: 4 },
    mono: { color: c.textMuted, fontSize: 14 },
    small: { color: c.textMuted, fontSize: 12, marginTop: 8 },
  });
}
