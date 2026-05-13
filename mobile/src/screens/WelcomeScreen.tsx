import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>AEGIS PATROL</Text>
      </View>
      <Text style={styles.title}>Field device</Text>
      <Text style={styles.sub}>
        Non-linked officer sessions, rotating checkpoint QR, offline queue, and SOS — built with React Native (Expo).
      </Text>
      <Pressable style={styles.primary} onPress={() => navigation.navigate('OfficerSelect')}>
        <Text style={styles.primaryText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingHorizontal: 28,
    paddingTop: 80,
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  badgeText: {
    color: '#a1a1aa',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: {
    color: '#fafafa',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 12,
  },
  sub: {
    color: '#a1a1aa',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },
  primary: {
    backgroundColor: '#fafafa',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#09090b',
    fontSize: 16,
    fontWeight: '600',
  },
});
