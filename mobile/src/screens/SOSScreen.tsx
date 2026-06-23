import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PatrolStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { darkColors } from '../theme/colors';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'SOS'>;

/** Emergency overlay always uses dark palette for legibility and contrast. */
const emergencyColors: ThemeColors = darkColors;

export function SOSScreen() {
  const navigation = useNavigation<Nav>();
  const { triggerSOS } = usePatrol();
  const [count, setCount] = useState(3);
  const cancelled = useRef(false);
  const styles = useMemo(() => createSosStyles(emergencyColors), []);

  useEffect(() => {
    if (count === 0 || cancelled.current) return;
    const t = setTimeout(() => {
      if (cancelled.current) return;
      if (count === 1) {
        void triggerSOS().then(() => {
          navigation.replace('SOSActive');
        });
        setCount(0);
      } else {
        setCount(count - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [count, navigation, triggerSOS]);

  const cancel = () => {
    cancelled.current = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation.navigate as any)('Main', { screen: 'Home' });
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.sub}>Cancel within 3 seconds to prevent accidental activation.</Text>
      <Text style={styles.count} accessibilityLiveRegion="polite">
        {count}
      </Text>
      <Pressable style={styles.btn} onPress={cancel} accessibilityRole="button" accessibilityLabel="Cancel SOS">
        <Text style={styles.btnText}>Cancel SOS</Text>
      </Pressable>
    </View>
  );
}

function createSosStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    title: { color: '#fecaca', fontSize: 22, fontWeight: '800', marginBottom: 8 },
    sub: { color: c.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 32 },
    count: { fontSize: 72, fontWeight: '800', color: c.danger, marginBottom: 40, fontVariant: ['tabular-nums'] },
    btn: {
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 999,
    },
    btnText: { color: c.textOnDark, fontSize: 16, fontWeight: '700' },
  });
}
