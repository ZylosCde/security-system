import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { FieldTheme } from '../theme/fieldTheme';
import { usePatrol } from '../context/PatrolContext';

export function OfficersTabScreen() {
  const { officers } = usePatrol();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Officers</Text>
      <Text style={styles.sub}>Roster and duty status for this site.</Text>
      <FlatList
        data={officers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>
                {item.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.nic}>{item.nic}</Text>
            </View>
            <View style={[styles.badge, item.status === 'on-duty' && styles.badgeOn]}>
              <Text style={[styles.badgeTxt, item.status === 'on-duty' && styles.badgeTxtOn]}>
                {item.status.replace('-', ' ')}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FieldTheme.bg, padding: 20 },
  title: { color: FieldTheme.textOnDark, fontSize: 24, fontWeight: '800' },
  sub: { color: FieldTheme.textMuted, marginTop: 6, marginBottom: 16 },
  list: { gap: 10, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FieldTheme.bgElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: FieldTheme.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FieldTheme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: FieldTheme.primaryLight, fontWeight: '800', fontSize: 14 },
  name: { color: FieldTheme.textOnDark, fontSize: 16, fontWeight: '700' },
  nic: { color: FieldTheme.textMuted, fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: FieldTheme.surface,
  },
  badgeOn: { backgroundColor: 'rgba(16,185,129,0.15)' },
  badgeTxt: { color: FieldTheme.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  badgeTxtOn: { color: FieldTheme.success },
});
