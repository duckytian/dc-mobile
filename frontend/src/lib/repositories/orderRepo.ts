import { getDb } from '../db';
import { newId } from '../id';
import type { Order, OrderItem } from '../types';

function rowToOrder(r: any, items: OrderItem[] = []): Order {
  return {
    _id: r.id,
    customerId: r.customer_id ?? undefined,
    isGuest: !!r.is_guest,
    guestInfo: r.guest_info ? JSON.parse(r.guest_info) : undefined,
    orderType: r.order_type,
    orderSource: r.order_source,
    totalAmount: r.total_amount,
    deliveryFee: r.delivery_fee,
    riderNotes: r.rider_notes ?? undefined,
    changeFor: r.change_for ?? undefined,
    cancelReason: r.cancel_reason ?? undefined,
    orderStatus: r.order_status,
    statusHistory: r.status_history ? JSON.parse(r.status_history) : [],
    estimatedPrepMinutes: r.estimated_prep_minutes ?? undefined,
    estimatedReadyAt: r.estimated_ready_at ?? undefined,


    pointsAwarded: r.points_awarded ?? undefined,

    paymentStatus: r.payment_status ?? undefined,
    paymentVerified: !!r.payment_verified,
    paymentProofUrl: r.payment_proof_url ?? undefined,
    paymentNote: r.payment_note ?? undefined,
    paymentMethod: r.payment_method ?? undefined,
    items,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function rowToOrderItem(r: any): OrderItem {
  return {
    _id: r.id,
    orderId: r.order_id,
    productId: JSON.parse(r.product),
    quantity: r.quantity,
    price: r.price,
    prepTimeMinutes: r.prep_time_minutes ?? undefined,
    preOrderBatchStart: r.pre_order_batch_start ?? undefined
  } as OrderItem;
}

export async function getCounterOrders(): Promise<Order[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM orders WHERE order_source='in-store' ORDER BY created_at DESC"
  );
  const orders: Order[] = [];
  for (const r of rows) {
    const itemRows = await db.getAllAsync<any>('SELECT * FROM order_items WHERE order_id=?', [r.id]);
    orders.push(rowToOrder(r, itemRows.map(rowToOrderItem)));
  }
  return orders;
}

export async function getOrderWithItems(id: string): Promise<{ order: Order | null; items: OrderItem[] }> {
  const db = await getDb();
  const r = await db.getFirstAsync<any>('SELECT * FROM orders WHERE id=?', [id]);
  if (!r) return { order: null, items: [] };
  const itemRows = await db.getAllAsync<any>('SELECT * FROM order_items WHERE order_id=?', [id]);
  const items = itemRows.map(rowToOrderItem);
  return { order: rowToOrder(r, items), items };
}

export async function upsertCounterOrders(serverOrders: any[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const o of serverOrders) {
      const id = String(o._id ?? o.id);
      await db.runAsync(
        `INSERT INTO orders (
          id,customer_id,is_guest,guest_info,order_type,order_source,total_amount,delivery_fee,
          rider_notes,change_for,cancel_reason,order_status,status_history,estimated_prep_minutes,
          estimated_ready_at,overdue_notified_at,stock_deducted,points_awarded,points_reversed,
          payment_status,payment_verified,payment_proof_url,payment_note,payment_method,created_at,
          updated_at,sync_status,local_only
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'synced', 0)
        ON CONFLICT(id) DO UPDATE SET
          order_status=excluded.order_status,
          total_amount=excluded.total_amount,
          payment_status=excluded.payment_status,
          payment_verified=excluded.payment_verified,
          payment_method=excluded.payment_method,
          status_history=excluded.status_history,
          updated_at=excluded.updated_at,
          sync_status='synced'
        `,
        [
          id,
          o.customerId ? String(o.customerId) : null,
          o.isGuest ? 1 : 0,
          o.guestInfo ? JSON.stringify(o.guestInfo) : null,
          o.orderType,
          o.orderSource ?? 'in-store',
          o.totalAmount ?? 0,
          o.deliveryFee ?? 0,
          o.riderNotes ?? null,
          o.changeFor ?? null,
          o.cancelReason ?? null,
          o.orderStatus,
          JSON.stringify(o.statusHistory ?? []),
          o.estimatedPrepMinutes ?? null,
          o.estimatedReadyAt ?? null,
          o.overdueNotifiedAt ?? null,
          o.stockDeducted ? 1 : 0,
          o.pointsAwarded ?? null,
          o.pointsReversed ? 1 : 0,
          o.paymentStatus ?? null,
          o.paymentVerified ? 1 : 0,
          o.paymentProofUrl ?? null,
          o.paymentNote ?? null,
          o.paymentMethod ?? null,
          o.createdAt ?? new Date().toISOString(),
          o.updatedAt ?? new Date().toISOString()
        ]
      );

      await db.runAsync('DELETE FROM order_items WHERE order_id=?', [id]);
      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        await db.runAsync(
          'INSERT INTO order_items (id,order_id,product,quantity,price,prep_time_minutes,pre_order_batch_start) VALUES (?,?,?,?,?,?,?)',
          [
            String(it._id ?? newId()),
            id,
            JSON.stringify(it.productId ?? {}),
            it.quantity ?? 1,
            it.price ?? 0,
            it.prepTimeMinutes ?? null,
            it.preOrderBatchStart ?? null
          ]
        );
      }
    }
  });
}

export async function createCounterOrderLocal(payload: {
  customerInfo: { firstName: string; lastName: string; phoneNumber?: string };
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: string;
  products?: any[];
}): Promise<Order> {
  const db = await getDb();
  const id = newId();
  const now = new Date().toISOString();
  const order: Order = {
    _id: id,
    isGuest: true,
    guestInfo: {
      firstName: payload.customerInfo.firstName,
      lastName: payload.customerInfo.lastName,
      phoneNumber: payload.customerInfo.phoneNumber ?? ''
    },
    orderType: 'pickup',
    orderSource: 'in-store',
    totalAmount: payload.totalAmount,
    deliveryFee: 0,
    orderStatus: 'completed',
    statusHistory: [{ status: 'completed', at: now }],
    paymentStatus: 'paid',
    paymentVerified: true,
    paymentMethod: payload.paymentMethod,
    items: [],
    createdAt: now,
    updatedAt: now
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO orders (
        id,is_guest,guest_info,order_type,order_source,total_amount,delivery_fee,order_status,
        status_history,payment_status,payment_verified,payment_method,created_at,updated_at,
        sync_status,local_only
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending', 1)`,
      [
        id,
        1,
        JSON.stringify(order.guestInfo),
        order.orderType,
        order.orderSource,
        order.totalAmount,
        0,
        order.orderStatus,
        JSON.stringify(order.statusHistory),
        order.paymentStatus ?? 'paid',
        1,
        payload.paymentMethod,
        now,
        now
      ]
    );

    for (const it of payload.items) {
      const product = (payload.products ?? []).find((p) => p._id === it.productId);
      await db.runAsync(
        'INSERT INTO order_items (id,order_id,product,quantity,price) VALUES (?,?,?,?,?)',
        [newId(), id, JSON.stringify(product ?? { _id: it.productId }), it.quantity, it.price]
      );
    }
  });

  return order;
}

export async function updateOrderStatusLocal(id: string, status: string): Promise<void> {
  const db = await getDb();
  const r = await db.getFirstAsync<any>('SELECT status_history FROM orders WHERE id=?', [id]);
  const history = r?.status_history ? JSON.parse(r.status_history) : [];
  history.push({ status, at: new Date().toISOString() });
  await db.runAsync(
    "UPDATE orders SET order_status=?, status_history=?, updated_at=?, sync_status='pending', local_only=1 WHERE id=?",
    [status, JSON.stringify(history), new Date().toISOString(), id]
  );
}

export async function voidOrderLocal(id: string): Promise<void> {
  await updateOrderStatusLocal(id, 'cancelled');
}

export async function deleteSyncedOrdersOlderThan(days: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "DELETE FROM orders WHERE sync_status='synced' AND local_only=0 AND created_at < datetime('now', ?)",
    [`-${days} days`]
  );
}
