import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, ready } = useAppTheme();
  const { hydrated, deviceBinding } = usePatrol();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!ready || !hydrated) return;
    const id = setTimeout(() => {
      if (deviceBinding) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Main',
                state: { routes: [{ name: 'Home' }], index: 0 },
              },
            ],
          })
        );
        return;
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'ScanAuthQr', params: { mode: 'device' } }],
        })
      );
    }, 400);
    return () => clearTimeout(id);
  }, [ready, hydrated, deviceBinding, navigation]);

  return (
    <View style={styles.wrap} accessibilityLabel="Loading">
      <View style={styles.logo}>
        <Ionicons name="shield-checkmark" size={36} color={colors.onPrimary} />
      </View>
      <Text style={styles.wordmark}>DigitalGUARD360</Text>
      <Text style={styles.sub}>Field operations</Text>
      <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      backgroundColor: c.headerBg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    wordmark: {
      ...typography.title,
      color: c.headerText,
    },
    sub: {
      ...typography.bodySm,
      color: 'rgba(255,255,255,0.8)',
      marginTop: spacing.xs,
    },
    loader: { marginTop: spacing.xxl },
  });
}
