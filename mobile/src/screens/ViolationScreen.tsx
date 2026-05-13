import React from 'react';
import { Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PatrolStackParamList } from '../navigation/types';
import { usePatrol } from '../context/PatrolContext';

const REASONS = [
  'Emergency on premises',
  'Equipment failure',
  'Supervisor instruction',
  'Medical',
  'Other (text required)',
];

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'Violation'>;

export function ViolationScreen() {
  const navigation = useNavigation<Nav>();
  const { recordViolation, session } = usePatrol();

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.sub}>Reason is timestamped and attached to the patrol log.</Text>
      {REASONS.map((r) => (
        <Pressable
          key={r}
          style={styles.row}
          onPress={() => {
            if (!session) {
              Alert.alert('No active patrol', 'Start a patrol before logging a violation.');
              return;
            }
            recordViolation(r);
            navigation.goBack();
          }}
        >
          <Text style={styles.rowText}>{r}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.cancel} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, paddingBottom: 40, backgroundColor: '#09090b' },
  sub: { color: '#71717a', fontSize: 14, marginBottom: 20 },
  row: {
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 18,
    borderRadius: 14,
    marginBottom: 10,
  },
  rowText: { color: '#fafafa', fontSize: 16 },
  cancel: { marginTop: 16, alignItems: 'center', padding: 12 },
  cancelText: { color: '#71717a', fontSize: 16 },
});
