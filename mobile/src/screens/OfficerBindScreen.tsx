import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { FieldTheme } from '../theme/fieldTheme';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OfficerBind'>;

export function OfficerBindScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { officers, bindOfficer } = usePatrol();
  const [nicQuery, setNicQuery] = useState('');

  const onDuty = officers.filter((o) => o.status !== 'off-duty');

  const tryBind = (id: string) => {
    if (bindOfficer(id)) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      Alert.alert('Unavailable', 'Officer cannot be bound while off duty.');
    }
  };

  const tryManual = () => {
    const q = nicQuery.trim().toLowerCase();
    if (!q) {
      Alert.alert('Enter ID', 'Type NIC or company ID.');
      return;
    }
    const match = onDuty.find((o) => o.nic.toLowerCase().includes(q) || o.id.toLowerCase() === q);
    if (match) tryBind(match.id);
    else Alert.alert('Not found', 'No matching on-duty officer.');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Bind officer</Text>
      <Text style={styles.sub}>Select your profile or verify by ID.</Text>

      <Text style={styles.section}>ON DUTY</Text>
      <FlatList
        style={{ flex: 1 }}
        data={onDuty}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => tryBind(item.id)}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.nic}>{item.nic}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        )}
      />

      <Text style={styles.section}>MANUAL ID</Text>
      <TextInput
        style={styles.input}
        placeholder="NIC or officer ID"
        placeholderTextColor={FieldTheme.textMuted}
        value={nicQuery}
        onChangeText={setNicQuery}
        autoCapitalize="none"
      />
      <Pressable style={styles.primary} onPress={tryManual}>
        <Text style={styles.primaryText}>Verify &amp; bind</Text>
      </Pressable>

      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FieldTheme.bg, paddingHorizontal: 20 },
  title: { color: FieldTheme.textOnDark, fontSize: 24, fontWeight: '800' },
  sub: { color: FieldTheme.textMuted, marginTop: 6, marginBottom: 20 },
  section: {
    color: FieldTheme.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 10,
  },
  list: { gap: 10, paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: FieldTheme.bgElevated,
    borderWidth: 1,
    borderColor: FieldTheme.border,
  },
  name: { color: FieldTheme.textOnDark, fontSize: 17, fontWeight: '700' },
  nic: { color: FieldTheme.textMuted, fontSize: 13, marginTop: 4 },
  chev: { color: FieldTheme.primaryLight, fontSize: 22, fontWeight: '300' },
  input: {
    backgroundColor: FieldTheme.bgElevated,
    borderWidth: 1,
    borderColor: FieldTheme.border,
    borderRadius: 12,
    padding: 14,
    color: FieldTheme.textOnDark,
    fontSize: 16,
  },
  primary: {
    backgroundColor: FieldTheme.primary,
    marginTop: 12,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  back: { marginTop: 20, alignItems: 'center', padding: 12 },
  backText: { color: FieldTheme.textMuted, fontSize: 16 },
});
