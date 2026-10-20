import { useRouter, type Href } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode
} from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export const BrandColor = '#3C5E45';
export const LinkColor = '#3C5E45';

/** Space kept between the focused field and the keyboard / viewport edge. */
const FIELD_MARGIN = 24;

type ScrollFieldIntoView = (node: View | null) => void;

const AuthScrollContext = createContext<ScrollFieldIntoView>(() => {});

/** Lets a `FormField` ask the surrounding `AuthLayout` to reveal it above the keyboard. */
export function useAuthFieldScroll(): ScrollFieldIntoView {
  return useContext(AuthScrollContext);
}

export function BrandHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="items-center gap-2">
      <Image
        source={require('@/assets/images/donclaudios-logo.png')}
        style={{ width: 96, height: 96, borderRadius: 16 }}
        resizeMode="contain"
      />
      <ThemedText type="title" className="text-center">
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" className="text-center">
        {subtitle}
      </ThemedText>
    </View>
  );
}

export function AuthLayout({
  children,
  footer
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const focusedField = useRef<View | null>(null);
  const scrollY = useRef(0);

  /**
   * Scroll the focused field above the keyboard.
   *
   * On Android with edge-to-edge (the default in Expo Go since SDK 54) the OS no
   * longer resizes the window for the keyboard, so nothing scrolls the focused
   * input into view on its own — the field just sits behind the keyboard.
   *
   * `KeyboardAvoidingView` shrinks the ScrollView to the visible area; we then
   * measure both the field and the viewport in window coordinates and scroll if
   * the field's bottom falls below the visible area.
   */
  const ensureFocusedFieldVisible = useCallback(() => {
    const field = focusedField.current;
    const scroll = scrollRef.current;
    if (!field || !scroll) {
      return;
    }

    field.measureInWindow((_fieldX, fieldY, _fieldWidth, fieldHeight) => {
      scroll
        .getNativeScrollRef()
        ?.measureInWindow((_x: number, y: number, _width: number, height: number) => {
          const visibleBottom = y + height - FIELD_MARGIN;
          const overflow = fieldY + fieldHeight - visibleBottom;
          if (overflow > 0) {
            scroll.scrollTo({ y: scrollY.current + overflow, animated: true });
          }
        });
    });
  }, []);

  const scrollFieldIntoView = useCallback<ScrollFieldIntoView>(
    (node) => {
      focusedField.current = node;
      ensureFocusedFieldVisible();
    },
    [ensureFocusedFieldVisible]
  );

  // Re-check once the keyboard has settled, in addition to the viewport layout
  // change below. This is a one-shot scroll, not a per-frame keyboard animation.
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      ensureFocusedFieldVisible
    );
    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      ensureFocusedFieldVisible
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [ensureFocusedFieldVisible]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }
        ]}
        // When the keyboard opens, `KeyboardAvoidingView` shrinks the viewport,
        // which fires this — the moment to reveal the focused field.
        onLayout={ensureFocusedFieldVisible}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}>
        <AuthScrollContext.Provider value={scrollFieldIntoView}>
          <ThemedView className="w-full max-w-[400px] self-center gap-8">
            {children}
            {footer}
          </ThemedView>
        </AuthScrollContext.Provider>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  }
});

export function AuthFooterLink({
  prompt,
  link,
  onPress
}: {
  prompt: string;
  link: string;
  onPress: () => void;
}) {
  return (
    <View className="flex-row items-center justify-center gap-1">
      <ThemedText type="small" themeColor="textSecondary">
        {prompt}
      </ThemedText>
      <Pressable onPress={onPress}>
        <ThemedText type="smallBold" style={[{ color: LinkColor }]}>
          {link}
        </ThemedText>
      </Pressable>
    </View>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <ThemedText type="small" style={{ color: '#dc2626' }}>{message}</ThemedText>;
}

export function PrimaryButton({
  label,
  onPress,
  loading
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      className="items-center justify-center rounded-2xl py-4 active:opacity-80"
      style={{ backgroundColor: BrandColor }}
      onPress={onPress}
      disabled={loading}>
      <Text className="text-base font-semibold text-white">
        {loading ? 'Please wait\u2026' : label}
      </Text>
    </Pressable>
  );
}

export function useToAuth(path: Href) {
  const router = useRouter();
  return () => router.push(path);
}
