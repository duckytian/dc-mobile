import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Space } from '@/constants/design';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const HEIGHT: Record<ButtonSize, number> = { sm: 34, md: 44, lg: 52 };
const FONT: Record<ButtonSize, number> = { sm: 13, md: 15, lg: 16 };

/**
 * The single button used across the app. Keeps one visual language:
 * filled brand for the primary action, tinted for secondary, text-only for ghost.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}) {
  const isDisabled = disabled || loading;

  const background: Record<ButtonVariant, string> = {
    primary: Palette.brand,
    secondary: Palette.surfaceTint,
    ghost: 'transparent',
    danger: Palette.danger
  };
  const foreground: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: Palette.brand,
    ghost: Palette.brand,
    danger: '#FFFFFF'
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          backgroundColor: background[variant],
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto'
        },
        style
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground[variant]} size="small" />
      ) : (
        <ThemedText
          style={[styles.label, { color: foreground[variant], fontSize: FONT[size] }]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

/** Small rounded label, e.g. order status or a promo flag. */
export function Pill({
  label,
  color,
  background,
  style
}: {
  label: string;
  color: string;
  background: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: background }, style]}>
      <ThemedText style={[styles.pillText, { color }]}>{label}</ThemedText>
    </View>
  );
}

/** Rounded icon button for a header accessory (specify a 40x40 touch target). */
export function IconButton({
  onPress,
  children,
  accessibilityLabel,
  style
}: {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Space.lg,
    flexDirection: 'row',
    gap: Space.sm
  },
  label: { fontWeight: '700' },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill
  },
  pillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
