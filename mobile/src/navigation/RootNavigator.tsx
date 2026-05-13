import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { OfficerSelectScreen } from '../screens/OfficerSelectScreen';
import { PatrolScreen } from '../screens/PatrolScreen';
import { ScanCheckpointScreen } from '../screens/ScanCheckpointScreen';
import { ViolationScreen } from '../screens/ViolationScreen';
import { IncidentScreen } from '../screens/IncidentScreen';
import { SOSScreen } from '../screens/SOSScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#09090b',
    card: '#09090b',
    primary: '#34d399',
    text: '#fafafa',
    border: '#27272a',
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#09090b' },
          headerTintColor: '#fafafa',
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          contentStyle: { backgroundColor: '#09090b' },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OfficerSelect" component={OfficerSelectScreen} options={{ title: 'Officer' }} />
        <Stack.Screen name="Patrol" component={PatrolScreen} options={{ title: 'Active patrol', headerBackVisible: false }} />
        <Stack.Screen name="ScanCheckpoint" component={ScanCheckpointScreen} options={{ title: 'Scan QR' }} />
        <Stack.Screen name="Violation" component={ViolationScreen} options={{ title: 'Violation reason' }} />
        <Stack.Screen name="Incident" component={IncidentScreen} options={{ title: 'Report incident' }} />
        <Stack.Screen name="SOS" component={SOSScreen} options={{ title: 'SOS', presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
