import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { rootNavigationRef } from '../navigation/rootNavigationRef';

export function SettingsTabScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              })
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

      <Pressable
        style={styles.row}
        onPress={() => rootNavigationRef.navigate('Profile')}
        accessibilityRole="button"
      >
        <Ionicons name="person-circle-outline" size={22} color={colors.textOnDark} />
        <Text style={styles.rowTxt}>Profile &amp; appearance</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
      <Pressable style={styles.row} accessibilityRole="button">
        <Ionicons name="notifications-outline" size={22} color={colors.textOnDark} />
        <Text style={styles.rowTxt}>Notifications</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
      <Pressable style={styles.row} accessibilityRole="button">
        <Ionicons name="cloud-offline-outline" size={22} color={colors.textOnDark} />
        <Text style={styles.rowTxt}>Offline &amp; sync</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      <Pressable style={styles.signOut} onPress={onSignOut} accessibilityRole="button">
        <Text style={styles.signOutTxt}>Sign out device</Text>
      </Pressable>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, padding: 20 },
    title: { color: c.textOnDark, fontSize: 24, fontWeight: '800' },
    sub: { color: c.textMuted, marginTop: 6, marginBottom: 24 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    rowTxt: { flex: 1, color: c.textOnDark, fontSize: 16, fontWeight: '600' },
    signOut: {
      marginTop: 32,
      borderWidth: 1,
      borderColor: c.danger,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    signOutTxt: { color: c.danger, fontWeight: '800', fontSize: 16 },
  });
}
