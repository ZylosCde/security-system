import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PatrolStackParamList } from '../navigation/types';
import { usePatrol } from '../context/PatrolContext';

const TYPES = [
  'Trespasser',
  'Theft',
  'Fire',
  'Injury',
  'Suspicious Activity',
  'Equipment Failure',
  'Other',
] as const;

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'Incident'>;

export function IncidentScreen() {
  const navigation = useNavigation<Nav>();
  const { recordIncident, session } = usePatrol();
  const [severity, setSeverity] = useState('Medium');
  const [type, setType] = useState<string>('Suspicious Activity');
  const [description, setDescription] = useState('');

  const submit = () => {
    if (!session) {
      Alert.alert('No active patrol', 'Start a patrol from the Patrols tab before filing an incident.');
      return;
    }
    recordIncident({ severity, type, description: description.trim() || 'No description' });
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.label}>Severity</Text>
      <View style={styles.chips}>
        {['Low', 'Medium', 'High', 'Critical'].map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, severity === s && styles.chipOn]}
            onPress={() => setSeverity(s)}
          >
            <Text style={[styles.chipText, severity === s && styles.chipTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Type</Text>
      {TYPES.map((t) => (
        <Pressable key={t} style={[styles.typeRow, type === t && styles.typeRowOn]} onPress={() => setType(t)}>
          <Text style={styles.typeText}>{t}</Text>
        </Pressable>
      ))}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.area}
        multiline
        placeholder="What happened?"
        placeholderTextColor="#52525b"
        value={description}
        onChangeText={setDescription}
      />

      <Pressable style={styles.primary} onPress={submit}>
        <Text style={styles.primaryText}>Submit report</Text>
      </Pressable>
      <Pressable style={styles.cancel} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, backgroundColor: '#09090b', paddingBottom: 40 },
  label: { color: '#71717a', fontSize: 12, letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  chipOn: { borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.12)' },
  chipText: { color: '#a1a1aa', fontWeight: '600' },
  chipTextOn: { color: '#34d399' },
  typeRow: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 8,
  },
  typeRowOn: { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.08)' },
  typeText: { color: '#e4e4e7', fontSize: 15 },
  area: {
    minHeight: 100,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 14,
    color: '#fafafa',
    fontSize: 15,
    textAlignVertical: 'top',
  },
  primary: {
    marginTop: 24,
    backgroundColor: '#fafafa',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#09090b', fontWeight: '700', fontSize: 16 },
  cancel: { marginTop: 12, alignItems: 'center', padding: 12 },
  cancelText: { color: '#71717a', fontSize: 16 },
});
