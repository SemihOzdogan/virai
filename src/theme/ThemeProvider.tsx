import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getColors, type ColorTokens } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AppTheme = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorTokens;
};

type ThemeContextValue = AppTheme & {
  setMode: (mode: ThemeMode) => Promise<void>;
};

const storageKey = 'virai-theme-mode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const hasChangedMode = useRef(false);

  useEffect(() => {
    let isActive = true;

    AsyncStorage.getItem(storageKey)
      .then(value => {
        if (
          isActive &&
          !hasChangedMode.current &&
          (value === 'system' || value === 'light' || value === 'dark')
        ) {
          setModeState(value);
        }
      })
      .catch(error => {
        console.warn('Tema tercihi yüklenemedi.', error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    hasChangedMode.current = true;
    setModeState(nextMode);
    await AsyncStorage.setItem(storageKey, nextMode);
  }, []);

  const isDark = mode === 'system' ? systemColorScheme !== 'light' : mode === 'dark';
  const value = useMemo(
    () => ({ mode, isDark, colors: getColors(isDark), setMode }),
    [isDark, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }
  return theme;
}
