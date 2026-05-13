import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PatrolProvider } from './src/context/PatrolContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PatrolProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </PatrolProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
