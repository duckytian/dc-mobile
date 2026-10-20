import { api } from './api';
import { isOnline as checkNetwork } from './network';
import { replaceProducts, replaceCategories, replaceIngredients, setSettings } from './repositories/catalogRepo';
import { upsertCounterOrders, deleteSyncedOrdersOlderThan } from './repositories/orderRepo';
import { getPending, markDone, markFailed } from './repositories/syncQueueRepo';

export async function isOnline(): Promise<boolean> {
  return checkNetwork();
}

async function pullCatalog(): Promise<void> {
  const [productsRes, categoriesRes, ingredientsRes, settingsRes] = await Promise.all([
    api.get<any>('/products'),
    api.get<any>('/categories'),
    api.get<any>('/ingredients'),
    api.get<any>('/settings')
  ]);
  if (Array.isArray(productsRes?.products)) await replaceProducts(productsRes.products);
  if (Array.isArray(categoriesRes?.categories)) await replaceCategories(categoriesRes.categories);
  if (Array.isArray(ingredientsRes?.ingredients)) await replaceIngredients(ingredientsRes.ingredients);
  if (settingsRes?.settings) await setSettings(settingsRes.settings);
}

async function pullCounterOrders(): Promise<void> {
  const res = await api.get<any>('/orders/counter');
  if (Array.isArray(res?.orders)) await upsertCounterOrders(res.orders);
}

async function pushPending(): Promise<void> {
  const pending = await getPending();
  for (const item of pending) {
    try {
      if (item.entity === 'order' && item.action === 'create_counter') {
        const res = await api.post<any>('/orders/counter', {
          customerInfo: item.payload.customerInfo,
          items: item.payload.items,
          totalAmount: item.payload.totalAmount,
          paymentMethod: item.payload.paymentMethod
        });
        if (res?.order) await upsertCounterOrders([res.order]);
        if (item.payload.localId) {
          const { getDb } = await import('./db');
          const db = await getDb();
          await db.runAsync('DELETE FROM order_items WHERE order_id=?', [item.payload.localId]);
          await db.runAsync('DELETE FROM orders WHERE id=?', [item.payload.localId]);
        }
        await markDone(item.id);
      } else if (item.entity === 'order' && item.action === 'update_status') {
        await api.patch(`/orders/${item.payload.orderId}/status`, { status: item.payload.status });
        await markDone(item.id);
      } else if (item.entity === 'order' && item.action === 'void_order') {
        await api.post(`/orders/counter/${item.payload.orderId}/void`, {});
        await markDone(item.id);
      } else {
        await markFailed(item.id, 'Unknown action');
      }
    } catch (e: any) {
      await markFailed(item.id, e?.message || 'Sync failed');
    }
  }
}

export async function syncAll(): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];
  const online = await isOnline();
  if (!online) return { ok: false, errors: ['Offline'] };

  try {
    await pushPending();
  } catch (e: any) {
    errors.push(e?.message || 'Push failed');
  }

  try {
    await pullCatalog();
  } catch (e: any) {
    errors.push(e?.message || 'Catalog sync failed');
  }

  try {
    await pullCounterOrders();
  } catch (e: any) {
    errors.push(e?.message || 'Orders sync failed');
  }

  try {
    await deleteSyncedOrdersOlderThan(30);
  } catch {
    // ignore
  }

  return { ok: errors.length === 0, errors };
}
