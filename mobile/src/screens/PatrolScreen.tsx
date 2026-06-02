import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
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
    scannedIds,
    beginPatrol,
    endPatrol,
  } = usePatrol();

  const remaining = route.checkpoints.filter((id) => !scannedIds.includes(id));
  const patrolComplete = !!session && remaining.length === 0;

  useEffect(() => {
    if (!session || patrolComplete) return;
    navigation.replace('ScanCheckpoint');
  }, [session, patrolComplete, navigation]);

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

  if (patrolComplete) {
    return (
      <View style={styles.center}>
        <Text style={styles.completeTitle}>Patrol complete</Text>
        <Text style={styles.muted}>
          {scannedIds.length} / {route.checkpoints.length} checkpoints recorded for {route.name}.
        </Text>
        <Pressable
          style={[styles.primary, { marginTop: 28, paddingHorizontal: 32 }]}
          onPress={() => endPatrol()}
        >
          <Text style={styles.primaryText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  if (session) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Opening scanner…</Text>
      </View>
    );
  }

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
          Opens the camera immediately to scan patrol unit QR codes. SOS, violations, and incidents stay available while scanning.
        </Text>
        <Pressable
          style={styles.primary}
          onPress={() => {
            beginPatrol();
            navigation.replace('ScanCheckpoint');
          }}
        >
          <Text style={styles.primaryText}>Begin patrol</Text>
        </Pressable>
      </View>
      <Pressable
        style={styles.secondary}
        onPress={() => navigation.navigate('SampleQr')}
        accessibilityRole="button"
        accessibilityLabel="Download test QR codes"
      >
        <Text style={styles.secondaryText}>Download test QR codes</Text>
      </Pressable>
    </ScrollView>
  );
}

function createPatrolStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: c.bg },
    muted: { color: c.textMuted, textAlign: 'center', fontSize: 15 },
    completeTitle: { color: c.textOnDark, fontSize: 26, fontWeight: '800', marginBottom: 12 },
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
    secondary: {
      marginTop: 16,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: c.bgElevated,
    },
    secondaryText: { color: c.textOnDark, fontSize: 15, fontWeight: '700' },
  });
}
