import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OfficerBind'>;

export function OfficerBindScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { loginWithNIC, deviceBinding } = usePatrol();
  const [nicQuery, setNicQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goMainDashboard = () => {
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
  };

  const tryManual = async () => {
    const q = nicQuery.trim();
    if (!q) {
      Alert.alert('Enter NIC', 'Type your national ID (NIC).');
      return;
    }
    setSubmitting(true);
    const res = await loginWithNIC(q);
    setSubmitting(false);
    if (res.ok) {
      goMainDashboard();
    } else {
      Alert.alert('Sign-in failed', res.message);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Sign in with NIC</Text>
      <Text style={styles.sub}>Your identity is verified against the patrol API.</Text>

      {!deviceBinding ? (
        <Text style={styles.warn}>
          Register this handset first — scan the device QR on the Auth screen.
        </Text>
      ) : null}

      <Pressable
        style={[styles.secondary, !deviceBinding && { opacity: 0.5 }]}
        onPress={() => navigation.navigate('ScanAuthQr', { mode: 'officer' })}
        disabled={!deviceBinding}
      >
        <Text style={styles.secondaryText}>Scan officer QR</Text>
      </Pressable>

      <Text style={styles.section}>NIC / NATIONAL ID</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 123456789V"
        placeholderTextColor={colors.textMuted}
        value={nicQuery}
        onChangeText={setNicQuery}
        autoCapitalize="characters"
        editable={!submitting && !!deviceBinding}
      />
      <Pressable
        style={[styles.primary, (submitting || !deviceBinding) && { opacity: 0.7 }]}
        onPress={() => void tryManual()}
        disabled={submitting || !deviceBinding}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Verify and sign in</Text>
        )}
      </Pressable>

      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 20 },
    title: { color: c.textOnDark, fontSize: 24, fontWeight: '800' },
    sub: { color: c.textMuted, marginTop: 6, marginBottom: 12 },
    warn: { color: c.warning, fontSize: 14, lineHeight: 20, marginBottom: 12 },
    secondary: {
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: c.bgElevated,
    },
    secondaryText: { color: c.primary, fontWeight: '800', fontSize: 15 },
    section: {
      color: c.textMuted,
      fontSize: 11,
      letterSpacing: 1.2,
      fontWeight: '700',
      marginBottom: 10,
    },
    input: {
      backgroundColor: c.bgElevated,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      color: c.textOnDark,
      fontSize: 16,
    },
    primary: {
      backgroundColor: c.primary,
      marginTop: 12,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
    },
    primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    back: { marginTop: 20, alignItems: 'center', padding: 12 },
    backText: { color: c.textMuted, fontSize: 16 },
  });
}
