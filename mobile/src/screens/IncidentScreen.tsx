import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { PatrolStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';

const TYPES = [
  'Trespasser',
  'Theft',
  'Fire',
  'Injury',
  'Suspicious Activity',
  'Equipment Failure',
  'Other',
] as const;

const ICON_MAP: Record<typeof TYPES[number], keyof typeof Ionicons.glyphMap> = {
  'Trespasser': 'walk-outline',
  'Theft': 'cash-outline',
  'Fire': 'flame-outline',
  'Injury': 'medkit-outline',
  'Suspicious Activity': 'eye-outline',
  'Equipment Failure': 'build-outline',
  'Other': 'help-circle-outline',
};

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

type Nav = NativeStackNavigationProp<PatrolStackParamList, 'Incident'>;

export function IncidentScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { recordIncident, officer } = usePatrol();

  const [severity, setSeverity] = useState('Medium');
  const [type, setType] = useState<string>('Suspicious Activity');
  const [description, setDescription] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const submit = () => {
    if (submitState === 'submitting' || submitState === 'success') return;

    if (!officer) {
      setErrorMsg('Sign in before submitting an incident report.');
      setSubmitState('error');
      setTimeout(() => setSubmitState('idle'), 3000);
      return;
    }

    setSubmitState('submitting');
    try {
      recordIncident({
        severity,
        type,
        description: description.trim() || 'No description provided',
      });
      setSubmitState('success');
      // Auto-reset form after success
      setTimeout(() => {
        setDescription('');
        setSeverity('Medium');
        setType('Suspicious Activity');
        setSubmitState('idle');
        navigation.goBack();
      }, 2500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to submit report.';
      setErrorMsg(msg);
      setSubmitState('error');
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  const isSubmitting = submitState === 'submitting';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textOnDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Incident Report</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Scrollable form ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Severity */}
        <Text style={styles.label}>SEVERITY</Text>
        <View style={styles.severityRow}>
          {(['Low', 'Medium', 'High', 'Critical'] as const).map((s) => {
            const isOn = severity === s;
            const toneColor =
              s === 'Low' ? colors.success :
              s === 'Medium' ? colors.warning :
              s === 'High' ? '#f97316' :
              colors.danger;
            return (
              <Pressable
                key={s}
                style={[
                  styles.severityChip,
                  isOn && { borderColor: toneColor, backgroundColor: `${toneColor}18` },
                ]}
                onPress={() => setSeverity(s)}
              >
                <Text style={[styles.severityText, isOn && { color: toneColor, fontWeight: '800' }]}>
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Type grid */}
        <Text style={styles.label}>TYPE</Text>
        <View style={styles.typeGrid}>
          {TYPES.map((t) => {
            const iconName = ICON_MAP[t];
            const isSelected = type === t;
            return (
              <Pressable
                key={t}
                style={[styles.gridItem, isSelected && styles.gridItemOn]}
                onPress={() => setType(t)}
              >
                <Ionicons
                  name={iconName}
                  size={28}
                  color={isSelected ? colors.primaryLight : colors.textMuted}
                  style={{ marginBottom: 6 }}
                />
                <Text style={[styles.gridText, isSelected && styles.gridTextOn]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Description */}
        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput
          style={styles.area}
          multiline
          placeholder="What happened? Where? Any details…"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          editable={!isSubmitting}
        />

        {/* Without patrol info notice */}
        <View style={styles.noticeRow}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
          <Text style={styles.noticeText}>
            Reports are submitted immediately and queued for sync. No active patrol required.
          </Text>
        </View>
      </ScrollView>

      {/* ── Floating Submit FAB — always reachable ── */}
      <View style={[styles.fabWrap, { bottom: insets.bottom + 16 }]}>
        <Pressable
          id="incident-submit-fab"
          style={[
            styles.fab,
            isSubmitting && styles.fabDisabled,
          ]}
          onPress={submit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Submit incident report"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
          ) : (
            <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 10 }} />
          )}
          <Text style={styles.fabText}>
            {isSubmitting ? 'Submitting…' : 'Submit Report'}
          </Text>
        </Pressable>
      </View>

      {/* ── Inline status overlay ── */}
      {(submitState === 'success' || submitState === 'error') ? (
        <View
          style={[
            styles.statusOverlay,
            submitState === 'success' ? styles.statusOverlaySuccess : styles.statusOverlayError,
          ]}
          pointerEvents="none"
        >
          <View style={styles.statusCard}>
            <Ionicons
              name={submitState === 'success' ? 'checkmark-circle' : 'close-circle'}
              size={56}
              color={submitState === 'success' ? colors.success : colors.danger}
            />
            <Text style={[
              styles.statusTitle,
              { color: submitState === 'success' ? colors.success : colors.danger }
            ]}>
              {submitState === 'success' ? 'Report Submitted' : 'Submission Failed'}
            </Text>
            {submitState === 'error' ? (
              <Text style={styles.statusBody}>{errorMsg}</Text>
            ) : (
              <Text style={styles.statusBody}>
                Your incident report has been queued and will be synced automatically.
              </Text>
            )}
          </View>
        </View>
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
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.headerBg,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
      color: c.textOnDark,
      fontSize: 17,
      fontWeight: '700',
      flex: 1,
      textAlign: 'center',
    },

    scroll: { flex: 1 },
    scrollContent: { padding: 20 },

    label: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginTop: 20,
      marginBottom: 10,
    },

    severityRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    severityChip: {
      flex: 1,
      minWidth: 68,
      paddingVertical: 11,
      paddingHorizontal: 8,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
      backgroundColor: c.bgElevated,
    },
    severityText: {
      color: c.textMuted,
      fontWeight: '600',
      fontSize: 13,
    },

    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    gridItem: {
      width: '47%',
      aspectRatio: 1.6,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.bgElevated,
      padding: 10,
    },
    gridItemOn: {
      borderColor: c.primaryLight,
      backgroundColor: c.primarySoft,
    },
    gridText: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    gridTextOn: {
      color: c.primaryLight,
      fontWeight: '800',
    },

    area: {
      minHeight: 110,
      backgroundColor: c.bgElevated,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 14,
      color: c.textOnDark,
      fontSize: 15,
      textAlignVertical: 'top',
      lineHeight: 22,
    },

    noticeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: 16,
      padding: 12,
      backgroundColor: c.bgElevated,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    noticeText: {
      flex: 1,
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },

    /* Floating Submit FAB */
    fabWrap: {
      position: 'absolute',
      left: 20,
      right: 20,
      alignItems: 'stretch',
    },
    fab: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
      paddingVertical: 18,
      borderRadius: 18,
      shadowColor: c.primary,
      shadowOpacity: 0.45,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
      elevation: 10,
    },
    fabDisabled: {
      opacity: 0.7,
    },
    fabText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    /* Status overlay */
    statusOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    statusOverlaySuccess: {
      backgroundColor: 'rgba(10, 18, 35, 0.88)',
    },
    statusOverlayError: {
      backgroundColor: 'rgba(10, 18, 35, 0.88)',
    },
    statusCard: {
      alignItems: 'center',
      padding: 32,
      borderRadius: 24,
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      width: '100%',
      maxWidth: 340,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 12,
    },
    statusTitle: {
      fontSize: 22,
      fontWeight: '800',
      marginTop: 16,
      textAlign: 'center',
    },
    statusBody: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 10,
      textAlign: 'center',
    },
  });
}
