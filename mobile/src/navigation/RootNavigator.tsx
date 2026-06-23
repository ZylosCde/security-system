import React, { useMemo, useEffect } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { rootNavigationRef } from './rootNavigationRef';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthScreen } from '../screens/AuthScreen';
import { OfficerBindScreen } from '../screens/OfficerBindScreen';
import { ScanAuthQrScreen } from '../screens/ScanAuthQrScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAppTheme } from '../context/ThemeContext';
import { usePatrol } from '../context/PatrolContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, isDark } = useAppTheme();
  const { sosBroadcasting } = usePatrol();

  useEffect(() => {
    if (sosBroadcasting && rootNavigationRef.isReady()) {
      rootNavigationRef.navigate('Main', {
        screen: 'Patrols',
        params: { screen: 'SOSActive' }
      });
    }
  }, [sosBroadcasting]);

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
        <Stack.Screen name="ScanAuthQr" component={ScanAuthQrScreen} />
        <Stack.Screen name="OfficerBind" component={OfficerBindScreen} />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: true,
            title: 'Profile',
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.headerText,
            headerTitleStyle: { fontWeight: '600', fontSize: 17 },
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
