import React, { useEffect } from 'react';
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
import type { RootStackParamList } from '../navigation/types';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Patrol'>;

export function PatrolScreen() {
  const navigation = useNavigation<Nav>();
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
    endPatrol,
    flushOfflineQueue,
  } = usePatrol();

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!session) {
      navigation.replace('Welcome');
    }
  }, [session, navigation]);

  if (!session || !officer) return null;

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
          <Switch value={isOffline} onValueChange={setOffline} trackColor={{ false: '#3f3f46', true: '#14532d' }} />
        </View>
        {pendingSyncCount > 0 && (
          <Pressable style={styles.syncBanner} onPress={() => void flushOfflineQueue().then((n) => Alert.alert('Synced', `${n} events uploaded (demo).`))}>
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
              {done ? <Text style={styles.cpStatus}>Done</Text> : id === nextId ? <Text style={styles.cpNext}>Next</Text> : null}
            </View>
          );
        })}

        <Pressable
          style={styles.scanBtn}
          onPress={() => navigation.navigate('ScanCheckpoint', { checkpointId: nextCp?.id })}
          disabled={!nextCp}
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
            Alert.alert('End session?', 'You will return to the home screen.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'End', style: 'destructive', onPress: () => { endPatrol(); navigation.replace('Welcome'); } },
            ]);
          }}
        >
          <Text style={styles.endBtnText}>End patrol</Text>
        </Pressable>
      </ScrollView>

      <Pressable style={styles.sosFab} onPress={() => navigation.navigate('SOS')}>
        <Text style={styles.sosFabText}>SOS</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  scroll: { padding: 20, paddingBottom: 120 },
  meta: { color: '#52525b', fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  officer: { color: '#fafafa', fontSize: 26, fontWeight: '700', marginTop: 4 },
  route: { color: '#a1a1aa', fontSize: 15, marginTop: 4, marginBottom: 20 },
  rowBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offlineLabel: { color: '#d4d4d8', fontSize: 15 },
  syncBanner: {
    backgroundColor: '#422006',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  syncText: { color: '#fbbf24', fontSize: 13, fontWeight: '600' },
  progressTrack: {
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#34d399' },
  progressLabel: { color: '#71717a', fontSize: 12, marginBottom: 16 },
  cpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272a',
  },
  cpDone: { opacity: 0.55 },
  cpName: { color: '#e4e4e7', fontSize: 16 },
  cpStatus: { color: '#34d399', fontSize: 13, fontWeight: '600' },
  cpNext: { color: '#38bdf8', fontSize: 13, fontWeight: '600' },
  scanBtn: {
    backgroundColor: '#fafafa',
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  scanBtnText: { color: '#09090b', fontSize: 16, fontWeight: '600' },
  devToken: {
    marginTop: 10,
    fontSize: 10,
    color: '#52525b',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: { color: '#e4e4e7', fontSize: 15, fontWeight: '600' },
  endBtn: { marginTop: 24, alignItems: 'center', padding: 12 },
  endBtnText: { color: '#71717a', fontSize: 15 },
  sosFab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    backgroundColor: '#dc2626',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  sosFabText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
