import React, { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PatrolStackParamList } from './types';
import { PatrolScreen } from '../screens/PatrolScreen';
import { ScanCheckpointScreen } from '../screens/ScanCheckpointScreen';
import { ViolationScreen } from '../screens/ViolationScreen';
import { IncidentScreen } from '../screens/IncidentScreen';
import { SOSScreen } from '../screens/SOSScreen';
import { SOSActiveScreen } from '../screens/SOSActiveScreen';
import { useAppTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<PatrolStackParamList>();

export function PatrolStackNavigator() {
  const { colors } = useAppTheme();
  const stackScreenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.textOnDark,
      headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
      contentStyle: { backgroundColor: colors.bg },
    }),
    [colors]
  );

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="PatrolHome" component={PatrolScreen} options={{ title: 'Patrol' }} />
      <Stack.Screen
        name="ScanCheckpoint"
        component={ScanCheckpointScreen}
        options={{ title: 'Scan checkpoint', headerBackTitle: 'Back' }}
      />
      <Stack.Screen name="Violation" component={ViolationScreen} options={{ title: 'Violation' }} />
      <Stack.Screen name="Incident" component={IncidentScreen} options={{ title: 'Report incident' }} />
      <Stack.Screen name="SOS" component={SOSScreen} options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen
        name="SOSActive"
        component={SOSActiveScreen}
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
