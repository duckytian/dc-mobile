import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { Palette, Space } from '@/constants/design';
import { ThemedText } from '@/components/themed-text';

export default function CashierNotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>('/notifications/cashier');
      setNotifs(Array.isArray(res?.notifications) ? res.notifications : []);
    } catch (e) {}
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const readAll = async () => {
    try {
      await api.patch('/notifications/cashier/read-all', {});
      await load();
    } catch (e) {}
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Palette.brand }}>
      <View className="px-4 py-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="px-2 py-1"><Ionicons name="arrow-back" size={20} color="#fff" /></Pressable>
        <ThemedText className="text-lg font-semibold ml-2" style={{ color: '#fff' }}>Notifications</ThemedText>
        <Pressable onPress={readAll} className="ml-auto px-2 py-1"><Text className="text-xs" style={{ color: '#fff' }}>Mark all read</Text></Pressable>
      </View>
      <ScrollView className="flex-1" style={{ backgroundColor: Palette.surfaceAlt }} contentContainerStyle={{ padding: Space.lg, gap: Space.sm }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Palette.brand} />}>
        {notifs.length === 0 && <ThemedText className="text-center" style={{ color: Palette.muted }}>No notifications</ThemedText>}
        {notifs.map((n, idx) => (
          <View key={n._id || idx} className="rounded-2xl p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
            <Text className="font-medium" style={{ color: Palette.ink }}>{n.title}</Text>
            <Text className="text-sm mt-1" style={{ color: Palette.inkSoft }}>{n.message}</Text>
            <Text className="text-xs mt-1" style={{ color: Palette.muted }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
