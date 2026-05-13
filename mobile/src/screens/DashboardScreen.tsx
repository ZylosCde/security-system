import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList } from '../navigation/types';
import { FieldTheme } from '../theme/fieldTheme';
import { MOCK_FIELD_SESSIONS } from '../data/patrolData';
import { usePatrol } from '../context/PatrolContext';

const { width: W } = Dimensions.get('window');

type TabNav = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TabNav>();
  const { officer, session, route, scannedIds, sosBroadcasting } = usePatrol();
  const [range, setRange] = useState<'today' | 'week'>('today');

  const ownProgress = session ? scannedIds.length / route.checkpoints.length : 0;

  const activeRows = [
    ...(session && officer
      ? [
          {
            id: 'me',
            name: officer.name,
            area: route.name,
            progress: ownProgress,
            self: true,
          },
        ]
      : []),
    ...MOCK_FIELD_SESSIONS.map((m) => ({
      id: m.id,
      name: m.officerName,
      area: m.area,
      progress: m.progress,
      self: false,
    })),
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.dashTitle}>Dashboard</Text>
        <View style={styles.topIcons}>
          <Ionicons name="notifications-outline" size={24} color={FieldTheme.textOnDark} />
          <Ionicons name="settings-outline" size={24} color={FieldTheme.textOnDark} style={{ marginLeft: 16 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {sosBroadcasting && (
          <Pressable
            style={styles.sosBanner}
            onPress={() => navigation.navigate('Patrols', { screen: 'SOSActive' })}
          >
            <Ionicons name="warning" size={20} color="#fff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.sosTitle}>ACTIVE SOS ALERT</Text>
              <Text style={styles.sosSub}>
                {officer?.name ?? 'Officer'} — broadcasting location
              </Text>
            </View>
            <Text style={styles.sosView}>View</Text>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Facility Overview</Text>
        <View style={styles.segment}>
          <Pressable
            style={[styles.segBtn, range === 'today' && styles.segOn]}
            onPress={() => setRange('today')}
          >
            <Text style={[styles.segTxt, range === 'today' && styles.segTxtOn]}>Today</Text>
          </Pressable>
          <Pressable
            style={[styles.segBtn, range === 'week' && styles.segOn]}
            onPress={() => setRange('week')}
          >
            <Text style={[styles.segTxt, range === 'week' && styles.segTxtOn]}>This Week</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
          <View style={styles.statCard}>
            <Ionicons name="shield-checkmark" size={22} color={FieldTheme.primary} />
            <Text style={styles.statNum}>14</Text>
            <Text style={styles.statLbl}>ACTIVE PATROLS</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={22} color={FieldTheme.danger} />
            <Text style={styles.statNum}>03</Text>
            <Text style={styles.statLbl}>OPEN VIOLATIONS</Text>
            <View style={styles.badgePlus}>
              <Text style={styles.badgePlusTxt}>+1</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done" size={22} color={FieldTheme.success} />
            <Text style={styles.statNum}>94</Text>
            <Text style={styles.statLbl}>COMPLETED</Text>
          </View>
        </ScrollView>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Ionicons name="location" size={16} color={FieldTheme.primary} />
            <Text style={styles.mapBadge}>LIVE COVERAGE: 85%</Text>
          </View>
          <View style={styles.mapBody}>
            <View style={styles.mapPulse} />
            <View style={styles.mapFab}>
              <Text style={styles.mapFabTxt}>+</Text>
            </View>
            <View style={[styles.mapFab, styles.mapFabMinus]}>
              <Text style={styles.mapFabTxt}>−</Text>
            </View>
          </View>
        </View>

        <View style={styles.sessionsHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="people" size={18} color={FieldTheme.textOnDark} />
            <Text style={styles.sectionTitle}>Active Sessions</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Patrols', { screen: 'PatrolHome' })}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        {activeRows.map((row) => (
          <View key={row.id} style={styles.sessionCard}>
            <View style={styles.avatarCol}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={FieldTheme.primary} />
              </View>
              {row.self && <View style={styles.liveDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionName}>{row.name}</Text>
              <Text style={styles.sessionArea}>{row.area}</Text>
              <View style={styles.pBarTrack}>
                <View style={[styles.pBarFill, { width: `${Math.round(row.progress * 100)}%` }]} />
              </View>
              <View style={styles.sessionFooter}>
                <Text style={styles.details}>Details ›</Text>
              </View>
            </View>
            <View style={styles.pillOutline} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const cardW = Math.min(140, W * 0.38);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FieldTheme.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dashTitle: { color: FieldTheme.textOnDark, fontSize: 28, fontWeight: '800' },
  topIcons: { flexDirection: 'row', alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  sosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FieldTheme.danger,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  sosTitle: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  sosSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
  sosView: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionTitle: { color: FieldTheme.textOnDark, fontSize: 18, fontWeight: '700' },
  segment: {
    flexDirection: 'row',
    backgroundColor: FieldTheme.bgElevated,
    borderRadius: 10,
    padding: 4,
    marginTop: 12,
    marginBottom: 16,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  segOn: { backgroundColor: FieldTheme.primary },
  segTxt: { color: FieldTheme.textMuted, fontWeight: '600', fontSize: 14 },
  segTxtOn: { color: '#fff' },
  cardsRow: { gap: 12, paddingVertical: 4 },
  statCard: {
    width: cardW,
    backgroundColor: FieldTheme.card,
    borderRadius: 16,
    padding: 14,
    position: 'relative',
  },
  statNum: { fontSize: 26, fontWeight: '800', color: FieldTheme.textOnCard, marginTop: 8 },
  statLbl: { fontSize: 10, color: FieldTheme.textMutedOnCard, fontWeight: '700', marginTop: 4, letterSpacing: 0.3 },
  badgePlus: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePlusTxt: { color: FieldTheme.danger, fontSize: 11, fontWeight: '800' },
  mapCard: {
    backgroundColor: FieldTheme.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 22,
    minHeight: 200,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: FieldTheme.cardSecondary,
  },
  mapBadge: { fontSize: 11, fontWeight: '800', color: FieldTheme.textOnCard, letterSpacing: 0.3 },
  mapBody: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    minHeight: 160,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPulse: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: FieldTheme.danger,
    opacity: 0.9,
  },
  mapFab: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: FieldTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mapFabMinus: { bottom: 54 },
  mapFabTxt: { fontSize: 20, fontWeight: '600', color: FieldTheme.textOnCard },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAll: { color: FieldTheme.primaryLight, fontWeight: '700', fontSize: 14 },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: FieldTheme.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  avatarCol: { position: 'relative' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: FieldTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: FieldTheme.success,
    borderWidth: 2,
    borderColor: FieldTheme.card,
  },
  sessionName: { fontSize: 16, fontWeight: '800', color: FieldTheme.textOnCard },
  sessionArea: { fontSize: 13, color: FieldTheme.textMutedOnCard, marginTop: 2 },
  pBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  pBarFill: { height: '100%', backgroundColor: FieldTheme.primary, borderRadius: 3 },
  sessionFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  details: { color: FieldTheme.primary, fontWeight: '700', fontSize: 13 },
  pillOutline: {
    width: 36,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: FieldTheme.borderLight,
    alignSelf: 'center',
  },
});
