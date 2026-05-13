import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PatrolStackParamList } from '../navigation/types';
import { FieldTheme } from '../theme/fieldTheme';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'SOS'>;

export function SOSScreen() {
  const navigation = useNavigation<Nav>();
  const { triggerSOS } = usePatrol();
  const [count, setCount] = useState(3);
  const cancelled = useRef(false);

  useEffect(() => {
    if (count === 0 || cancelled.current) return;
    const t = setTimeout(() => {
      if (cancelled.current) return;
      if (count === 1) {
        triggerSOS();
        navigation.replace('SOSActive');
        setCount(0);
      } else {
        setCount(count - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [count, navigation, triggerSOS]);

  const cancel = () => {
    cancelled.current = true;
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.sub}>Cancel within 3 seconds to prevent accidental activation.</Text>
      <Text style={styles.count}>{count}</Text>
      <Pressable style={styles.btn} onPress={cancel}>
        <Text style={styles.btnText}>Cancel SOS</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: FieldTheme.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: { color: '#fecaca', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  sub: { color: FieldTheme.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 32 },
  count: { fontSize: 72, fontWeight: '800', color: FieldTheme.danger, marginBottom: 40, fontVariant: ['tabular-nums'] },
  btn: {
    borderWidth: 1,
    borderColor: FieldTheme.border,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
  },
  btnText: { color: FieldTheme.textOnDark, fontSize: 16, fontWeight: '700' },
});
