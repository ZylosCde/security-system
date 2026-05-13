import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList } from './types';
import { PatrolStackNavigator } from './PatrolStackNavigator';
import { DashboardScreen } from '../screens/DashboardScreen';
import { OfficersTabScreen } from '../screens/OfficersTabScreen';
import { DevicesTabScreen } from '../screens/DevicesTabScreen';
import { SettingsTabScreen } from '../screens/SettingsTabScreen';
import { FieldTheme } from '../theme/fieldTheme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: FieldTheme.bg },
        headerTintColor: FieldTheme.textOnDark,
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: FieldTheme.bgElevated,
          borderTopColor: FieldTheme.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: FieldTheme.tabActive,
        tabBarInactiveTintColor: FieldTheme.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const map: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'grid-outline',
            Patrols: 'walk-outline',
            Officers: 'people-outline',
            Devices: 'hardware-chip-outline',
            Settings: 'settings-outline',
          };
          return <Ionicons name={map[route.name as keyof MainTabParamList]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard', headerShown: false }} />
      <Tab.Screen name="Patrols" component={PatrolStackNavigator} options={{ title: 'Patrols', headerShown: false }} />
      <Tab.Screen name="Officers" component={OfficersTabScreen} options={{ title: 'Officers' }} />
      <Tab.Screen name="Devices" component={DevicesTabScreen} options={{ title: 'Devices' }} />
      <Tab.Screen name="Settings" component={SettingsTabScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
