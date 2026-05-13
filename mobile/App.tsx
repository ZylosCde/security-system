import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { PatrolProvider } from './src/context/PatrolContext';
import { RootNavigator } from './src/navigation/RootNavigator';

function ThemedStatusBar() {
  const { isDark } = useAppTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PatrolProvider>
            <ThemedStatusBar />
            <RootNavigator />
          </PatrolProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
