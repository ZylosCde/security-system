import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Image } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import AppIcon from '../../assets/icon.png';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, ready } = useAppTheme();
  const { hydrated, deviceBinding } = usePatrol();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!ready || !hydrated) return;
    
    void (async () => {
      try {
        const cam = await Camera.getCameraPermissionsAsync();
        const loc = await Location.getForegroundPermissionsAsync();
        const mic = await Camera.getMicrophonePermissionsAsync();

        const allGranted = cam.granted && loc.granted && mic.granted;

        if (!allGranted) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Permissions' }],
            })
          );
          return;
        }

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
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'ScanAuthQr', params: { mode: 'device' } }],
            })
          );
        }
      } catch (e) {
        console.warn('Failed checking permissions in splash:', e);
        // Fail-safe fallback to Permissions screen
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Permissions' }],
          })
        );
      }
    })();
  }, [ready, hydrated, deviceBinding, navigation]);

  return (
    <View style={styles.wrap} accessibilityLabel="Loading">
      <Image
        source={AppIcon}
        style={{ width: 72, height: 72, marginBottom: spacing.lg, borderRadius: radius.lg }}
        resizeMode="contain"
        alt="CatalystDigital Logo"
      />
      <Text style={styles.wordmark}>CatalystDigital</Text>
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
