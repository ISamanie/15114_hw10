import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Palette, Radius } from '@/constants/theme';
import { Icon, type IconName } from './tracker-icon';

export function Screen({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
      style={ui.canvas} contentContainerStyle={[ui.scroll, { paddingBottom: Math.max(bottom, 16) + 16 }]}>
      <View style={ui.page}>{children}</View>
    </ScrollView>
  );
}

export function Action({ label, onPress, icon, variant = 'primary', disabled = false }: {
  label: string; onPress: () => void; icon?: IconName; variant?: 'primary' | 'quiet' | 'outline' | 'danger'; disabled?: boolean;
}) {
  const color = variant === 'primary' ? Palette.canvas : variant === 'danger' ? Palette.danger : Palette.accentText;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [ui.action, variant === 'primary' && ui.primary, variant === 'outline' && ui.outline,
        variant === 'danger' && ui.danger, (pressed || disabled) && ui.pressed]}>
      {icon && <Icon name={icon} size={18} color={color} />}
      <Text style={[ui.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, disabled = false }: {
  icon: IconName; label: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled}
      style={({ pressed }) => [ui.iconButton, (pressed || disabled) && ui.pressed]}>
      <Icon name={icon} size={20} />
    </Pressable>
  );
}

export function Chips<T extends string>({ options, value, onChange, label }: {
  options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      accessibilityLabel={label} contentContainerStyle={ui.chips}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)} style={({ pressed }) => [ui.chip, active && ui.chipActive, pressed && ui.pressed]}>
            <Text style={[ui.chipText, active && ui.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SearchField({ query, onChange, placeholder = 'Search exercises', onFocus, onBlur }: {
  query: string; onChange: (value: string) => void; placeholder?: string; onFocus?: () => void; onBlur?: () => void;
}) {
  return (
    <View style={ui.search}>
      <Icon name="search" size={20} color={Palette.muted} />
      <TextInput value={query} onChangeText={onChange} onFocus={onFocus} onBlur={onBlur} placeholder={placeholder}
        accessibilityLabel={placeholder} placeholderTextColor={Palette.muted} autoCapitalize="none" autoCorrect={false}
        returnKeyType="search" style={ui.searchInput} />
      {!!query && <IconButton icon="close" label="Clear search" onPress={() => onChange('')} />}
    </View>
  );
}

export function Empty({ title, detail, icon }: { title: string; detail?: string; icon?: IconName }) {
  return (
    <View style={ui.empty}>
      {icon && <Icon name={icon} color={Palette.accent} size={25} />}
      <Text style={ui.emphasis}>{title}</Text>
      {detail && <Text style={[ui.muted, ui.center]}>{detail}</Text>}
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="alert" style={ui.error}>{children}</Text>;
}

export function Loading() {
  return <View style={ui.loading}><ActivityIndicator color={Palette.accent} accessibilityLabel="Loading workouts" /></View>;
}

export const ui = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { flexGrow: 1 },
  page: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 20 },
  card: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.card, backgroundColor: Palette.canvas },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spread: { justifyContent: 'space-between' },
  flex: { flex: 1 },
  h1: { fontSize: 32, fontWeight: '800', color: Palette.text, letterSpacing: -0.85 },
  h2: { fontSize: 20, fontWeight: '700', color: Palette.text, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '700', color: Palette.text },
  emphasis: { fontSize: 15, fontWeight: '700', color: Palette.text },
  text: { fontSize: 15, color: Palette.text, lineHeight: 22 },
  muted: { fontSize: 13, color: Palette.muted, lineHeight: 19 },
  numeric: { fontVariant: ['tabular-nums'] },
  center: { textAlign: 'center' },
  action: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.pill,
    justifyContent: 'center', alignItems: 'center', gap: 6, flexDirection: 'row' },
  actionText: { fontSize: 14, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  primary: { backgroundColor: Palette.accent },
  outline: { borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.canvas },
  danger: { backgroundColor: Palette.dangerTint },
  pressed: { opacity: 0.6 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.thumbnail },
  chips: { gap: 8, alignItems: 'center' },
  chip: { minHeight: 42, borderRadius: Radius.chip, borderWidth: 1, borderColor: Palette.border,
    justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: Palette.mint, borderColor: Palette.mint },
  chipText: { color: Palette.muted, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: Palette.accentText },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 4,
    borderRadius: Radius.card, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surface },
  searchInput: { flex: 1, minHeight: 50, paddingRight: 8, fontSize: 16, color: Palette.text },
  empty: { minHeight: 120, justifyContent: 'center', alignItems: 'center', gap: 7, padding: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.canvas },
  error: { color: Palette.danger, fontSize: 14, lineHeight: 20 },
});
