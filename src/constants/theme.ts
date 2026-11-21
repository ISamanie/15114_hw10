/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  canvas: '#FFFFFF', surface: '#F8F9FA', accent: '#01875F', accentText: '#006448',
  mint: '#E6F4EA', text: '#202124', muted: '#5F6368', border: '#DADCE0',
  darkGreen: '#103E31', lightGreen: '#B7ECD1', blueTint: '#EAF1FC', blueInk: '#35578A',
  violetTint: '#F0EBFA', violetInk: '#65508A', danger: '#AA3026', dangerTint: '#FCEDEA',
} as const;

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.canvas,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.mint,
    textSecondary: Palette.muted,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;

export const Radius = { chip: 8, thumbnail: 12, card: 16, pill: 24 } as const;
