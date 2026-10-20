import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Palette, Space } from '@/constants/design';

/**
 * Scrollable screen body with correct insets.
 *
 * `hasTabBar` adds the bottom inset for the native tab bar; screens that push
 * over the tabs (e.g. a detail page) pass `false` and rely on their own padding.
 */
export function ScreenScroll({
  children,
  contentStyle,
  hasTabBar = true,
  horizontalPadding = Space.lg
}: {
  children: ReactNode;
  contentStyle?: ViewStyle;
  hasTabBar?: boolean;
  horizontalPadding?: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        {
          paddingTop: Space.lg,
          paddingBottom: (hasTabBar ? 0 : insets.bottom) + Space['3xl'],
          paddingHorizontal: horizontalPadding
        },
        contentStyle
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
      {children}
    </ScrollView>
  );
}

/** Non-scrolling full-height screen body. */
export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.flex, styles.screen, style]}>{children}</View>;
}

/**
 * Large title block used at the top of a scrollable screen.
 * Prefer a Stack title for pushed screens; use this for tab roots.
 */
export function ScreenHeading({
  title,
  subtitle,
  accessory
}: {
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
}) {
  return (
    <View style={styles.heading}>
      <View style={styles.headingText}>
        <ThemedText type="subtitle" style={styles.headingTitle}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {accessory}
    </View>
  );
}

/** Section label with an optional trailing action. */
export function SectionHeader({
  title,
  action
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: Palette.surface },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Space.md,
    marginBottom: Space.lg
  },
  headingText: { flex: 1, gap: 2 },
  headingTitle: { fontSize: 28, lineHeight: 34 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.sm,
    marginTop: Space.xs
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: Palette.ink,
    letterSpacing: 0.2
  }
});
