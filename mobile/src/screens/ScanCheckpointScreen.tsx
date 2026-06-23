import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { PatrolStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { validateQRToken, describeCheckpointScanFailure, parseCheckpointQrValue } from '../lib/qrService';
import { formatLocaleTime } from '../lib/localeFormat';
import { rootNavigationRef } from '../navigation/rootNavigationRef';

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'ScanCheckpoint'>;

type ScanPhase = 'scanning' | 'saving' | 'success' | 'failure';

export function ScanCheckpointScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const {
    submitCheckpointScan,
    checkpoints,
    route: patrolRoute,
    scannedIds,
    officer,
    siteId,
    isOffline,
    setOffline,
    pendingSyncCount,
    flushOfflineQueue,
    completePatrolAndSignOut,
  } = usePatrol();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>('scanning');
  const [torchOn, setTorchOn] = useState(false);
  const [lastCheckpointName, setLastCheckpointName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [manual, setManual] = useState('');
  const [scannedAtByCheckpoint, setScannedAtByCheckpoint] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const lastData = useRef<string | null>(null);

  const routeCheckpointIds = useMemo(
    () => new Set(patrolRoute.checkpoints),
    [patrolRoute.checkpoints]
  );

  const pendingCheckpoints = useMemo(() => {
    return patrolRoute.checkpoints
      .map(id => checkpoints.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c && !scannedIds.includes(c.id));
  }, [patrolRoute.checkpoints, checkpoints, scannedIds]);

  const completedCheckpoints = useMemo(() => {
    return patrolRoute.checkpoints
      .map(id => checkpoints.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c && scannedIds.includes(c.id));
  }, [patrolRoute.checkpoints, checkpoints, scannedIds]);

  const resetScanner = useCallback(() => {
    lastData.current = null;
    setPhase('scanning');
  }, []);

  const goHome = useCallback(() => {
    if (rootNavigationRef.isReady()) {
      rootNavigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              state: { routes: [{ name: 'Home' }], index: 0 },
            },
          ],
        })
      );
    }
  }, []);

  const processScan = useCallback(
    async (data: string) => {
      const trimmed = data.trim();
      const json = parseCheckpointQrValue(trimmed);

      const showFailure = (msg: string) => {
        setStatusMessage(msg);
        setPhase('failure');
        setTimeout(() => {
          setPhase('scanning');
          lastData.current = null;
        }, 2500);
      };

      if (json && siteId != null && json.siteId !== siteId) {
        showFailure('Wrong site: This checkpoint belongs to a different site.');
        return;
      }

      let checkpoint =
        checkpoints.find(
          (c) =>
            c.code?.toLowerCase() === trimmed.toLowerCase() ||
            (c.qrToken?.toLowerCase() ?? '') === trimmed.toLowerCase() ||
            c.id === trimmed ||
            (json ? c.id === String(json.id) : false)
        ) ?? null;

      if (!checkpoint) {
        const qr = validateQRToken(trimmed, checkpoints);
        if (qr.valid && qr.checkpoint) checkpoint = qr.checkpoint;
      }

      if (!checkpoint) {
        const failure = describeCheckpointScanFailure(trimmed, checkpoints);
        showFailure(`${failure.title}: ${failure.message}`);
        return;
      }

      if (!routeCheckpointIds.has(checkpoint.id)) {
        showFailure(`Not on route: ${checkpoint.name} is not on your patrol route.`);
        return;
      }

      if (scannedIds.includes(checkpoint.id)) {
        showFailure(`Already completed: ${checkpoint.name} was already scanned.`);
        return;
      }

      setPhase('saving');
      const scannedAt = new Date();
      const res = await submitCheckpointScan(checkpoint.id, trimmed);
      if (res.ok) {
        setScannedAtByCheckpoint((prev) => ({
          ...prev,
          [checkpoint.id]: scannedAt.toISOString(),
        }));
        setLastCheckpointName(checkpoint.name);
        setSuccessMessage('Checkpoint successfully completed');
        setPhase('success');
        if (res.allDone) {
          setTimeout(() => {
            void completePatrolAndSignOut().then(goHome);
          }, 1800);
        } else {
          setTimeout(() => {
            setCameraActive(false); // Close camera automatically on success
            resetScanner();
          }, 1800);
        }
      } else {
        showFailure(`Scan failed: ${res.message}`);
      }
    },
    [
      checkpoints,
      routeCheckpointIds,
      scannedIds,
      navigation,
      siteId,
      submitCheckpointScan,
      completePatrolAndSignOut,
      isOffline,
      goHome,
      resetScanner,
    ]
  );

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (phase !== 'scanning') return;
      if (data === lastData.current) return;
      lastData.current = data;
      void processScan(data);
    },
    [phase, processScan]
  );

  const submitManual = () => {
    if (!manual.trim() || phase !== 'scanning') return;
    lastData.current = manual.trim();
    void processScan(manual.trim());
    setManual('');
  };

  const total = patrolRoute.checkpoints.length;
  const completed = scannedIds.length;
  const progress = total > 0 ? completed / total : 0;

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>Camera access is required to scan patrol unit QR codes.</Text>
        <Pressable style={styles.primary} onPress={() => void requestPermission()}>
          <Text style={styles.primaryText}>Grant permission</Text>
        </Pressable>
        <View style={styles.manualBox}>
          <Text style={styles.manualLabel}>Or paste token manually</Text>
          <TextInput
            style={styles.input}
            placeholder="C-01:VISTA Towers:…"
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

  const confirmEndPatrol = () => {
    if (completed < total) {
      Alert.alert(
        'Patrol incomplete',
        `Complete all ${total} checkpoints before ending. (${completed}/${total} done)`
      );
      return;
    }
    Alert.alert('End patrol?', 'All checkpoints are done. Sign out and return home?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () => {
          void completePatrolAndSignOut().then(goHome);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.sessionMeta} numberOfLines={1}>
            {officer?.name ?? 'Patrol'} · {completed} of {total} checkpoints completed
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
          </View>
        </View>
        <View style={styles.offlineWrap}>
          <Text style={styles.offlineLabel}>Offline</Text>
          <Switch
            value={isOffline}
            onValueChange={setOffline}
            trackColor={{ false: colors.surface, true: 'rgba(16, 185, 129, 0.45)' }}
          />
        </View>
      </View>

      {pendingSyncCount > 0 || syncing || syncError ? (
        <Pressable
          style={styles.syncBanner}
          disabled={syncing}
          onPress={() => {
            setSyncError(null);
            setSyncing(true);
            void flushOfflineQueue()
              .then((n) => {
                Alert.alert('Synced', `${n} scan(s) uploaded to server.`);
              })
              .catch((e: unknown) => {
                const msg = e instanceof Error ? e.message : 'Sync failed';
                setSyncError(msg);
              })
              .finally(() => setSyncing(false));
          }}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={colors.warning} style={{ marginRight: 8 }} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.syncText}>
              {syncing
                ? 'Syncing queued scans…'
                : `${pendingSyncCount} queued — tap to sync`}
            </Text>
            {syncError ? (
              <Text style={styles.syncErrorText}>{syncError}</Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}

      {cameraActive ? (
        // ACTIVE CAMERA SCANNER VIEW
        <View style={{ flex: 1 }}>
          <View style={styles.hintRow}>
            <Text style={styles.hint}>
              {scanningActive
                ? 'Scan any checkpoint QR on your route'
                : phase === 'success'
                  ? 'Scan successful!'
                  : phase === 'failure'
                    ? 'Scan failed'
                    : 'Saving checkpoint…'}
            </Text>
            <Pressable
              style={{ padding: 6, backgroundColor: colors.surface, borderRadius: 8 }}
              onPress={() => setCameraActive(false)}
            >
              <Text style={{ color: colors.textOnDark, fontWeight: '700', fontSize: 13 }}>Close Scanner</Text>
            </Pressable>
          </View>

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
                <Pressable
                  style={[styles.torchBtn, torchOn && styles.torchBtnOn]}
                  onPress={() => setTorchOn((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={torchOn ? 'Turn light off' : 'Turn light on'}
                >
                  <Ionicons name={torchOn ? 'flash' : 'flash-outline'} size={26} color="#fff" />
                  <Text style={styles.torchLabel}>{torchOn ? 'Light on' : 'Light'}</Text>
                </Pressable>
              </View>
            ) : null}
            {phase === 'saving' ? (
              <View style={styles.successBanner}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.successTitle}>Verifying scan…</Text>
              </View>
            ) : null}
            {phase === 'success' ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                <Text style={styles.successTitle}>Scan successful</Text>
                <Text style={styles.successBody}>
                  {lastCheckpointName ? `${lastCheckpointName} — ` : ''}
                  {successMessage}
                </Text>
              </View>
            ) : null}
            {phase === 'failure' ? (
              <View style={[styles.successBanner, { backgroundColor: 'rgba(239, 68, 68, 0.92)' }]}>
                <Ionicons name="close-circle" size={48} color="#fff" />
                <Text style={[styles.successTitle, { color: '#fff' }]}>Scan Failed</Text>
                <Text style={styles.successBody}>{statusMessage}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.manualBox}>
            <Text style={styles.manualLabel}>Manual token (low light)</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste full QR payload"
              placeholderTextColor={colors.textMuted}
              value={manual}
              onChangeText={setManual}
              autoCapitalize="none"
            />
            <Pressable style={styles.secondary} onPress={submitManual}>
              <Text style={styles.secondaryText}>Submit token</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // CHECKLIST VIEW WHEN CAMERA IS OFF
        <View style={{ flex: 1 }}>

          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            {/* PENDING CHECKPOINTS */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>
                PENDING POINTS ({pendingCheckpoints.length})
              </Text>
              {pendingCheckpoints.length === 0 ? (
                <Text style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic', paddingLeft: 8 }}>
                  No pending checkpoints
                </Text>
              ) : (
                pendingCheckpoints.map((cp) => (
                  <View key={cp.id} style={[styles.checkpointRow, { marginBottom: 6 }]}>
                    <Ionicons name="ellipse-outline" size={20} color={colors.textMuted} />
                    <View style={styles.checkpointRowText}>
                      <Text style={styles.checkpointName} numberOfLines={1}>{cp.name}</Text>
                      <Text style={styles.checkpointPending}>Not scanned yet</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* COMPLETED CHECKPOINTS */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.success, fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>
                COMPLETED POINTS ({completedCheckpoints.length})
              </Text>
              {completedCheckpoints.length === 0 ? (
                <Text style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic', paddingLeft: 8 }}>
                  No checkpoints completed yet
                </Text>
              ) : (
                completedCheckpoints.map((cp) => {
                  const scannedAt = scannedAtByCheckpoint[cp.id];
                  return (
                    <View key={cp.id} style={[styles.checkpointRow, styles.checkpointRowDone, { marginBottom: 6 }]}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      <View style={styles.checkpointRowText}>
                        <Text style={[styles.checkpointName, styles.checkpointNameDone]} numberOfLines={1}>{cp.name}</Text>
                        <Text style={styles.checkpointTime}>
                          {scannedAt ? formatLocaleTime(new Date(scannedAt)) : 'Completed'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.manualBox}>
              <Text style={styles.manualLabel}>Manual token entry</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste full QR payload"
                placeholderTextColor={colors.textMuted}
                value={manual}
                onChangeText={setManual}
                autoCapitalize="none"
              />
              <Pressable style={styles.secondary} onPress={submitManual}>
                <Text style={styles.secondaryText}>Submit token</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ACTION ROW — ALWAYS SHOW AT BOTTOM */}
      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('Violation')}>
          <Text style={styles.actionBtnText}>Violation</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('Incident')}>
          <Text style={styles.actionBtnText}>Incident</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={confirmEndPatrol}>
          <Text style={styles.actionBtnTextMuted}>End</Text>
        </Pressable>
      </View>

      {/* ── Camera FAB — large bottom-center U-shape button for ergonomic thumb reach ── */}
      {!cameraActive ? (
        <Pressable
          id="scan-camera-fab"
          style={[styles.cameraFab, { bottom: insets.bottom + 76 }]}
          onPress={() => setCameraActive(true)}
          accessibilityRole="button"
          accessibilityLabel="Open QR camera scanner"
        >
          <View style={styles.cameraFabInner}>
            <Ionicons name="scan" size={28} color="#fff" />
          </View>
          <Text style={styles.cameraFabText}>SCAN QR</Text>
        </Pressable>
      ) : null}

      {/* ── SOS FAB — right side ── */}
      <Pressable
        style={[styles.sosFab, { bottom: insets.bottom + 76 }]}
        onPress={() => navigation.navigate('SOS')}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS"
      >
        <Text style={styles.sosFabText}>SOS</Text>
      </Pressable>

      {/* ── Flashlight FAB — left side ── */}
      {!cameraActive ? (
        <Pressable
          style={[styles.lightFab, { bottom: insets.bottom + 76 }]}
          onPress={() => {
            setTorchOn(true);
            setCameraActive(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Turn on flashlight"
        >
          <Ionicons name="flash" size={22} color="#fff" />
        </Pressable>
      ) : null}

      {Platform.OS === 'web' ? (
        <Text style={styles.webNote}>QR scanning in Expo web may be limited; use manual token.</Text>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 16 },
    center: { flex: 1, backgroundColor: c.bg, padding: 24, justifyContent: 'center' },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    topBarLeft: { flex: 1 },
    sessionMeta: { color: c.textOnDark, fontSize: 13, fontWeight: '700', marginBottom: 6 },
    progressTrack: {
      height: 8,
      backgroundColor: c.surface,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: c.primaryLight },
    offlineWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    offlineLabel: { color: c.textMuted, fontSize: 11, fontWeight: '600' },
    syncBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      padding: 10,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.35)',
    },
    syncText: { color: c.warning, fontSize: 12, fontWeight: '700' },
    syncErrorText: { color: c.danger, fontSize: 11, marginTop: 4, fontWeight: '600' },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 8,
    },
    hint: { flex: 1, color: c.textMuted, fontSize: 14 },
    hintLink: { color: c.primaryLight, fontSize: 14, fontWeight: '700' },
    checkpointList: { maxHeight: 120, marginBottom: 8 },
    checkpointListContent: { gap: 6, paddingBottom: 4 },
    checkpointRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: c.bgElevated,
      borderWidth: 1,
      borderColor: c.border,
    },
    checkpointRowDone: {
      borderColor: 'rgba(16, 185, 129, 0.35)',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    checkpointRowText: { flex: 1 },
    checkpointName: { color: c.textOnDark, fontSize: 14, fontWeight: '700' },
    checkpointNameDone: { color: c.success },
    checkpointTime: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    checkpointPending: { color: c.textMuted, fontSize: 11, marginTop: 2, fontStyle: 'italic' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    actionBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 11,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: c.bgElevated,
    },
    actionBtnText: { color: c.textOnDark, fontSize: 13, fontWeight: '700' },
    actionBtnTextMuted: { color: c.textMuted, fontSize: 13, fontWeight: '700' },
    /* Camera FAB — U-shape ergonomic button centered at bottom */
    cameraFab: {
      position: 'absolute',
      alignSelf: 'center',
      left: '50%',
      marginLeft: -56,
      width: 112,
      alignItems: 'center',
      zIndex: 20,
    },
    cameraFabInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOpacity: 0.55,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 16,
      elevation: 14,
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    cameraFabText: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginTop: 4,
    },
    sosFab: {
      position: 'absolute',
      right: 16,
      backgroundColor: c.danger,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 999,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    sosFabText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    lightFab: {
      position: 'absolute',
      left: 16,
      backgroundColor: 'rgba(245, 158, 11, 0.9)',
      padding: 14,
      borderRadius: 999,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    cameraWrap: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
      position: 'relative',
      minHeight: 200,
    },
    camera: { flex: 1, minHeight: 200 },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    frame: {
      width: '72%',
      aspectRatio: 1,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.85)',
      borderRadius: 16,
      backgroundColor: 'transparent',
    },
    torchBtn: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    torchBtnOn: {
      backgroundColor: 'rgba(245, 158, 11, 0.9)',
      borderColor: 'rgba(255,255,255,0.5)',
    },
    torchLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },
    successBanner: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(11, 17, 32, 0.88)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    successTitle: { color: c.success, fontSize: 22, fontWeight: '800', marginTop: 12 },
    successBody: { color: c.textOnDark, fontSize: 15, marginTop: 8, textAlign: 'center' },
    manualBox: { marginTop: 12 },
    manualLabel: { color: c.textMuted, fontSize: 12, marginBottom: 8 },
    input: {
      backgroundColor: c.bgElevated,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      color: c.textOnDark,
      fontSize: 14,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    specialInput: {
      marginTop: 12,
      minHeight: 88,
      fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
    },
    primary: {
      backgroundColor: c.card,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    primaryText: { color: c.textOnCard, fontWeight: '700' },
    secondary: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: c.bgElevated,
    },
    secondaryText: { color: c.textOnDark, fontWeight: '600' },
    info: { color: c.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
    webNote: { color: c.textMuted, fontSize: 12, marginTop: 8, textAlign: 'center', opacity: 0.85 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: c.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 36 : 24,
      maxHeight: '88%',
    },
    modalTitle: { color: c.textOnCard, fontSize: 22, fontWeight: '800' },
    modalSubtitle: { color: c.textMutedOnCard, fontSize: 14, marginTop: 6, marginBottom: 8 },
    commentHeading: {
      color: c.textOnCard,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 10,
    },
    commentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    commentChip: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borderLight,
      backgroundColor: c.cardSecondary,
    },
    commentChipActive: {
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    commentChipText: { color: c.textMutedOnCard, fontSize: 13, fontWeight: '600' },
    commentChipTextActive: { color: c.primary, fontWeight: '800' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.borderLight,
    },
    cancelBtnText: { color: c.textMutedOnCard, fontWeight: '700' },
    confirmBtn: {
      flex: 1.4,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: c.primary,
    },
    confirmBtnDisabled: { opacity: 0.7 },
    confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  });
}
