import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcons, type IconName } from '@/constants/icons';

/** The semantic icon names accepted by `AppIcon`. */
export type AppIconName = IconName;

/**
 * Cross-platform icon.
 *
 * `SymbolView` renders real SF Symbols on iOS and Material Symbols on Android.
 * Pass an `IconName` for the shared semantic set, or an explicit
 * `{ sf, material }` pair for a one-off glyph.
 */
export function AppIcon({
  name,
  size = 22,
  color,
  style
}: {
  name: IconName | { sf: string; material: string };
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const pair =
    typeof name === 'string' ? AppIcons[name] : { sf: name.sf, material: name.material };

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <SymbolView
        name={{ ios: pair.sf as never, android: pair.material as never }}
        size={size}
        tintColor={color}
        type="monochrome"
        fallback={<View style={{ width: size, height: size }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' }
});
