import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FieldTheme } from '../theme/fieldTheme';
import { usePatrol } from '../context/PatrolContext';
import { rootNavigationRef } from '../navigation/rootNavigationRef';

export function SettingsTabScreen() {
  const { officer, signOut } = usePatrol();

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
              CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] })
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.sub}>Signed in as {officer?.name ?? '—'}</Text>

      <Pressable style={styles.row}>
        <Ionicons name="notifications-outline" size={22} color={FieldTheme.textOnDark} />
        <Text style={styles.rowTxt}>Notifications</Text>
        <Ionicons name="chevron-forward" size={20} color={FieldTheme.textMuted} />
      </Pressable>
      <Pressable style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={22} color={FieldTheme.textOnDark} />
        <Text style={styles.rowTxt}>Offline &amp; sync</Text>
        <Ionicons name="chevron-forward" size={20} color={FieldTheme.textMuted} />
      </Pressable>

      <Pressable style={styles.signOut} onPress={onSignOut}>
        <Text style={styles.signOutTxt}>Sign out device</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FieldTheme.bg, padding: 20 },
  title: { color: FieldTheme.textOnDark, fontSize: 24, fontWeight: '800' },
  sub: { color: FieldTheme.textMuted, marginTop: 6, marginBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FieldTheme.border,
  },
  rowTxt: { flex: 1, color: FieldTheme.textOnDark, fontSize: 16, fontWeight: '600' },
  signOut: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: FieldTheme.danger,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  signOutTxt: { color: FieldTheme.danger, fontWeight: '800', fontSize: 16 },
});
