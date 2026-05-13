import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import type { ThemePreference } from '../context/ThemeContext';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { formatImeiDisplay } from '../theme/fieldTheme';
import { rootNavigationRef } from '../navigation/rootNavigationRef';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors, preference, setPreference } = useAppTheme();
  const { officer, deviceId, signOut } = usePatrol();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const imei = formatImeiDisplay(deviceId);

  const onSignOut = () => {
    Alert.alert('Sign out?', 'This device will require officer authentication again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut();
          if (rootNavigationRef.isReady()) {
            rootNavigationRef.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'Main',
                    state: { routes: [{ name: 'Dashboard' }], index: 0 },
                  },
                ],
              })
            );
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={40} color={colors.primary} />
      </View>
      <Text style={styles.name}>{officer?.name ?? 'Guest'}</Text>
      <Text style={styles.meta}>{officer ? `ID ${officer.nic}` : 'No officer bound to this device'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device</Text>
        <Text style={styles.mono}>{imei}</Text>
        <Pressable
          style={styles.linkRow}
          onPress={() => navigation.navigate('OfficerBind')}
          accessibilityRole="button"
          accessibilityLabel="Bind or switch officer"
        >
          <Ionicons name="id-card-outline" size={22} color={colors.primary} />
          <Text style={styles.linkTxt}>{officer ? 'Switch officer' : 'Bind officer'}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
        {!officer ? (
          <Pressable
            style={styles.linkRow}
            onPress={() => navigation.navigate('Auth')}
            accessibilityRole="button"
            accessibilityLabel="Open device authentication"
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            <Text style={styles.linkTxt}>Device authentication</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.section}>Appearance</Text>
      <View style={styles.segment}>
        {THEME_OPTIONS.map((o) => (
          <Pressable
            key={o.key}
            style={[styles.segBtn, preference === o.key && styles.segOn]}
            onPress={() => setPreference(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: preference === o.key }}
            accessibilityLabel={`Theme ${o.label}`}
          >
            <Text style={[styles.segTxt, preference === o.key && styles.segTxtOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>

      {officer ? (
        <Pressable style={styles.signOut} onPress={onSignOut} accessibilityRole="button">
          <Text style={styles.signOutTxt}>Sign out device</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: 20, alignItems: 'stretch' },
    avatar: {
      alignSelf: 'center',
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    name: {
      color: c.textOnDark,
      fontSize: 24,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 16,
    },
    meta: { color: c.textMuted, textAlign: 'center', marginTop: 6, fontSize: 14 },
    card: {
      marginTop: 28,
      backgroundColor: c.bgElevated,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitle: { color: c.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    mono: { color: c.textOnDark, fontSize: 14, fontVariant: ['tabular-nums'], marginBottom: 12 },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    linkTxt: { flex: 1, color: c.textOnDark, fontSize: 16, fontWeight: '600' },
    section: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginTop: 28,
      marginBottom: 10,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.bgElevated,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    segBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    segOn: { backgroundColor: c.primary },
    segTxt: { color: c.textMuted, fontWeight: '700', fontSize: 14 },
    segTxtOn: { color: '#fff' },
    signOut: {
      marginTop: 28,
      borderWidth: 1,
      borderColor: c.danger,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    signOutTxt: { color: c.danger, fontWeight: '800', fontSize: 16 },
  });
}
