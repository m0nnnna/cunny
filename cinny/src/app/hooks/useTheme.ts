import { lightTheme } from 'folds';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onDarkFontWeight, onLightFontWeight } from '../../config.css';
import {
  butterTheme,
  darkTheme,
  nekoCyberpunkTheme,
  nekoDarkTheme,
  nekoLightTheme,
  nekoMintTheme,
  nekoSolarizedTheme,
  nekoSunsetTheme,
  silverTheme,
} from '../../colors.css';
import { settingsAtom } from '../state/settings';
import { useSetting } from '../state/hooks/settings';

export enum ThemeKind {
  Light = 'light',
  Dark = 'dark',
}

export type Theme = {
  id: string;
  kind: ThemeKind;
  classNames: string[];
};

export const LightTheme: Theme = {
  id: 'light-theme',
  kind: ThemeKind.Light,
  classNames: [lightTheme, onLightFontWeight, 'prism-light'],
};

export const SilverTheme: Theme = {
  id: 'silver-theme',
  kind: ThemeKind.Light,
  classNames: ['silver-theme', silverTheme, onLightFontWeight, 'prism-light'],
};
export const DarkTheme: Theme = {
  id: 'dark-theme',
  kind: ThemeKind.Dark,
  classNames: ['dark-theme', darkTheme, onDarkFontWeight, 'prism-dark'],
};
export const ButterTheme: Theme = {
  id: 'butter-theme',
  kind: ThemeKind.Dark,
  classNames: ['butter-theme', butterTheme, onDarkFontWeight, 'prism-dark'],
};

export const NekoDarkTheme: Theme = {
  id: 'neko-dark-theme',
  kind: ThemeKind.Dark,
  classNames: ['neko-dark-theme', nekoDarkTheme, onDarkFontWeight, 'prism-dark'],
};

export const NekoLightTheme: Theme = {
  id: 'neko-light-theme',
  kind: ThemeKind.Light,
  classNames: ['neko-light-theme', nekoLightTheme, onLightFontWeight, 'prism-light'],
};

export const NekoSunsetTheme: Theme = {
  id: 'neko-sunset-theme',
  kind: ThemeKind.Dark,
  classNames: ['neko-sunset-theme', nekoSunsetTheme, onDarkFontWeight, 'prism-dark'],
};

export const NekoMintTheme: Theme = {
  id: 'neko-mint-theme',
  kind: ThemeKind.Light,
  classNames: ['neko-mint-theme', nekoMintTheme, onLightFontWeight, 'prism-light'],
};

export const NekoCyberpunkTheme: Theme = {
  id: 'neko-cyberpunk-theme',
  kind: ThemeKind.Dark,
  classNames: ['neko-cyberpunk-theme', nekoCyberpunkTheme, onDarkFontWeight, 'prism-dark'],
};

export const NekoSolarizedTheme: Theme = {
  id: 'neko-solarized-theme',
  kind: ThemeKind.Dark,
  classNames: ['neko-solarized-theme', nekoSolarizedTheme, onDarkFontWeight, 'prism-dark'],
};

export const NEKO_THEME_IDS = [
  'neko-dark-theme',
  'neko-light-theme',
  'neko-sunset-theme',
  'neko-mint-theme',
  'neko-cyberpunk-theme',
  'neko-solarized-theme',
] as const;

export const isNekoThemeId = (id: string): boolean =>
  (NEKO_THEME_IDS as readonly string[]).includes(id);

export const useThemes = (): Theme[] => {
  const themes: Theme[] = useMemo(
    () => [
      LightTheme,
      SilverTheme,
      DarkTheme,
      ButterTheme,
      NekoLightTheme,
      NekoDarkTheme,
      NekoSunsetTheme,
      NekoMintTheme,
      NekoCyberpunkTheme,
      NekoSolarizedTheme,
    ],
    []
  );

  return themes;
};

export const useThemeNames = (): Record<string, string> =>
  useMemo(
    () => ({
      [LightTheme.id]: 'Light',
      [SilverTheme.id]: 'Silver',
      [DarkTheme.id]: 'Dark',
      [ButterTheme.id]: 'Butter',
      [NekoLightTheme.id]: 'Neko Light',
      [NekoDarkTheme.id]: 'Neko Dark',
      [NekoSunsetTheme.id]: 'Neko Sunset',
      [NekoMintTheme.id]: 'Neko Mint',
      [NekoCyberpunkTheme.id]: 'Neko Cyberpunk',
      [NekoSolarizedTheme.id]: 'Neko Solarized',
    }),
    []
  );

export const useSystemThemeKind = (): ThemeKind => {
  const darkModeQueryList = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);
  const [themeKind, setThemeKind] = useState<ThemeKind>(
    darkModeQueryList.matches ? ThemeKind.Dark : ThemeKind.Light
  );

  useEffect(() => {
    const handleMediaQueryChange = () => {
      setThemeKind(darkModeQueryList.matches ? ThemeKind.Dark : ThemeKind.Light);
    };

    darkModeQueryList.addEventListener('change', handleMediaQueryChange);
    return () => {
      darkModeQueryList.removeEventListener('change', handleMediaQueryChange);
    };
  }, [darkModeQueryList, setThemeKind]);

  return themeKind;
};

export const useActiveTheme = (): Theme => {
  const systemThemeKind = useSystemThemeKind();
  const themes = useThemes();
  const [systemTheme] = useSetting(settingsAtom, 'useSystemTheme');
  const [themeId] = useSetting(settingsAtom, 'themeId');
  const [lightThemeId] = useSetting(settingsAtom, 'lightThemeId');
  const [darkThemeId] = useSetting(settingsAtom, 'darkThemeId');

  if (!systemTheme) {
    const selectedTheme = themes.find((theme) => theme.id === themeId) ?? NekoDarkTheme;

    return selectedTheme;
  }

  const selectedTheme =
    systemThemeKind === ThemeKind.Dark
      ? themes.find((theme) => theme.id === darkThemeId) ?? NekoDarkTheme
      : themes.find((theme) => theme.id === lightThemeId) ?? NekoLightTheme;

  return selectedTheme;
};

const ThemeContext = createContext<Theme | null>(null);
export const ThemeContextProvider = ThemeContext.Provider;

export const useTheme = (): Theme => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('No theme provided!');
  }

  return theme;
};
