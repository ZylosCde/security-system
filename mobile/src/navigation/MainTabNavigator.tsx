import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList } from './types';
import { PatrolStackNavigator } from './PatrolStackNavigator';
import { DashboardScreen } from '../screens/DashboardScreen';
import { OfficersTabScreen } from '../screens/OfficersTabScreen';
import { DevicesTabScreen } from '../screens/DevicesTabScreen';
import { SettingsTabScreen } from '../screens/SettingsTabScreen';
import { useAppTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICON_MAP: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'grid-outline',
  Patrols: 'walk-outline',
  Officers: 'people-outline',
  Devices: 'hardware-chip-outline',
  Settings: 'settings-outline',
};

export function MainTabNavigator() {
  const { colors } = useAppTheme();

  const screenOptions = useMemo(
    () =>
      ({ route }: { route: { name: keyof MainTabParamList } }) => ({
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textOnDark,
        headerTitleStyle: { fontWeight: '600' as const },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
        tabBarIcon: ({ color, size }: { color: string; size: number }) => (
          <Ionicons name={ICON_MAP[route.name]} size={size} color={color} />
        ),
      }),
    [colors]
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard', headerShown: false }} />
      <Tab.Screen name="Patrols" component={PatrolStackNavigator} options={{ title: 'Patrols', headerShown: false }} />
      <Tab.Screen name="Officers" component={OfficersTabScreen} options={{ title: 'Officers' }} />
      <Tab.Screen name="Devices" component={DevicesTabScreen} options={{ title: 'Devices' }} />
      <Tab.Screen name="Settings" component={SettingsTabScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
