import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { PatrolStackParamList } from '../navigation/types';
import { FieldTheme } from '../theme/fieldTheme';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'SOSActive'>;

const LOG = [
  { id: '1', who: 'Control Center Alpha', what: 'Alarm Received', time: '14:32' },
  { id: '2', who: 'Supervisor Roberts', what: 'Notified via Mobile', time: '14:33' },
  { id: '3', who: 'Dispatch Unit 04', what: 'En Route to Location', time: '14:35' },
];

export function SOSActiveScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { officer, cancelSOS } = usePatrol();

  const onLongCancel = () => {
    Alert.alert('Cancel SOS?', 'Confirm this was a false alarm.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: () => {
          cancelSOS();
          navigation.popToTop();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.kicker}>EMERGENCY PROTOCOL</Text>
      <View style={styles.iconRing}>
        <Ionicons name="shield" size={36} color="#fff" />
      </View>
      <Text style={styles.title}>SOS ACTIVE</Text>
      <View style={styles.liveRow}>
        <View style={styles.redDot} />
        <Text style={styles.liveText}>BROADCASTING LOCATION EVERY 30S</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>ACTIVE PERSONNEL</Text>
        <Text style={styles.name}>{officer?.name ?? 'Officer'}</Text>
        <View style={styles.liveBadge}>
          <Ionicons name="radio" size={12} color={FieldTheme.success} />
          <Text style={styles.liveBadgeTxt}>Live</Text>
        </View>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>CURRENT COORDINATES</Text>
          <Text style={styles.coordVal}>6.9270° N, 79.8610° E</Text>
          <Ionicons name="navigate" size={18} color={FieldTheme.primary} style={{ marginLeft: 8 }} />
        </View>
      </View>

      <Pressable style={styles.cancelBtn} onLongPress={onLongCancel} delayLongPress={600}>
        <Ionicons name="close" size={22} color={FieldTheme.textOnCard} />
        <Text style={styles.cancelBtnText}>CANCEL SOS SIGNAL</Text>
      </Pressable>
      <Text style={styles.hint}>Long-press to confirm false alarm cancellation.</Text>

      <Text style={styles.logHeader}>PROTOCOL RESPONSE LOG · {LOG.length} Notifications</Text>
      {LOG.map((e) => (
        <View key={e.id} style={styles.logRow}>
          <Ionicons name="person-circle-outline" size={22} color={FieldTheme.textMuted} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.logWho}>{e.who}</Text>
            <Text style={styles.logWhat}>{e.what}</Text>
          </View>
          <Text style={styles.logTime}>{e.time}</Text>
        </View>
      ))}

      <View style={styles.banner}>
        <Ionicons name="checkmark-circle" size={18} color="#fecaca" />
        <Text style={styles.bannerTxt}>
          A response unit has been dispatched. Remain at your coordinates if safe.
        </Text>
      </View>

      <View style={styles.brand}>
        <Ionicons name="shield-checkmark" size={16} color={FieldTheme.textMuted} />
        <Text style={styles.brandTxt}> AEGIS PATROL</Text>
      </View>
      <Text style={styles.secure}>Secure protocol — encrypted channel (demo)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
  kicker: { color: FieldTheme.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  iconRing: {
    alignSelf: 'center',
    marginTop: 16,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: FieldTheme.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  liveRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, gap: 8 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: FieldTheme.danger },
  liveText: { color: '#fca5a5', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  card: {
    marginTop: 24,
    backgroundColor: FieldTheme.bgElevated,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: FieldTheme.border,
  },
  cardLabel: { color: FieldTheme.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 6 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveBadgeTxt: { color: FieldTheme.success, fontSize: 11, fontWeight: '700' },
  coordRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, flexWrap: 'wrap' },
  coordLabel: { color: FieldTheme.textMuted, fontSize: 10, width: '100%', marginBottom: 4 },
  coordVal: { color: '#fff', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  cancelBtn: {
    marginTop: 28,
    backgroundColor: FieldTheme.card,
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cancelBtnText: { color: FieldTheme.textOnCard, fontSize: 16, fontWeight: '800' },
  hint: { color: FieldTheme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10 },
  logHeader: { color: FieldTheme.textMuted, fontSize: 11, fontWeight: '800', marginTop: 28, marginBottom: 12 },
  logRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  logWho: { color: '#fff', fontWeight: '700', fontSize: 14 },
  logWhat: { color: FieldTheme.textMuted, fontSize: 12, marginTop: 2 },
  logTime: { color: FieldTheme.textMuted, fontSize: 12, fontVariant: ['tabular-nums'] },
  banner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: FieldTheme.dangerDeep,
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  bannerTxt: { flex: 1, color: '#fecdd3', fontSize: 13, lineHeight: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  brandTxt: { color: FieldTheme.textOnDark, fontWeight: '800', fontSize: 13 },
  secure: { color: FieldTheme.textMuted, fontSize: 10, textAlign: 'center', marginTop: 6 },
});
