import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { Palette, Radius, Space } from '@/constants/design';
import { ThemedText } from '@/components/themed-text';
import type { Order } from '@/lib/types';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'completed' | 'cancelled';
type ViewMode = 'all' | 'followup';

type Props = {
  basePath: '/(cashier)';
  withCounts?: boolean;
  showViewToggle?: boolean;
};

function formatTime(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function statusColor(s: string) {
  switch (s) {
    case 'completed':
      return Palette.success;
    case 'ready':
      return Palette.mint;
    case 'on_the_way':
      return Palette.info;
    case 'preparing':
      return Palette.mid;
    case 'confirmed':
      return '#9B7B3C';
    case 'cancelled':
      return Palette.danger;
    default:
      return Palette.muted;
  }
}

export function OrderQueue({ basePath, withCounts, showViewToggle = true }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>(null);
  const [view, setView] = useState<ViewMode>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      if (view === 'followup') {
        const res = await api.get<any>('/orders/follow-up');
        const list = Array.isArray(res?.orders) ? res.orders : Array.isArray(res?.followUps) ? res.followUps : [];
        setFollowUps(list);
        return;
      }

      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (withCounts) params.set('withCounts', '1');
      params.set('limit', '80');
      const qs = params.toString();
      const res = await api.get<any>(`/orders/all${qs ? `?${qs}` : ''}`);
      setOrders(Array.isArray(res?.orders) ? res.orders : []);
      if (res?.counts) setCounts(res.counts);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, view, withCounts]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const openOrder = (id: string) => {
    router.push(`${basePath}/order-detail?orderId=${id}` as any);
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready' },
    { key: 'on_the_way', label: 'On way' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: Palette.surfaceAlt }}
      contentContainerStyle={{ padding: Space.lg, gap: Space.lg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Palette.brand} />}
    >
      {showViewToggle ? (
        <View className="flex-row rounded-xl overflow-hidden" style={{ backgroundColor: Palette.border }}>
          <Pressable onPress={() => setView('all')} className="flex-1 items-center py-2" style={{ backgroundColor: view === 'all' ? Palette.brand : 'transparent' }}>
            <Text className="text-sm font-medium" style={{ color: view === 'all' ? '#fff' : Palette.inkSoft }}>Order Queue</Text>
          </Pressable>
          <Pressable onPress={() => setView('followup')} className="flex-1 items-center py-2" style={{ backgroundColor: view === 'followup' ? Palette.brand : 'transparent' }}>
            <Text className="text-sm font-medium" style={{ color: view === 'followup' ? '#fff' : Palette.inkSoft }}>Follow-ups</Text>
          </Pressable>
        </View>
      ) : null}

      {view === 'all' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.sm }}>
            {filters.map((f) => {
              const active = status === f.key;
              const c = counts && f.key !== 'all' ? counts[f.key] : undefined;
              return (
                <Pressable key={f.key} onPress={() => setStatus(f.key)} className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5" style={{ backgroundColor: active ? Palette.brand : '#fff', borderWidth: active ? 0 : 1, borderColor: Palette.border }}>
                  <Text className="text-xs font-medium" style={{ color: active ? '#fff' : Palette.inkSoft }}>{f.label}</Text>
                  {typeof c === 'number' && c > 0 ? <Text className="text-xs" style={{ color: active ? '#fff' : Palette.muted }}>{c}</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {loading && !refreshing ? <ThemedText className="text-center" style={{ color: Palette.muted }}>Loading orders...</ThemedText> : null}
          {!loading && orders.length === 0 ? <ThemedText className="text-center" style={{ color: Palette.muted }}>No orders found</ThemedText> : null}

          <View className="gap-2">
            {orders.map((o) => {
              const name = o.isGuest ? (o.guestInfo ? `${o.guestInfo.firstName} ${o.guestInfo.lastName}` : 'Guest') : o.customerId ? 'Customer' : 'Guest';
              const sc = statusColor(o.orderStatus);
              return (
                <Pressable key={o._id} onPress={() => openOrder(o._id)} className="rounded-2xl p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="receipt-outline" size={18} color={Palette.brand} />
                      <Text className="font-semibold" style={{ color: Palette.ink }}>#{o._id.slice(-6).toUpperCase()}</Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: sc + '15' }}>
                      <Text className="text-xs font-medium capitalize" style={{ color: sc }}>{o.orderStatus.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between mt-2">
                    <View className="gap-0.5">
                      <Text className="text-sm" style={{ color: Palette.ink }}>{name}</Text>
                      <Text className="text-xs" style={{ color: Palette.muted }}>{o.orderType} · {formatTime(o.createdAt)}</Text>
                    </View>
                    <Text className="font-semibold" style={{ color: Palette.ink }}>₱{Number(o.totalAmount || 0).toLocaleString()}</Text>
                  </View>
                  {o.paymentStatus ? <Text className="text-xs mt-1 capitalize" style={{ color: o.paymentStatus === 'paid' ? Palette.success : Palette.muted }}>Payment: {o.paymentStatus.replace('_', ' ')}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <>
          {loading && !refreshing ? <ThemedText className="text-center" style={{ color: Palette.muted }}>Loading follow-ups...</ThemedText> : null}
          {!loading && followUps.length === 0 ? <ThemedText className="text-center" style={{ color: Palette.muted }}>No follow-up messages</ThemedText> : null}
          <View className="gap-2">
            {followUps.map((f, idx) => {
              const id = f.orderId || f._id || f.order?._id;
              return (
                <Pressable key={id || idx} onPress={() => id && openOrder(id)} className="rounded-2xl p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold" style={{ color: Palette.ink }}>#{String(id || '').slice(-6).toUpperCase()}</Text>
                    {typeof f.count === 'number' && f.count > 0 ? <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: Palette.accent }}><Text className="text-xs font-medium">{f.count}</Text></View> : null}
                  </View>
                  {f.lastMessage ? <Text className="text-sm mt-1" style={{ color: Palette.inkSoft }} numberOfLines={2}>{f.lastMessage}</Text> : null}
                  <Text className="text-xs mt-1" style={{ color: Palette.muted }}>{f.lastSender ? `From: ${f.lastSender}` : ''} {f.lastMessageAt ? formatTime(f.lastMessageAt) : ''}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}
