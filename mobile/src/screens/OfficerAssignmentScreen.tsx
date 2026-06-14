import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { ApiDevice } from '../lib/api-client';
import { listDevices } from '../lib/api-client';
import type { ThemeColors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';

export function OfficerAssignmentScreen({ onAssigned }: { onAssigned?: () => void }) {
  const { colors, ui } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { assignDeviceToOfficer } = usePatrol();
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listDevices();
      setDevices(res.devices);
    } catch {
      setError('Unable to load devices.');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAssign = async () => {
    if (selectedId == null) {
      setError('Select a device.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await assignDeviceToOfficer(selectedId);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onAssigned?.();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Assign device & site</Text>
      <Text style={styles.sub}>
        Choose the handset you are using. Your admin can also assign you from the dashboard.
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.list} nestedScrollEnabled>
          {devices.length === 0 ? (
            <Text style={styles.empty}>No devices available.</Text>
          ) : (
            devices.map((device) => {
              const selected = selectedId === device.id;
              return (
                <Pressable
                  key={device.id}
                  style={[styles.deviceRow, selected && styles.deviceRowOn]}
                  onPress={() => setSelectedId(device.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text style={styles.deviceName}>{device.deviceName}</Text>
                  <Text style={styles.deviceMeta}>
                    {device.site?.name ?? `Site #${device.siteId}`} · IMEI {device.imeiNumber}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[ui.btnPrimary, (submitting || loading) && ui.btnDisabled]}
        onPress={() => void handleAssign()}
        disabled={submitting || loading}
      >
        {submitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={ui.btnPrimaryText}>Assign device & site</Text>
        )}
      </Pressable>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.lg,
    },
    title: {
      ...typography.titleSm,
      color: c.textOnCard,
    },
    sub: {
      ...typography.bodySm,
      color: c.textMutedOnCard,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    loader: { marginVertical: spacing.lg },
    list: { maxHeight: 220, marginBottom: spacing.md },
    empty: {
      ...typography.bodySm,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    deviceRow: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: c.cardSecondary,
    },
    deviceRowOn: {
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    deviceName: {
      ...typography.label,
      color: c.textOnCard,
    },
    deviceMeta: {
      ...typography.caption,
      color: c.textMutedOnCard,
      marginTop: spacing.xs,
    },
    error: {
      ...typography.bodySm,
      color: c.danger,
      marginBottom: spacing.sm,
    },
  });
}
