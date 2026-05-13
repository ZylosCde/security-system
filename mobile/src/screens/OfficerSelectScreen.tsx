import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OfficerSelect'>;

export function OfficerSelectScreen() {
  const navigation = useNavigation<Nav>();
  const { officers, startPatrol } = usePatrol();

  const onSelect = (id: string) => {
    startPatrol(id);
    navigation.replace('Patrol');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>Scan officer NFC/QR on device, or select for demo.</Text>
      <FlatList
        data={officers.filter((o) => o.status !== 'off-duty')}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onSelect(item.id)}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.nic}>{item.nic}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{item.status.replace('-', ' ')}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b', padding: 20 },
  hint: { color: '#71717a', fontSize: 14, marginBottom: 16 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
  },
  name: { color: '#fafafa', fontSize: 17, fontWeight: '600' },
  nic: { color: '#71717a', fontSize: 12, marginTop: 4, fontVariant: ['tabular-nums'] },
  pill: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { color: '#34d399', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
