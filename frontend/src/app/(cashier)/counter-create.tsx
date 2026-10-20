import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { loadProductsCached, createCounterOrder } from '@/lib/cashierService';
import { Palette, Space } from '@/constants/design';
import { ThemedText } from '@/components/themed-text';
import type { Product } from '@/lib/types';

type Line = { productId: string; name: string; price: number; qty: number };

export default function CounterCreateScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [firstName, setFirstName] = useState('Walk-in');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'gcash'>('cash');
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const p = await loadProductsCached();
      setProducts(p || []);
    } catch (e) {}
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const addLine = (pr: Product) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === pr._id);
      if (i >= 0) {
        const next = [...prev];
        next[i].qty += 1;
        return next;
      }
      return [...prev, { productId: pr._id, name: pr.name, price: pr.price, qty: 1 }];
    });
  };

  const dec = (idx: number) => setLines((prev) => {
    const next = [...prev];
    if (next[idx].qty <= 1) next.splice(idx, 1);
    else next[idx].qty -= 1;
    return next;
  });

  const inc = (idx: number) => setLines((prev) => { const next = [...prev]; next[idx].qty += 1; return next; });

  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines]);

  const submit = async () => {
    if (lines.length === 0) { Alert.alert('Add items'); return; }
    setSubmitting(true);
    try {
      const payload = {
        customerInfo: { firstName: firstName || 'Walk-in', lastName: lastName || '', phoneNumber: phone || '' },
        items: lines.map((l) => ({ productId: l.productId, quantity: l.qty, price: l.price })),
        totalAmount: total,
        paymentMethod,
        products,
      };
      const res = await createCounterOrder(payload);
      Alert.alert('Created', (res as any)?.offline ? 'Counter order saved offline; will sync when online' : 'Counter order created');
      router.replace('/(cashier)/(tabs)/counter' as any);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Palette.brand }}>
      <View className="px-4 py-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="px-2 py-1">
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <ThemedText className="text-lg font-semibold ml-2" style={{ color: '#fff' }}>New Counter Order</ThemedText>
      </View>
      <ScrollView className="flex-1" style={{ backgroundColor: Palette.surfaceAlt }} contentContainerStyle={{ padding: Space.lg, gap: Space.lg }}>
        <View className="rounded-2xl p-4 gap-3" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
          <Text className="font-semibold" style={{ color: Palette.ink }}>Customer</Text>
          <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" className="px-3 py-2 rounded-xl" style={{ backgroundColor: Palette.surfaceAlt, borderWidth: 1, borderColor: Palette.border }} />
          <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name (optional)" className="px-3 py-2 rounded-xl" style={{ backgroundColor: Palette.surfaceAlt, borderWidth: 1, borderColor: Palette.border }} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="Phone (optional)" className="px-3 py-2 rounded-xl" style={{ backgroundColor: Palette.surfaceAlt, borderWidth: 1, borderColor: Palette.border }} />
        </View>

        <View className="rounded-2xl p-4 gap-3" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
          <Text className="font-semibold" style={{ color: Palette.ink }}>Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.sm }}>
            {products.slice(0, 40).map((p) => (
              <Pressable key={p._id} onPress={() => addLine(p)} className="px-3 py-2 rounded-full" style={{ backgroundColor: Palette.surfaceTint }}>
                <Text className="text-xs font-medium" style={{ color: Palette.brand }}>{p.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {lines.length > 0 && (
          <View className="rounded-2xl p-4 gap-2" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
            {lines.map((l, idx) => (
              <View key={idx} className="flex-row items-center justify-between py-2" style={{ borderTopWidth: idx===0?0:1, borderColor: Palette.divider }}>
                <View className="flex-1">
                  <Text className="text-sm" style={{ color: Palette.ink }}>{l.name}</Text>
                  <Text className="text-xs" style={{ color: Palette.muted }}>₱{l.price.toLocaleString()}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Pressable onPress={() => dec(idx)} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: Palette.surfaceAlt }}><Ionicons name="remove" size={16} /></Pressable>
                  <Text style={{ color: Palette.ink }}>{l.qty}</Text>
                  <Pressable onPress={() => inc(idx)} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: Palette.surfaceAlt }}><Ionicons name="add" size={16} /></Pressable>
                </View>
              </View>
            ))}
            <View className="flex-row items-center justify-between mt-2 pt-2" style={{ borderTopWidth: 1, borderColor: Palette.divider }}>
              <Text className="font-semibold" style={{ color: Palette.ink }}>Total</Text>
              <Text className="font-semibold" style={{ color: Palette.ink }}>₱{total.toLocaleString()}</Text>
            </View>
          </View>
        )}

        <View className="rounded-2xl p-4 gap-3" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: Palette.border }}>
          <Text className="font-semibold" style={{ color: Palette.ink }}>Payment</Text>
          <View className="flex-row gap-2">
            {(['cash','card','gcash'] as const).map((m) => (
              <Pressable key={m} onPress={() => setPaymentMethod(m)} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: paymentMethod===m ? Palette.brand : Palette.surfaceAlt }}>
                <Text className="text-xs font-medium capitalize" style={{ color: paymentMethod===m ? '#fff' : Palette.inkSoft }}>{m}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable disabled={submitting} onPress={submit} className="rounded-2xl px-4 py-3 items-center" style={{ backgroundColor: Palette.brand, opacity: submitting ? 0.5 : 1 }}>
          <Text className="font-medium" style={{ color: '#fff' }}>{submitting ? 'Creating...' : 'Create Order'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
