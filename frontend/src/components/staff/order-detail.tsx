import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { isOnline } from '@/lib/network';
import { getOrderWithItems, updateOrderStatusLocal } from '@/lib/repositories/orderRepo';
import { enqueue } from '@/lib/repositories/syncQueueRepo';
import { Palette, Radius, Space } from '@/constants/design';
import { ThemedText } from '@/components/themed-text';
import type { Order, OrderItem, SupportMessage } from '@/lib/types';

type Props = {
  backPath: string;
};

function statusColor(s: string) {
  switch (s) {
    case 'completed': return Palette.success;
    case 'ready': return Palette.mint;
    case 'on_the_way': return Palette.info;
    case 'preparing': return Palette.mid;
    case 'confirmed': return '#9B7B3C';
    case 'cancelled': return Palette.danger;
    default: return Palette.muted;
  }
}

export function StaffOrderDetail({ backPath }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = String(params.orderId || '');

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [msg, setMsg] = useState('');
  const [showChat, setShowChat] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const online = await isOnline();
      if (!online) {
        const cached = await getOrderWithItems(orderId);
        setOrder(cached.order);
        setItems(cached.items);
        return;
      }
      const [o, it] = await Promise.all([
        api.get<Order>(`/orders/${orderId}`),
        api.get<OrderItem[]>(`/orders/${orderId}/items`),
      ]);
      setOrder(o || null);
      setItems(it || []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const nextStatuses = useMemo(() => {
    if (!order) return [] as string[];
    const s = order.orderStatus;
    if (s === 'cancelled' || s === 'completed') return [];
    const list: string[] = [];
    if (s === 'pending') { list.push('confirmed'); list.push('cancelled'); }
    if (s === 'confirmed') { list.push('preparing'); list.push('cancelled'); }
    if (s === 'preparing') { list.push(order.orderType === 'delivery' ? 'on_the_way' : 'ready'); list.push('cancelled'); }
    if (s === 'ready') { list.push('completed'); list.push('cancelled'); }
    if (s === 'on_the_way') { list.push('completed'); list.push('cancelled'); }
    return list;
  }, [order]);

  const updateStatus = async (st: string) => {
    if (!orderId) return;
    setUpdating(true);
    try {
      const online = await isOnline();
      if (online) {
        await api.patch(`/orders/${orderId}/status`, { status: st });
      } else {
        await enqueue('order', 'update_status', { orderId, status: st });
      }
      await updateOrderStatusLocal(orderId, st).catch(() => {});
      await load();
      Alert.alert('Updated', `Status set to ${st.replace('_', ' ')}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const loadMessages = useCallback(async () => {
    if (!orderId) return;
    try {
      const m = await api.get<SupportMessage[]>(`/orders/${orderId}/messages/admin`);
      setMessages(m || []);
    } catch (e) {}
  }, [orderId]);

  useEffect(() => { if (showChat) loadMessages(); }, [showChat, loadMessages]);

  const sendMsg = async () => {
    if (!msg.trim()) return;
    try {
      await api.post(`/orders/${orderId}/messages/admin`, { body: msg });
      setMsg('');
      await loadMessages();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send message');
    }
  };

  const name = useMemo(() => {
    if (!order) return 'Customer';
    if (order.isGuest && order.guestInfo) return `${order.guestInfo.firstName} ${order.guestInfo.lastName}`;
    return 'Customer';
  }, [order]);

  const totalItems = useMemo(() => items.reduce((s, i) => s + (i.quantity || 0), 0), [items]);

  return (
    <View className="flex-1" style={{ backgroundColor: Palette.surfaceAlt }}>
      <View className="px-4 py-3 flex-row items-center justify-between" style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderColor: Palette.border }}>
        <Pressable onPress={() => router.replace(backPath as any)} className="flex-row items-center gap-2 px-2 py-1">
          <Ionicons name="arrow-back" size={20} color={Palette.ink} />
          <Text className="text-base font-medium" style={{ color: Palette.ink }}>Order</Text>
        </Pressable>
        {order && (
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor(order.orderStatus) + '15' }}>
            <Text className="text-xs font-medium capitalize" style={{ color: statusColor(order.orderStatus) }}>{order.orderStatus.replace('_', ' ')}</Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: Space.lg, gap: Space.lg }}>
        {loading ? <ThemedText className="text-center" style={{ color: Palette.muted }}>Loading...</ThemedText> : null}
        {order && (
          <>
            <View className="rounded-2xl p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold" style={{ color: Palette.ink }}>#{order._id.slice(-6).toUpperCase()}</Text>
                <Text className="text-sm" style={{ color: Palette.muted }}>{new Date(order.createdAt).toLocaleString()}</Text>
              </View>
              <View className="mt-2 gap-1">
                <Text className="text-sm" style={{ color: Palette.ink }}>{name}</Text>
                {order.guestInfo?.phoneNumber && <Text className="text-xs" style={{ color: Palette.muted }}>📱 {order.guestInfo.phoneNumber}</Text>}
                {order.guestInfo?.address && <Text className="text-xs" style={{ color: Palette.muted }}>{order.guestInfo.address}</Text>}
                <Text className="text-xs mt-1" style={{ color: Palette.muted }}>{order.orderType} · {order.orderSource}</Text>
                {order.paymentStatus && <Text className="text-xs capitalize mt-1" style={{ color: order.paymentStatus === 'paid' ? Palette.success : Palette.muted }}>Payment: {order.paymentStatus.replace('_',' ')}</Text>}
              </View>
            </View>

            <View className="rounded-2xl p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
              <Text className="font-semibold mb-2" style={{ color: Palette.ink }}>Items ({totalItems})</Text>
              <View className="gap-2">
                {items.map((i, idx) => (
                  <View key={idx} className="flex-row items-center justify-between py-2" style={{ borderTopWidth: idx === 0 ? 0 : 1, borderColor: Palette.divider }}>
                    <View className="flex-1">
                      <Text className="text-sm" style={{ color: Palette.ink }}>{(typeof i.productId !== 'string' && i.productId?.name) ? i.productId.name : 'Item'}</Text>
                      <Text className="text-xs" style={{ color: Palette.muted }}>Qty: {i.quantity} × ₱{Number(i.price||0).toLocaleString()}</Text>
                    </View>
                    <Text className="font-medium" style={{ color: Palette.ink }}>₱{Number((i.price||0)*(i.quantity||0)).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
              <View className="flex-row items-center justify-between mt-3 pt-3" style={{ borderTopWidth: 1, borderColor: Palette.divider }}>
                <Text className="font-semibold" style={{ color: Palette.ink }}>Total</Text>
                <Text className="font-semibold" style={{ color: Palette.ink }}>₱{Number(order.totalAmount||0).toLocaleString()}</Text>
              </View>
            </View>

            {nextStatuses.length > 0 && (
              <View className="rounded-2xl p-4" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
                <Text className="font-semibold mb-2" style={{ color: Palette.ink }}>Update Status</Text>
                <View className="flex-row flex-wrap gap-2">
                  {nextStatuses.map((s) => (
                    <Pressable key={s} disabled={updating} onPress={() => updateStatus(s)} className="px-3 py-2 rounded-full" style={{ backgroundColor: Palette.brand, opacity: updating ? 0.5 : 1 }}>
                      <Text className="text-sm font-medium" style={{ color: '#fff' }}>{s.replace('_',' ')}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Pressable onPress={() => setShowChat(v => !v)} className="rounded-2xl px-4 py-3 flex-row items-center justify-between" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="chatbubbles-outline" size={18} color={Palette.brand} />
                <Text className="font-medium" style={{ color: Palette.ink }}>Messages ({messages.length || 0})</Text>
              </View>
              <Ionicons name={showChat ? 'chevron-up' : 'chevron-down'} size={18} color={Palette.muted} />
            </Pressable>

            {showChat && (
              <View className="rounded-2xl p-4 gap-3" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
                <ScrollView className="max-h-60" contentContainerStyle={{ gap: Space.sm }}>
                  {messages.length === 0 && <Text className="text-xs text-center" style={{ color: Palette.muted }}>No messages</Text>}
                  {messages.map((m) => (
                    <View key={m._id || Math.random()} className="p-2 rounded-lg" style={{ backgroundColor: m.authorType === 'admin' ? Palette.surfaceTint : Palette.surfaceAlt, alignSelf: m.authorType === 'admin' ? 'flex-end' : 'flex-start' }}>
                      <Text className="text-xs" style={{ color: Palette.muted }}>{m.senderName || m.authorType}</Text>
                      <Text className="text-sm" style={{ color: Palette.ink }}>{m.body}</Text>
                    </View>
                  ))}
                </ScrollView>
                <View className="flex-row items-center gap-2">
                  <TextInput value={msg} onChangeText={setMsg} placeholder="Type a message..." className="flex-1 px-3 py-2 rounded-xl" style={{ backgroundColor: Palette.surfaceAlt, borderWidth: 1, borderColor: Palette.border }} />
                  <Pressable onPress={sendMsg} className="px-3 py-2 rounded-xl" style={{ backgroundColor: Palette.brand }}>
                    <Ionicons name="send" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
