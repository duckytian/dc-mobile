import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Space } from '@/constants/design';

/** Centered spinner for a first load. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={Palette.brand} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

/** Inline error with a retry affordance — never a dead end. */
export function ErrorState({
  message = 'Something went wrong.',
  onRetry
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.centered}>
      <ThemedText selectable type="default" style={styles.errorTitle}>
        Couldn’t load this
      </ThemedText>
      <ThemedText selectable type="small" themeColor="textSecondary" style={styles.centerText}>
        {message}
      </ThemedText>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retry} accessibilityRole="button">
          <ThemedText type="smallBold" style={styles.retryText}>
            Try again
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Empty result state with an optional call to action. */
export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.centered}>
      <ThemedText type="default" style={styles.emptyTitle}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {description}
        </ThemedText>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    paddingVertical: Space['3xl'],
    paddingHorizontal: Space.lg
  },
  centerText: { textAlign: 'center' },
  errorTitle: { color: Palette.danger, fontWeight: '700' },
  emptyTitle: { fontWeight: '600' },
  retry: {
    marginTop: Space.sm,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.lg,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceTint
  },
  retryText: { color: Palette.brand }
});
