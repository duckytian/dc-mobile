import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';

import { loadSettingsCached } from '@/lib/cashierService';
import { Palette, Space } from '@/constants/design';
import { ThemedText } from '@/components/themed-text';

export default function CashierSettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await loadSettingsCached();
        setSettings(s);
      } catch (e) {}
    })();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to sign out');
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: Palette.brand }}>
      <View className="px-4 py-3">
        <ThemedText className="text-lg font-semibold" style={{ color: '#fff' }}>Settings</ThemedText>
      </View>
      <ScrollView className="flex-1" style={{ backgroundColor: Palette.surfaceAlt }} contentContainerStyle={{ padding: Space.lg, gap: Space.lg }}>
        <View className="rounded-2xl p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
          <Text className="font-semibold mb-2" style={{ color: Palette.ink }}>Profile</Text>
          <Text className="text-sm" style={{ color: Palette.ink }}>{user?.firstName} {user?.lastName}</Text>
          {user?.email && <Text className="text-xs" style={{ color: Palette.muted }}>{user.email}</Text>}
        </View>
        <View className="rounded-2xl p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
          <Text className="font-semibold mb-2" style={{ color: Palette.ink }}>Store</Text>
          <Text className="text-sm" style={{ color: Palette.ink }}>{settings?.hero?.title || settings?.footer?.brandName || 'Don Claudio\'s'}</Text>
          {settings?.footer?.address && <Text className="text-xs" style={{ color: Palette.muted }}>{settings.footer.address}</Text>}
          {settings?.footer?.hours && <Text className="text-xs" style={{ color: Palette.muted }}>{settings.footer.hours}</Text>}
        </View>
        <Pressable onPress={() => router.push('/(cashier)/notifications' as any)} className="rounded-2xl px-4 py-3 flex-row items-center justify-between" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="notifications-outline" size={18} color={Palette.brand} />
            <Text className="font-medium" style={{ color: Palette.ink }}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Palette.muted} />
        </Pressable>
        <Pressable onPress={handleSignOut} className="rounded-2xl px-4 py-3 items-center" style={{ backgroundColor: Palette.danger }}>
          <Text className="font-medium" style={{ color: '#fff' }}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
