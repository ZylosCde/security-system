import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PatrolStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { rootNavigationRef } from '../navigation/rootNavigationRef';

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'PatrolHome'>;

export function PatrolScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createPatrolStyles(colors), [colors]);
  const {
    session,
    officer,
    route,
    checkpoints,
    scannedIds,
    isOffline,
    setOffline,
    pendingSyncCount,
    refreshPendingCount,
    beginPatrol,
    endPatrol,
    flushOfflineQueue,
  } = usePatrol();

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  if (!officer) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No officer bound on this device.</Text>
        <Text style={[styles.muted, { marginTop: 10, textAlign: 'center' }]}>
          Open Profile to bind an officer and start patrols.
        </Text>
        <Pressable
          style={[styles.primary, { marginTop: 28, paddingHorizontal: 32 }]}
          onPress={() => rootNavigationRef.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Open profile to bind officer"
        >
          <Text style={styles.primaryText}>Open profile</Text>
        </Pressable>
      </View>
    );
  }

  if (!session) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
        <Text style={styles.kicker}>FIELD PATROL</Text>
        <Text style={styles.title}>Ready when you are</Text>
        <Text style={styles.sub}>
          {officer.name} · {route.name} · {route.checkpoints.length} checkpoints
        </Text>
        <View style={styles.heroCard}>
          <Text style={styles.heroCardTitle}>Start patrol</Text>
          <Text style={styles.heroCardBody}>
            Downloads route tokens for offline checkpoints. SOS stays one tap away during the run.
          </Text>
          <Pressable style={styles.primary} onPress={() => beginPatrol()}>
            <Text style={styles.primaryText}>Begin patrol</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const nextId = route.checkpoints[scannedIds.length];
  const nextCp = checkpoints.find((c) => c.id === nextId);
  const progress = scannedIds.length / route.checkpoints.length;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.meta}>SESSION {session.id}</Text>
        <Text style={styles.officer}>{officer.name}</Text>
        <Text style={styles.route}>{route.name}</Text>

        <View style={styles.rowBar}>
          <Text style={styles.offlineLabel}>Offline mode</Text>
          <Switch
            value={isOffline}
            onValueChange={setOffline}
            trackColor={{ false: colors.surface, true: 'rgba(16, 185, 129, 0.45)' }}
            accessibilityLabel="Toggle offline mode"
          />
        </View>
        {pendingSyncCount > 0 && (
          <Pressable
            style={styles.syncBanner}
            onPress={() => void flushOfflineQueue().then((n) => Alert.alert('Synced', `${n} events uploaded (demo).`))}
            accessibilityRole="button"
          >
            <Text style={styles.syncText}>{pendingSyncCount} queued — tap to sync</Text>
          </Pressable>
        )}

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {scannedIds.length} / {route.checkpoints.length} checkpoints
        </Text>

        {route.checkpoints.map((id) => {
          const cp = checkpoints.find((c) => c.id === id)!;
          const done = scannedIds.includes(id);
          return (
            <View key={id} style={[styles.cpRow, done && styles.cpDone]}>
              <Text style={styles.cpName}>{cp.name}</Text>
              {done ? (
                <Text style={styles.cpStatus}>Done</Text>
              ) : id === nextId ? (
                <Text style={styles.cpNext}>Next</Text>
              ) : null}
            </View>
          );
        })}

        <Pressable
          style={styles.scanBtn}
          onPress={() => navigation.navigate('ScanCheckpoint', { checkpointId: nextCp?.id })}
          disabled={!nextCp}
          accessibilityRole="button"
          accessibilityLabel={nextCp ? `Scan checkpoint ${nextCp.name}` : 'Patrol complete'}
        >
          <Text style={styles.scanBtnText}>{nextCp ? `Scan: ${nextCp.name}` : 'Patrol complete'}</Text>
        </Pressable>
        {__DEV__ && nextCp ? (
          <Text style={styles.devToken} selectable>
            Demo token: {nextCp.qrToken}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={() => navigation.navigate('Violation')}>
            <Text style={styles.secondaryText}>Violation</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => navigation.navigate('Incident')}>
            <Text style={styles.secondaryText}>Incident</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.endBtn}
          onPress={() => {
            Alert.alert('End patrol?', 'Checkpoint progress will clear. You stay signed in on this device.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'End patrol', style: 'destructive', onPress: () => endPatrol() },
            ]);
          }}
        >
          <Text style={styles.endBtnText}>End patrol</Text>
        </Pressable>
      </ScrollView>

      <Pressable
        style={styles.sosFab}
        onPress={() => navigation.navigate('SOS')}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS"
      >
        <Text style={styles.sosFabText}>SOS</Text>
      </Pressable>
    </View>
  );
}

function createPatrolStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: c.bg },
    muted: { color: c.textMuted, textAlign: 'center' },
    scroll: { padding: 20, paddingBottom: 120 },
    kicker: { color: c.primaryLight, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
    title: { color: c.textOnDark, fontSize: 28, fontWeight: '800', marginTop: 8 },
    sub: { color: c.textMuted, fontSize: 15, marginTop: 8, lineHeight: 22 },
    heroCard: {
      marginTop: 28,
      padding: 22,
      borderRadius: 18,
      backgroundColor: c.bgElevated,
      borderWidth: 1,
      borderColor: c.border,
    },
    heroCardTitle: { color: c.textOnDark, fontSize: 20, fontWeight: '800' },
    heroCardBody: { color: c.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18 },
    primary: {
      backgroundColor: c.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    meta: { color: c.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '600' },
    officer: { color: c.textOnDark, fontSize: 26, fontWeight: '800', marginTop: 4 },
    route: { color: c.textMuted, fontSize: 15, marginTop: 4, marginBottom: 20 },
    rowBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    offlineLabel: { color: c.textOnDark, fontSize: 15 },
    syncBanner: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.35)',
    },
    syncText: { color: c.warning, fontSize: 13, fontWeight: '700' },
    progressTrack: {
      height: 6,
      backgroundColor: c.surface,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: { height: '100%', backgroundColor: c.primaryLight },
    progressLabel: { color: c.textMuted, fontSize: 12, marginBottom: 16 },
    cpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    cpDone: { opacity: 0.55 },
    cpName: { color: c.textOnDark, fontSize: 16 },
    cpStatus: { color: c.success, fontSize: 13, fontWeight: '700' },
    cpNext: { color: c.primaryLight, fontSize: 13, fontWeight: '700' },
    scanBtn: {
      backgroundColor: c.card,
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    scanBtnText: { color: c.textOnCard, fontSize: 16, fontWeight: '800' },
    devToken: {
      marginTop: 10,
      fontSize: 10,
      color: c.textMuted,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    secondary: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: c.bgElevated,
    },
    secondaryText: { color: c.textOnDark, fontSize: 15, fontWeight: '700' },
    endBtn: { marginTop: 24, alignItems: 'center', padding: 12 },
    endBtnText: { color: c.textMuted, fontSize: 15 },
    sosFab: {
      position: 'absolute',
      right: 20,
      bottom: 28,
      backgroundColor: c.danger,
      paddingHorizontal: 28,
      paddingVertical: 18,
      borderRadius: 999,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    sosFabText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  });
}
