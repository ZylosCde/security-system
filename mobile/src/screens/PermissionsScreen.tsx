import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Permissions'>;

export function PermissionsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { deviceBinding } = usePatrol();

  const [cameraStatus, setCameraStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [checking, setChecking] = useState(true);

  const checkAllPermissions = useCallback(async () => {
    try {
      const cam = await Camera.getCameraPermissionsAsync();
      const loc = await Location.getForegroundPermissionsAsync();
      const mic = await Camera.getMicrophonePermissionsAsync();

      setCameraStatus(cam.granted ? 'granted' : cam.canAskAgain ? 'prompt' : 'denied');
      setLocationStatus(loc.granted ? 'granted' : loc.canAskAgain ? 'prompt' : 'denied');
      setMicStatus(mic.granted ? 'granted' : mic.canAskAgain ? 'prompt' : 'denied');
    } catch (e) {
      console.warn('Failed to check permissions:', e);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkAllPermissions();
  }, [checkAllPermissions]);

  const requestCamera = async () => {
    const res = await Camera.requestCameraPermissionsAsync();
    setCameraStatus(res.granted ? 'granted' : 'denied');
  };

  const requestLocation = async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(res.granted ? 'granted' : 'denied');
  };

  const requestMic = async () => {
    const res = await Camera.requestMicrophonePermissionsAsync();
    setMicStatus(res.granted ? 'granted' : 'denied');
  };

  const allGranted = cameraStatus === 'granted' && locationStatus === 'granted' && micStatus === 'granted';

  const handleContinue = () => {
    if (!allGranted) return;

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
  };

  if (checking) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>System Permissions</Text>
          <Text style={styles.subtitle}>
            CatalystDigital requires the following system permissions to securely log and verify field operations.
          </Text>
        </View>

        <View style={styles.list}>
          {/* CAMERA */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.bullet, cameraStatus === 'granted' ? styles.bulletGranted : styles.bulletPrompt]}>
                <Ionicons
                  name={cameraStatus === 'granted' ? 'camera' : 'camera-outline'}
                  size={20}
                  color={cameraStatus === 'granted' ? colors.onPrimary : colors.textMuted}
                />
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.cardTitle}>Camera Access</Text>
                <Text style={styles.cardDesc}>
                  Used to scan QR codes for device registration, officer sign-in, and checkpoint verification.
                </Text>
              </View>
            </View>
            <Pressable
              style={[
                styles.btnAction,
                cameraStatus === 'granted' ? styles.btnGranted : styles.btnPrompt,
              ]}
              onPress={() => void requestCamera()}
              disabled={cameraStatus === 'granted'}
            >
              <Text style={[styles.btnActionText, cameraStatus === 'granted' ? styles.btnGrantedText : styles.btnPromptText]}>
                {cameraStatus === 'granted' ? 'Granted' : 'Grant Permission'}
              </Text>
              {cameraStatus === 'granted' && <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginLeft: 4 }} />}
            </Pressable>
          </View>

          {/* LOCATION */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.bullet, locationStatus === 'granted' ? styles.bulletGranted : styles.bulletPrompt]}>
                <Ionicons
                  name={locationStatus === 'granted' ? 'location' : 'location-outline'}
                  size={20}
                  color={locationStatus === 'granted' ? colors.onPrimary : colors.textMuted}
                />
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.cardTitle}>Location Services</Text>
                <Text style={styles.cardDesc}>
                  Used to log coordinates for active patrols, verify site geofences, and dispatch SOS alerts.
                </Text>
              </View>
            </View>
            <Pressable
              style={[
                styles.btnAction,
                locationStatus === 'granted' ? styles.btnGranted : styles.btnPrompt,
              ]}
              onPress={() => void requestLocation()}
              disabled={locationStatus === 'granted'}
            >
              <Text style={[styles.btnActionText, locationStatus === 'granted' ? styles.btnGrantedText : styles.btnPromptText]}>
                {locationStatus === 'granted' ? 'Granted' : 'Grant Permission'}
              </Text>
              {locationStatus === 'granted' && <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginLeft: 4 }} />}
            </Pressable>
          </View>

          {/* MICROPHONE & AUDIO */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.bullet, micStatus === 'granted' ? styles.bulletGranted : styles.bulletPrompt]}>
                <Ionicons
                  name={micStatus === 'granted' ? 'mic' : 'mic-outline'}
                  size={20}
                  color={micStatus === 'granted' ? colors.onPrimary : colors.textMuted}
                />
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.cardTitle}>Microphone & Speaker</Text>
                <Text style={styles.cardDesc}>
                  Used to connect microphone audio and configure speaker output for SOS alerts.
                </Text>
              </View>
            </View>
            <Pressable
              style={[
                styles.btnAction,
                micStatus === 'granted' ? styles.btnGranted : styles.btnPrompt,
              ]}
              onPress={() => void requestMic()}
              disabled={micStatus === 'granted'}
            >
              <Text style={[styles.btnActionText, micStatus === 'granted' ? styles.btnGrantedText : styles.btnPromptText]}>
                {micStatus === 'granted' ? 'Granted' : 'Grant Permission'}
              </Text>
              {micStatus === 'granted' && <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginLeft: 4 }} />}
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.btnContinue, !allGranted && styles.btnDisabled]}
          disabled={!allGranted}
          onPress={handleContinue}
        >
          <Text style={styles.btnContinueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} style={{ marginLeft: 6 }} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.bg,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    header: {
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      ...typography.title,
      color: c.textOnDark,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.bodySm,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: spacing.sm,
    },
    list: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    card: {
      backgroundColor: c.bgElevated,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    bullet: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bulletPrompt: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    bulletGranted: {
      backgroundColor: c.primary,
    },
    cardMeta: {
      flex: 1,
    },
    cardTitle: {
      ...typography.body,
      fontWeight: 'bold',
      color: c.textOnDark,
      marginBottom: 2,
    },
    cardDesc: {
      ...typography.bodySm,
      color: c.textMuted,
      lineHeight: 18,
    },
    btnAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    btnPrompt: {
      backgroundColor: 'transparent',
      borderColor: c.primary,
    },
    btnPromptText: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 13,
    },
    btnGranted: {
      backgroundColor: c.card,
      borderColor: c.border,
    },
    btnGrantedText: {
      color: c.textMuted,
      fontWeight: '600',
      fontSize: 13,
    },
    btnActionText: {},
    btnContinue: {
      backgroundColor: c.primary,
      borderRadius: radius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      marginTop: spacing.sm,
    },
    btnDisabled: {
      backgroundColor: c.border,
      opacity: 0.6,
    },
    btnContinueText: {
      color: c.onPrimary,
      ...typography.body,
      fontWeight: 'bold',
      fontSize: 16,
    },
  });
}
