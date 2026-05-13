import React, { useMemo } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { rootNavigationRef } from './rootNavigationRef';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthScreen } from '../screens/AuthScreen';
import { OfficerBindScreen } from '../screens/OfficerBindScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAppTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, isDark } = useAppTheme();
  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.primary,
        background: colors.bg,
        card: colors.bgElevated,
        text: colors.textOnDark,
        border: colors.border,
        notification: colors.danger,
      },
    }),
    [colors, isDark]
  );

  return (
    <NavigationContainer ref={rootNavigationRef} theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="OfficerBind" component={OfficerBindScreen} />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: true,
            title: 'Profile',
            headerStyle: { backgroundColor: colors.bgElevated },
            headerTintColor: colors.textOnDark,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
