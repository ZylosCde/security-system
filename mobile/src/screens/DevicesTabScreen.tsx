import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FieldTheme } from '../theme/fieldTheme';
import { usePatrol } from '../context/PatrolContext';

export function DevicesTabScreen() {
  const { deviceId } = usePatrol();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Devices</Text>
      <Text style={styles.sub}>This handset is registered for field patrol.</Text>
      <View style={styles.card}>
        <Ionicons name="hardware-chip" size={28} color={FieldTheme.primary} />
        <Text style={styles.cardTitle}>Patrol device</Text>
        <Text style={[styles.mono, { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) }]}>
          {deviceId}
        </Text>
        <Text style={styles.small}>Last sync: live (demo)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FieldTheme.bg, padding: 20 },
  title: { color: FieldTheme.textOnDark, fontSize: 24, fontWeight: '800' },
  sub: { color: FieldTheme.textMuted, marginTop: 6, marginBottom: 20 },
  card: {
    backgroundColor: FieldTheme.bgElevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: FieldTheme.border,
    gap: 8,
  },
  cardTitle: { color: FieldTheme.textOnDark, fontSize: 18, fontWeight: '700', marginTop: 4 },
  mono: { color: FieldTheme.textMuted, fontSize: 14 },
  small: { color: FieldTheme.textMuted, fontSize: 12, marginTop: 8 },
});
