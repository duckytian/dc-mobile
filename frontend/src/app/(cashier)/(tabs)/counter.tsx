import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { listCounterOrdersCached, voidOrder as voidCounterOrder } from '@/lib/cashierService';
import { Palette, Space } from '@/constants/design';
import { ThemedText } from '@/components/themed-text';
import type { Order } from '@/lib/types';

export default function CashierCounterScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await listCounterOrdersCached();
      setOrders(list);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load counter orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const voidOrder = async (id: string) => {
    try {
      await voidCounterOrder(id);
      await load();
      Alert.alert('Voided', 'Counter order voided');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to void');
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: Palette.brand }}>
      <View className="px-4 py-3 flex-row items-center justify-between">
        <ThemedText className="text-lg font-semibold" style={{ color: '#fff' }}>Counter</ThemedText>
        <Pressable onPress={() => router.push('/(cashier)/counter-create' as any)} className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5" style={{ backgroundColor: '#fff' }}>
          <Ionicons name="add" size={16} color={Palette.brand} />
          <Text className="text-xs font-medium" style={{ color: Palette.brand }}>New</Text>
        </Pressable>
      </View>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: Palette.surfaceAlt }}
        contentContainerStyle={{ padding: Space.lg, gap: Space.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Palette.brand} />}
      >
        {loading && !refreshing ? <ThemedText className="text-center" style={{ color: Palette.muted }}>Loading...</ThemedText> : null}
        {!loading && orders.length === 0 ? <ThemedText className="text-center" style={{ color: Palette.muted }}>No counter orders</ThemedText> : null}
        <View className="gap-2">
          {orders.map((o) => (
            <Pressable key={o._id} onPress={() => router.push(`/(cashier)/order-detail?orderId=${o._id}` as any)} className="rounded-2xl p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold" style={{ color: Palette.ink }}>#{o._id.slice(-6).toUpperCase()}</Text>
                <Text className="text-xs" style={{ color: Palette.muted }}>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text className="text-sm mt-1" style={{ color: Palette.ink }}>{o.guestInfo ? `${o.guestInfo.firstName} ${o.guestInfo.lastName}` : 'Walk-in'}</Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-xs" style={{ color: Palette.muted }}>Payment: {o.paymentStatus || 'paid'}</Text>
                <Text className="font-semibold" style={{ color: Palette.ink }}>₱{Number(o.totalAmount||0).toLocaleString()}</Text>
              </View>
              <Pressable onPress={() => voidOrder(o._id)} className="self-end mt-2 px-2 py-1 rounded-full" style={{ backgroundColor: Palette.dangerSoft }}>
                <Text className="text-xs font-medium" style={{ color: Palette.danger }}>Void</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
