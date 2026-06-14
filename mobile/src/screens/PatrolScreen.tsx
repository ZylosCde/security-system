import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { PatrolStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { OfficerAssignmentScreen } from './OfficerAssignmentScreen';
import { rootNavigationRef } from '../navigation/rootNavigationRef';

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'PatrolHome'>;

export function PatrolScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors, ui } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    session,
    officer,
    route,
    checkpoints,
    scannedIds,
    beginPatrol,
    siteId,
    siteName,
    apiError,
    progressPercent,
    nextCheckpointId,
    checkpointStatusById,
    refreshPatrolState,
    addPatrolIncidentNote,
    patrolIncidents,
  } = usePatrol();
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [incidentNote, setIncidentNote] = useState('');

  const total = route.checkpoints.length;
  const completed = scannedIds.length;
  const patrolActive = session?.status === 'in-progress';
  const patrolComplete = session?.status === 'completed' || (total > 0 && completed >= total);

  const orderedCheckpoints = useMemo(
    () =>
      route.checkpoints
        .map((id) => checkpoints.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c),
    [route.checkpoints, checkpoints]
  );

  const handleStartPatrol = async () => {
    setStarting(true);
    const res = await beginPatrol();
    setStarting(false);
    if (!res.ok) {
      Alert.alert('Cannot start patrol', res.message);
      return;
    }
    navigation.navigate('ScanCheckpoint');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPatrolState();
    setRefreshing(false);
  };

  const handleAddIncident = () => {
    const trimmed = incidentNote.trim();
    if (!trimmed) return;
    addPatrolIncidentNote(trimmed);
    setIncidentNote('');
  };

  if (!officer) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={ui.muted}>Not signed in</Text>
        <Pressable style={[ui.btnPrimary, styles.centerBtn]} onPress={() => rootNavigationRef.navigate('Auth')}>
          <Text style={ui.btnPrimaryText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (siteId == null) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]}
      >
        <OfficerAssignmentScreen />
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Patrols</Text>
        <Text style={styles.headerSub}>{siteName ?? route.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={ui.card}>
          <Text style={styles.sectionLabel}>Progress</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressValue}>
              {completed} of {total} checkpoints
            </Text>
            <Text style={styles.progressPct}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          {patrolComplete ? (
            <Text style={styles.completeNote}>Patrol completed for this site.</Text>
          ) : null}
        </View>

        {apiError ? (
          <View style={[ui.alertError, styles.blockGap]}>
            <Text style={ui.alertErrorText}>{apiError}</Text>
          </View>
        ) : null}

        {!patrolActive && !patrolComplete ? (
          <Pressable
            style={[ui.btnPrimary, styles.blockGap, (starting || total === 0) && ui.btnDisabled]}
            onPress={() => void handleStartPatrol()}
            disabled={starting || total === 0}
          >
            {starting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={ui.btnPrimaryText}>Start patrol</Text>
            )}
          </Pressable>
        ) : null}

        {patrolActive && !patrolComplete ? (
          <>
            <View style={[ui.section, styles.blockGap]}>
              {orderedCheckpoints.map((cp, index) => {
                const status = checkpointStatusById[cp.id] ?? 'pending';
                const isNext = cp.id === nextCheckpointId;
                const isLast = index === orderedCheckpoints.length - 1;
                return (
                  <View
                    key={cp.id}
                    style={[styles.listRow, isLast && styles.listRowLast]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        status === 'completed' && styles.statusDone,
                        isNext && styles.statusNext,
                      ]}
                    />
                    <View style={styles.listBody}>
                      <Text style={styles.listTitle}>{cp.name}</Text>
                      <Text style={styles.listCode}>{cp.code ?? cp.qrToken}</Text>
                    </View>
                    <Text
                      style={[
                        styles.listBadge,
                        status === 'completed' && styles.badgeDone,
                        isNext && styles.badgeNext,
                      ]}
                    >
                      {status === 'completed' ? 'Done' : isNext ? 'Next' : 'Pending'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Pressable
              style={[ui.btnPrimary, styles.blockGap, { flexDirection: 'row', gap: 8, justifyContent: 'center' }]}
              onPress={() => navigation.navigate('ScanCheckpoint')}
            >
              <Ionicons name="qr-code-outline" size={20} color={colors.onPrimary} />
              <Text style={ui.btnPrimaryText}>Scan checkpoint QR</Text>
            </Pressable>

            {/* Violation & Incident Buttons */}
            <View style={[styles.actionRow, styles.blockGap]}>
              <Pressable
                style={[styles.actionBtn, { flex: 1 }]}
                onPress={() => navigation.navigate('Violation')}
              >
                <Text style={styles.actionBtnText}>Log Violation</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { flex: 1 }]}
                onPress={() => navigation.navigate('Incident')}
              >
                <Text style={styles.actionBtnText}>Log Incident</Text>
              </Pressable>
            </View>

            {/* Emergency SOS Button */}
            <Pressable
              style={[ui.btnPrimary, styles.blockGap, { backgroundColor: colors.danger, borderColor: colors.danger, flexDirection: 'row', gap: 8, justifyContent: 'center' }]}
              onPress={() => navigation.navigate('SOS')}
            >
              <Ionicons name="warning" size={20} color="#fff" />
              <Text style={[ui.btnPrimaryText, { color: '#fff', fontWeight: '900' }]}>EMERGENCY SOS</Text>
            </Pressable>
          </>
        ) : null}

        <View style={[ui.card, styles.blockGap]}>
          <View style={styles.incidentHeader}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.incidentTitle}>Report incident</Text>
          </View>
          <Text style={ui.muted}>Saved on this device for now.</Text>
          <TextInput
            style={[ui.input, styles.inputGap]}
            placeholder="Describe what happened..."
            placeholderTextColor={colors.textMuted}
            value={incidentNote}
            onChangeText={setIncidentNote}
            multiline
          />
          <Pressable
            style={[ui.btnSecondary, !incidentNote.trim() && ui.btnDisabled]}
            onPress={handleAddIncident}
            disabled={!incidentNote.trim()}
          >
            <Text style={ui.btnSecondaryText}>Add note</Text>
          </Pressable>
          {patrolIncidents.length > 0 ? (
            <View style={styles.incidentList}>
              {patrolIncidents.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.incidentItem}>
                  <Text style={styles.incidentItemText}>{item.description}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <Pressable
          style={[ui.btnSecondary, styles.blockGap]}
          onPress={() => void handleRefresh()}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={ui.btnSecondaryText}>Refresh patrol state</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xxl,
      backgroundColor: c.bg,
    },
    centerBtn: { marginTop: spacing.lg, paddingHorizontal: spacing.xxxl },
    header: {
      backgroundColor: c.headerBg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    headerTitle: {
      ...typography.titleSm,
      color: c.headerText,
    },
    headerSub: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.8)',
      marginTop: spacing.xs,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl * 2,
    },
    sectionLabel: {
      ...typography.label,
      color: c.textMutedOnCard,
      marginBottom: spacing.sm,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    progressValue: {
      ...typography.bodySm,
      color: c.textOnCard,
      fontWeight: '600',
    },
    progressPct: {
      ...typography.bodySm,
      color: c.primary,
      fontWeight: '600',
    },
    progressTrack: {
      height: 6,
      backgroundColor: c.borderLight,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: c.primary,
      borderRadius: radius.pill,
    },
    completeNote: {
      ...typography.caption,
      color: c.success,
      marginTop: spacing.sm,
    },
    blockGap: { marginBottom: spacing.lg },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
      gap: spacing.md,
    },
    listRowLast: { borderBottomWidth: 0 },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.border,
    },
    statusDone: { backgroundColor: c.success },
    statusNext: { backgroundColor: c.primary },
    listBody: { flex: 1 },
    listTitle: {
      ...typography.label,
      color: c.textOnCard,
    },
    listCode: {
      ...typography.caption,
      color: c.textMutedOnCard,
      marginTop: 2,
    },
    listBadge: {
      ...typography.caption,
      fontWeight: '600',
      color: c.textMuted,
    },
    badgeDone: { color: c.success },
    badgeNext: { color: c.primary },
    incidentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    incidentTitle: {
      ...typography.label,
      fontSize: 16,
      color: c.textOnCard,
    },
    inputGap: { marginTop: spacing.md, marginBottom: spacing.md, minHeight: 88 },
    incidentList: { marginTop: spacing.md, gap: spacing.sm },
    incidentItem: {
      backgroundColor: c.cardSecondary,
      borderRadius: radius.sm,
      padding: spacing.md,
    },
    incidentItemText: {
      ...typography.caption,
      color: c.textMutedOnCard,
      lineHeight: 18,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    actionBtn: {
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 12,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: c.bgElevated,
    },
    actionBtnText: {
      color: c.textOnCard,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
