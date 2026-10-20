import { api } from './api';
import { isOnline } from './sync';
import { enqueue } from './repositories/syncQueueRepo';
import { getCounterOrders, createCounterOrderLocal, updateOrderStatusLocal, voidOrderLocal, upsertCounterOrders } from './repositories/orderRepo';
import { getProducts, replaceProducts, getCategories, replaceCategories, getSettings, setSettings } from './repositories/catalogRepo';

export async function loadProductsCached() {
  const cached = await getProducts();
  if (cached.length) return cached;
  if (await isOnline()) {
    const res = await api.get<any>('/products');
    if (Array.isArray(res?.products)) {
      await replaceProducts(res.products);
      return res.products;
    }
  }
  return cached;
}

export async function loadCategoriesCached() {
  const cached = await getCategories();
  if (cached.length) return cached;
  if (await isOnline()) {
    const res = await api.get<any>('/categories');
    if (Array.isArray(res?.categories)) {
      await replaceCategories(res.categories);
      return res.categories;
    }
  }
  return cached;
}

export async function loadSettingsCached() {
  const cached = await getSettings();
  if (cached) return cached;
  if (await isOnline()) {
    const res = await api.get<any>('/settings');
    if (res?.settings) {
      await setSettings(res.settings);
      return res.settings;
    }
  }
  return null;
}

export async function listCounterOrdersCached() {
  const cached = await getCounterOrders();
  if (await isOnline()) {
    try {
      const res = await api.get<any>('/orders/counter');
      if (Array.isArray(res?.orders)) await upsertCounterOrders(res.orders);
    } catch {
      // ignore
    }
  }
  return getCounterOrders();
}

export async function createCounterOrder(payload: {
  customerInfo: { firstName: string; lastName: string; phoneNumber?: string };
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: string;
  products?: any[];
}) {
  const online = await isOnline();
  if (online) {
    const res = await api.post<any>('/orders/counter', {
      customerInfo: payload.customerInfo,
      items: payload.items,
      totalAmount: payload.totalAmount,
      paymentMethod: payload.paymentMethod
    });
    if (res?.order) await upsertCounterOrders([res.order]);
    return res;
  }
  const order = await createCounterOrderLocal(payload);
  await enqueue('order', 'create_counter', {
    customerInfo: payload.customerInfo,
    items: payload.items,
    totalAmount: payload.totalAmount,
    paymentMethod: payload.paymentMethod,
    localId: order._id
  });
  return { order, transaction: null, offline: true };
}

export async function updateOrderStatus(id: string, status: string) {
  const online = await isOnline();
  if (online) {
    await api.patch(`/orders/${id}/status`, { status });
  } else {
    await enqueue('order', 'update_status', { orderId: id, status });
  }
  await updateOrderStatusLocal(id, status);
}

export async function voidOrder(id: string) {
  const online = await isOnline();
  if (online) {
    await api.post(`/orders/counter/${id}/void`, {});
  } else {
    await enqueue('order', 'void_order', { orderId: id });
  }
  await voidOrderLocal(id);
}
