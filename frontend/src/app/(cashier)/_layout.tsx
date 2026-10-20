import { Stack } from 'expo-router';

export default function CashierLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="order-detail" />
      <Stack.Screen name="counter-create" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
