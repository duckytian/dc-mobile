import '../../global.css';

import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { syncAll } from '@/lib/sync';

SplashScreen.preventAutoHideAsync();

/** Cashier-only app: every signed-in user lands on the cashier dashboard. */
function homeFor(_type: 'customer' | 'cashier' | 'admin' | undefined) {
  return '(cashier)' as const;
}

function RootNavigator() {
  const { status, user } = useAuth();
  const theme = Colors.light;

  if (status === 'loading') {
    return null;
  }

  const home = homeFor(user?.type);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Paint every scene with the app background. Without this the scene is
        // transparent during a transition, so you see a flash of the window
        // background behind it — that's the "blink" between screens.
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right'
      }}>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verify-phone" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'signedIn'}>
        {/* Signing in swaps the whole group, so a cross-fade reads better than a push.
            Only the signed-in role's group is registered, so deep links into another
            role's routes simply don't resolve. */}
        <Stack.Screen name={home} options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}

function SyncBootstrap() {
  const { status } = useAuth();
  useEffect(() => {
    if (status !== 'signedIn') return;
    syncAll().catch(() => {});
    const timer = setInterval(() => {
      syncAll().catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, [status]);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={DefaultTheme}>
        <AuthProvider>
          <AnimatedSplashOverlay />
          <SyncBootstrap />
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }
});
