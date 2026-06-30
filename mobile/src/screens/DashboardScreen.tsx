import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { usePatrol } from '../context/PatrolContext';
import { useAppTheme } from '../context/ThemeContext';

type RootNav = NativeStackNavigationProp<RootStackParamList>;
type TabNav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

type LandingAction = {
  key: 'sos' | 'incident' | 'patrol' | 'flashlight';
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'danger' | 'primary' | 'neutral';
};

const LANDING_ACTIONS: LandingAction[] = [
  {
    key: 'sos',
    label: 'SOS',
    sublabel: 'Emergency alert to command',
    icon: 'warning',
    tone: 'danger',
  },
  {
    key: 'incident',
    label: 'Incident',
    sublabel: 'Report an incident',
    icon: 'document-text-outline',
    tone: 'primary',
  },
  {
    key: 'patrol',
    label: 'Patrol',
    sublabel: 'Start checkpoint patrol',
    icon: 'footsteps',
    tone: 'primary',
  },
  {
    key: 'flashlight',
    label: 'Flashlight off',
    sublabel: 'Tap to turn light on',
    icon: 'flash-off-outline',
    tone: 'neutral',
  },
];

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<RootNav>();
  const navigation = useNavigation<TabNav>();
  const { colors, ui } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { officer, deviceBinding, signOut, apiError, session } = usePatrol();
  const [torchOn, setTorchOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const firstName = officer?.name.split(' ')[0] ?? 'Officer';

  const goPatrolScreen = (screen: 'SOS' | 'Incident' | 'OfficerPatrolScan' | 'ScanCheckpoint') => {
    navigation.navigate('Patrols', { screen });
  };

  const goSignIn = () => {
    rootNav.navigate('Auth');
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'End your officer session on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut();
        },
      },
    ]);
  };

  const toggleFlashlight = useCallback(async () => {
    if (!torchOn && !permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera required', 'Camera access is needed to use the flashlight.');
        return;
      }
    }
    setTorchOn((prev) => !prev);
  }, [torchOn, permission?.granted, requestPermission]);

  const handleAction = (action: LandingAction['key']) => {
    switch (action) {
      case 'sos':
        goPatrolScreen('SOS');
        break;
      case 'incident':
        goPatrolScreen('Incident');
        break;
      case 'patrol':
        if (session?.status === 'in-progress') {
          goPatrolScreen('ScanCheckpoint');
        } else {
          goPatrolScreen('OfficerPatrolScan');
        }
        break;
      case 'flashlight':
        void toggleFlashlight();
        break;
      default:
        break;
    }
  };

  const actionCards = useMemo(
    () =>
      LANDING_ACTIONS.map((action) => {
        if (action.key === 'flashlight') {
          return {
            ...action,
            label: torchOn ? 'Flashlight on' : 'Flashlight off',
            sublabel: torchOn ? 'Tap to turn light off' : 'Tap to turn light on',
            icon: (torchOn ? 'flash' : 'flash-off-outline') as keyof typeof Ionicons.glyphMap,
          };
        }
        return action;
      }),
    [torchOn]
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>
            {officer ? `Hello, ${firstName}` : 'DigitalGUARD360'}
          </Text>
          <Text style={styles.headerMeta}>
            {officer?.name ??
              (deviceBinding
                ? `Device ${deviceBinding.deviceId} · IMEI ${deviceBinding.imeiNumber}`
                : 'Field operations')}
          </Text>
        </View>
        {officer ? (
          <Pressable
            style={styles.iconBtn}
            onPress={confirmSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.headerText} />
          </Pressable>
        ) : (
          <Pressable
            style={styles.iconBtn}
            onPress={goSignIn}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Ionicons name="person-outline" size={22} color={colors.headerText} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {apiError ? (
          <View style={[ui.alertError, styles.sectionGap]}>
            <Text style={ui.alertErrorText}>{apiError}</Text>
          </View>
        ) : null}

        {!officer ? (
          <View style={[ui.card, styles.sectionGap]}>
            <Text style={styles.cardTitle}>Officer sign-in</Text>
            <Text style={ui.subtitle}>
              This device is registered. Sign in to load your patrol route and assignments.
            </Text>
            <Pressable style={[ui.btnPrimary, styles.signInBtn]} onPress={goSignIn}>
              <Text style={ui.btnPrimaryText}>Sign in</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.landingTitle}>Quick actions</Text>
        <View style={styles.actionGrid}>
          {actionCards.map((action) => (
            <Pressable
              key={action.key}
              style={[
                styles.actionCard,
                action.tone === 'danger' && styles.actionCardDanger,
                action.tone === 'primary' && styles.actionCardPrimary,
                action.key === 'flashlight' && torchOn && styles.actionCardTorchOn,
              ]}
              onPress={() => handleAction(action.key)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  action.tone === 'danger' && styles.actionIconDanger,
                  action.tone === 'primary' && styles.actionIconPrimary,
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={28}
                  color={
                    action.tone === 'danger'
                      ? colors.danger
                      : action.tone === 'primary'
                        ? colors.primary
                        : torchOn
                          ? colors.warning
                          : colors.textMuted
                  }
                />
              </View>
              <Text
                style={[
                  styles.actionLabel,
                  action.tone === 'danger' && styles.actionLabelDanger,
                ]}
              >
                {action.label}
              </Text>
              <Text style={styles.actionSub}>{action.sublabel}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {torchOn && permission?.granted ? (
        <CameraView
          style={styles.hiddenTorchCamera}
          facing="back"
          enableTorch
        />
      ) : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      backgroundColor: c.headerBg,
    },
    headerLeft: { flex: 1 },
    headerGreeting: {
      ...typography.titleSm,
      color: c.headerText,
    },
    headerMeta: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 2,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    sectionGap: { marginBottom: spacing.lg },
    cardTitle: {
      ...typography.titleSm,
      color: c.textOnCard,
      marginBottom: spacing.xs,
    },
    signInBtn: { marginTop: spacing.md },
    landingTitle: {
      ...typography.label,
      color: c.textMuted,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    actionCard: {
      width: '47%',
      minHeight: 148,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      justifyContent: 'space-between',
    },
    actionCardDanger: {
      borderColor: 'rgba(239,68,68,0.35)',
      backgroundColor: 'rgba(239,68,68,0.08)',
    },
    actionCardPrimary: {
      borderColor: 'rgba(59,130,246,0.25)',
    },
    actionCardTorchOn: {
      borderColor: 'rgba(245,158,11,0.45)',
      backgroundColor: 'rgba(245,158,11,0.08)',
    },
    actionIconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: c.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    actionIconDanger: {
      backgroundColor: 'rgba(239,68,68,0.15)',
    },
    actionIconPrimary: {
      backgroundColor: c.primarySoft,
    },
    actionLabel: {
      ...typography.titleSm,
      color: c.textOnCard,
    },
    actionLabelDanger: {
      color: c.danger,
    },
    actionSub: {
      ...typography.caption,
      color: c.textMutedOnCard,
      marginTop: spacing.xs,
      lineHeight: 18,
    },
    hiddenTorchCamera: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
      bottom: 0,
      right: 0,
    },
  });
}
