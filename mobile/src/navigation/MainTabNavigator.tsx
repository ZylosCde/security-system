import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import type { MainTabParamList } from './types';
import { PatrolStackNavigator } from './PatrolStackNavigator';
import { DashboardScreen } from '../screens/DashboardScreen';
import { useAppTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICON_MAP: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Patrols: 'footsteps-outline',
};

const ICON_ACTIVE: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Patrols: 'footsteps',
};

export function MainTabNavigator() {
  const { colors } = useAppTheme();

  const screenOptions = useMemo(
    () =>
      ({ route }: { route: { name: keyof MainTabParamList } }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.divider,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500' as const,
        },
        tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
          <Ionicons
            name={focused ? ICON_ACTIVE[route.name] : ICON_MAP[route.name]}
            size={size - 2}
            color={color}
          />
        ),
      }),
    [colors]
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Patrols" component={PatrolStackNavigator} options={{ title: 'Patrols' }} />
    </Tab.Navigator>
  );
}
