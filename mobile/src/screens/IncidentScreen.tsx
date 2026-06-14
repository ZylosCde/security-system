import React, { useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import type { PatrolStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
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

const ICON_MAP: Record<typeof TYPES[number], keyof typeof Ionicons.glyphMap> = {
  'Trespasser': 'walk-outline',
  'Theft': 'cash-outline',
  'Fire': 'flame-outline',
  'Injury': 'medkit-outline',
  'Suspicious Activity': 'eye-outline',
  'Equipment Failure': 'build-outline',
  'Other': 'help-circle-outline',
};

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'Incident'>;

export function IncidentScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      <View style={styles.typeGrid}>
        {TYPES.map((t) => {
          const iconName = ICON_MAP[t as keyof typeof ICON_MAP];
          const isSelected = type === t;
          return (
            <Pressable
              key={t}
              style={[styles.gridItem, isSelected && styles.gridItemOn]}
              onPress={() => setType(t)}
            >
              <Ionicons
                name={iconName}
                size={30}
                color={isSelected ? colors.primaryLight : colors.textMuted}
                style={{ marginBottom: 6 }}
              />
              <Text style={[styles.gridText, isSelected && styles.gridTextOn]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.area}
        multiline
        placeholder="What happened?"
        placeholderTextColor={colors.textMuted}
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

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { padding: 20, backgroundColor: c.bg, paddingBottom: 40 },
    label: { color: c.textMuted, fontSize: 12, letterSpacing: 1, marginTop: 16, marginBottom: 10 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipOn: { borderColor: c.success, backgroundColor: 'rgba(16, 185, 129, 0.12)' },
    chipText: { color: c.textMuted, fontWeight: '600' },
    chipTextOn: { color: c.success },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
    },
    gridItem: {
      width: '48%',
      aspectRatio: 1.3,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bgElevated,
      padding: 8,
      marginBottom: 8,
    },
    gridItemOn: {
      borderColor: c.primaryLight,
      backgroundColor: c.primarySoft,
    },
    gridText: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    gridTextOn: {
      color: c.primaryLight,
    },
    area: {
      minHeight: 100,
      backgroundColor: c.bgElevated,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      color: c.textOnDark,
      fontSize: 15,
      textAlignVertical: 'top',
      marginTop: 8,
    },
    primary: {
      marginTop: 24,
      backgroundColor: c.card,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    primaryText: { color: c.textOnCard, fontWeight: '700', fontSize: 16 },
    cancel: { marginTop: 12, alignItems: 'center', padding: 12 },
    cancelText: { color: c.textMuted, fontSize: 16 },
  });
}
