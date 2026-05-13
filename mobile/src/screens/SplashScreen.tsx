import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, ready } = useAppTheme();
  const { hydrated } = usePatrol();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!ready || !hydrated) return;
    const id = setTimeout(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              state: { routes: [{ name: 'Dashboard' }], index: 0 },
            },
          ],
        })
      );
    }, 400);
    return () => clearTimeout(id);
  }, [ready, hydrated, navigation]);

  return (
    <View style={styles.wrap} accessibilityLabel="Loading">
      <Text style={styles.wordmark}>AEGIS</Text>
      <Text style={styles.sub}>Field Operations</Text>
      <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading indicator" />
    </View>
  );
}

function createStyles(c: { bg: string; textOnDark: string; textMuted: string }) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    wordmark: { color: c.textOnDark, fontSize: 32, fontWeight: '900', letterSpacing: 4 },
    sub: { color: c.textMuted, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  });
}
