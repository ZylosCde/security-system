import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { rootNavigationRef } from './rootNavigationRef';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthScreen } from '../screens/AuthScreen';
import { OfficerBindScreen } from '../screens/OfficerBindScreen';
import { FieldTheme } from '../theme/fieldTheme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: FieldTheme.bg,
    card: FieldTheme.bg,
    primary: FieldTheme.primary,
    text: FieldTheme.textOnDark,
    border: FieldTheme.border,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer ref={rootNavigationRef} theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: FieldTheme.bg },
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="OfficerBind" component={OfficerBindScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
