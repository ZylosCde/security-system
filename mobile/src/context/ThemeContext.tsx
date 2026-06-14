import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ThemeColors } from '../theme/colors';
import { createUiStyles, type UiStyles } from '../theme/ui';

const STORAGE_THEME = 'aegis_theme_preference';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  colors: ThemeColors;
  ui: UiStyles;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveIsDark(pref: ThemePreference, system: string | null | undefined): boolean {
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  return system === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_THEME);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    void AsyncStorage.setItem(STORAGE_THEME, p);
  }, []);

  const isDark = useMemo(
    () => resolveIsDark(preference, systemScheme),
    [preference, systemScheme]
  );

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  const ui = useMemo(() => createUiStyles(colors), [colors]);

  const value = useMemo(
    () => ({ colors, ui, isDark, preference, setPreference, ready }),
    [colors, ui, isDark, preference, setPreference, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
