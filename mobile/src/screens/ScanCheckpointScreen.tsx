import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
  Modal,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { PatrolStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import type { Checkpoint } from '../types';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { validateQRToken, describeCheckpointScanFailure } from '../lib/qrService';
import {
  formatCoordinates,
  formatLocaleDateOnly,
  formatLocaleTime,
} from '../lib/localeFormat';

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'ScanCheckpoint'>;

type ScanPhase = 'scanning' | 'review' | 'saving' | 'success';

type PendingScan = {
  qrData: string;
  checkpoint: Checkpoint;
  scannedAt: Date;
};

const CONDITION_OPTIONS = [
  { id: 'good', label: 'Looks good' },
  { id: 'routine', label: 'Routine check complete' },
  { id: 'issue', label: 'Something needs attention' },
  { id: 'custom', label: 'Add custom note' },
] as const;

type ConditionId = (typeof CONDITION_OPTIONS)[number]['id'];

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
    isOffline,
    setOffline,
    pendingSyncCount,
    flushOfflineQueue,
    endPatrol,
  } = usePatrol();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>('scanning');
  const [torchOn, setTorchOn] = useState(false);
  const [pending, setPending] = useState<PendingScan | null>(null);
  const [conditionId, setConditionId] = useState<ConditionId>('good');
  const [customNote, setCustomNote] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [manual, setManual] = useState('');
  const [scannedAtByCheckpoint, setScannedAtByCheckpoint] = useState<Record<string, string>>({});
  const lastData = useRef<string | null>(null);

  const routeCheckpointIds = useMemo(
    () => new Set(patrolRoute.checkpoints),
    [patrolRoute.checkpoints]
  );

  const resetScanner = useCallback(() => {
    lastData.current = null;
    setPending(null);
    setConditionId('good');
    setCustomNote('');
    setPhase('scanning');
  }, []);

  const resolveConditionText = useCallback((): string | null => {
    if (conditionId === 'custom') {
      const t = customNote.trim();
      return t.length > 0 ? t : null;
    }
    return CONDITION_OPTIONS.find((o) => o.id === conditionId)?.label ?? null;
  }, [conditionId, customNote]);

  const openReview = useCallback(
    (data: string) => {
      const trimmed = data.trim();
      const qr = validateQRToken(trimmed, checkpoints);
      if (!qr.valid || !qr.checkpoint) {
        const failure = describeCheckpointScanFailure(trimmed, checkpoints);
        Alert.alert(
          failure.title,
          failure.message,
          failure.canOpenSampleQr
            ? [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Test checkpoint QRs', onPress: () => navigation.navigate('SampleQr') },
              ]
            : [{ text: 'OK' }]
        );
        lastData.current = null;
        return;
      }

      if (!routeCheckpointIds.has(qr.checkpoint.id)) {
        Alert.alert('Not on route', `${qr.checkpoint.name} is not on your assigned patrol route.`);
        lastData.current = null;
        return;
      }

      if (scannedIds.includes(qr.checkpoint.id)) {
        Alert.alert('Already saved', `${qr.checkpoint.name} was already recorded.`);
        lastData.current = null;
        return;
      }

      setPending({ qrData: trimmed, checkpoint: qr.checkpoint, scannedAt: new Date() });
      setConditionId('good');
      setCustomNote('');
      setPhase('review');
    },
    [checkpoints, routeCheckpointIds, scannedIds, navigation]
  );

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (phase !== 'scanning') return;
      if (data === lastData.current) return;
      lastData.current = data;
      openReview(data);
    },
    [phase, openReview]
  );

  const handleConfirm = useCallback(() => {
    if (!pending) return;
    const comment = resolveConditionText();
    if (!comment) {
      Alert.alert('Condition required', 'Select a condition or type your custom note.');
      return;
    }

    setPhase('saving');
    const res = submitCheckpointScan(pending.checkpoint.id, pending.qrData, { comment });
    if (res.ok) {
      setScannedAtByCheckpoint((prev) => ({
        ...prev,
        [pending.checkpoint.id]: pending.scannedAt.toISOString(),
      }));
      setSuccessMessage(res.message);
      setPhase('success');
      const patrolDone = scannedIds.length + 1 >= patrolRoute.checkpoints.length;
      setTimeout(() => {
        if (patrolDone) {
          navigation.replace('PatrolHome');
        } else {
          resetScanner();
        }
      }, 1800);
    } else {
      setPhase('review');
      Alert.alert('Could not save', res.message);
    }
  }, [
    pending,
    resolveConditionText,
    submitCheckpointScan,
    scannedIds.length,
    patrolRoute.checkpoints.length,
    navigation,
    resetScanner,
  ]);

  const cancelReview = () => {
    resetScanner();
  };

  const submitManual = () => {
    if (!manual.trim() || phase !== 'scanning') return;
    lastData.current = manual.trim();
    openReview(manual.trim());
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
    Alert.alert('End patrol?', 'Progress will clear. You stay signed in on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End patrol',
        style: 'destructive',
        onPress: () => {
          endPatrol();
          navigation.replace('PatrolHome');
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
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

      {pendingSyncCount > 0 ? (
        <Pressable
          style={styles.syncBanner}
          onPress={() =>
            void flushOfflineQueue().then((n) => Alert.alert('Synced', `${n} events uploaded (demo).`))
          }
        >
          <Text style={styles.syncText}>{pendingSyncCount} queued — tap to sync</Text>
        </Pressable>
      ) : null}

      <View style={styles.hintRow}>
        <Text style={styles.hint}>
          {scanningActive
            ? 'Scan any checkpoint QR on your route'
            : phase === 'success'
              ? 'Saved — ready for next scan'
              : 'Review scan details'}
        </Text>
        {scanningActive ? (
          <Pressable
            onPress={() => navigation.navigate('SampleQr')}
            accessibilityRole="button"
            accessibilityLabel="Open test checkpoint QR codes"
          >
            <Text style={styles.hintLink}>Test QRs</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.checkpointList}
        contentContainerStyle={styles.checkpointListContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {patrolRoute.checkpoints.map((cpId) => {
          const cp = checkpoints.find((c) => c.id === cpId);
          if (!cp) return null;
          const done = scannedIds.includes(cpId);
          const scannedAt = scannedAtByCheckpoint[cpId];
          return (
            <View key={cpId} style={[styles.checkpointRow, done && styles.checkpointRowDone]}>
              <Ionicons
                name={done ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={done ? colors.success : colors.textMuted}
              />
              <View style={styles.checkpointRowText}>
                <Text style={[styles.checkpointName, done && styles.checkpointNameDone]} numberOfLines={1}>
                  {cp.name}
                </Text>
                {done && scannedAt ? (
                  <Text style={styles.checkpointTime}>{formatLocaleTime(new Date(scannedAt))}</Text>
                ) : (
                  <Text style={styles.checkpointPending}>Not scanned</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

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
        {phase === 'success' ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.successTitle}>Successful</Text>
            <Text style={styles.successBody}>{successMessage}</Text>
          </View>
        ) : null}
      </View>

      {scanningActive ? (
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
      ) : null}

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

      <Pressable
        style={styles.sosFab}
        onPress={() => navigation.navigate('SOS')}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS"
      >
        <Text style={styles.sosFabText}>SOS</Text>
      </Pressable>

      <Modal visible={phase === 'review' || phase === 'saving'} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Checkpoint scanned</Text>
              <Text style={styles.modalSubtitle}>Select a condition and submit to record this scan.</Text>

              {pending ? (
                <>
                  <DetailRow label="Location" value={pending.checkpoint.name} />
                  <DetailRow label="Premises" value={pending.checkpoint.premises} />
                  <DetailRow label="Date" value={formatLocaleDateOnly(pending.scannedAt)} />
                  <DetailRow label="Time" value={formatLocaleTime(pending.scannedAt)} />
                  <DetailRow
                    label="Coordinates"
                    value={formatCoordinates(pending.checkpoint.lat, pending.checkpoint.lng)}
                  />
                  <DetailRow label="Latitude" value={String(pending.checkpoint.lat)} />
                  <DetailRow label="Longitude" value={String(pending.checkpoint.lng)} />

                  <Text style={styles.commentHeading}>Condition</Text>
                  <View style={styles.commentGrid}>
                    {CONDITION_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.id}
                        style={[
                          styles.commentChip,
                          conditionId === opt.id && styles.commentChipActive,
                        ]}
                        onPress={() => setConditionId(opt.id)}
                      >
                        <Text
                          style={[
                            styles.commentChipText,
                            conditionId === opt.id && styles.commentChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {conditionId === 'custom' ? (
                    <TextInput
                      style={[styles.input, styles.specialInput]}
                      placeholder="Type your note…"
                      placeholderTextColor={colors.textMuted}
                      value={customNote}
                      onChangeText={setCustomNote}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  ) : null}

                  <View style={styles.modalActions}>
                    <Pressable style={styles.cancelBtn} onPress={cancelReview} disabled={phase === 'saving'}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.confirmBtn, phase === 'saving' && styles.confirmBtnDisabled]}
                      onPress={handleConfirm}
                      disabled={phase === 'saving'}
                    >
                      {phase === 'saving' ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.confirmBtnText}>Submit</Text>
                      )}
                    </Pressable>
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {Platform.OS === 'web' ? (
        <Text style={styles.webNote}>QR scanning in Expo web may be limited; use manual token.</Text>
      ) : null}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createDetailStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function createDetailStyles(c: ThemeColors) {
  return StyleSheet.create({
    row: {
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderLight,
    },
    label: { color: c.textMutedOnCard, fontSize: 12, fontWeight: '600', marginBottom: 4 },
    value: { color: c.textOnCard, fontSize: 16, fontWeight: '700' },
  });
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
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      padding: 10,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.35)',
    },
    syncText: { color: c.warning, fontSize: 12, fontWeight: '700' },
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
    sosFab: {
      position: 'absolute',
      right: 20,
      bottom: 100,
      backgroundColor: c.danger,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 999,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    sosFabText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
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
