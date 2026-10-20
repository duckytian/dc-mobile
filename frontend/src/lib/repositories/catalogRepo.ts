import { getDb } from '../db';
import type { Category, Ingredient, Product } from '../types';

export async function getProducts(): Promise<Product[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM products ORDER BY name');
  return rows.map(rowToProduct);
}

export async function replaceProducts(products: Product[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM products');
    for (const p of products) {
      await db.runAsync(
        `INSERT INTO products (
          id,name,category,price,stock,stock_unit,description,image_url,prep_time_minutes,
          is_available,allergens,ingredients,points_cost,is_pre_order,pre_order_purchase_limit,
          pre_order_deadline,pre_order_batches,pre_order_ordered_today,pre_order_remaining_allowance,
          promo_type,discount_rate,discount_amount,is_promo_active,updated_at,synced_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
        [
          p._id,
          p.name,
          p.category,
          p.price,
          p.stock ?? 0,
          p.stockUnit ?? null,
          p.description ?? null,
          p.imageUrl ?? null,
          p.prepTimeMinutes ?? null,
          p.isAvailable ? 1 : 0,
          JSON.stringify(p.allergens ?? []),
          p.ingredients ? JSON.stringify(p.ingredients) : null,
          p.pointsCost ?? null,
          p.isPreOrder ? 1 : 0,
          p.preOrderPurchaseLimit ?? null,
          p.preOrderDeadline ?? null,
          p.preOrderBatches ? JSON.stringify(p.preOrderBatches) : null,
          p.preOrderOrderedToday ?? null,
          p.preOrderRemainingAllowance ?? null,
          p.promoType ?? null,
          p.discountRate ?? null,
          p.discountAmount ?? null,
          p.isPromoActive ? 1 : 0,
          null
        ]
      );
    }
  });
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM categories ORDER BY name');
  return rows.map((r) => ({
    _id: r.id,
    name: r.name,
    imageUrl: r.image_url ?? undefined,
    iconKey: r.icon_key ?? undefined
  }));
}

export async function replaceCategories(categories: Category[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM categories');
    for (const c of categories) {
      await db.runAsync(
        'INSERT INTO categories (id,name,image_url,icon_key,synced_at) VALUES (?,?,?,?,datetime(\'now\'))',
        [c._id, c.name, c.imageUrl ?? null, c.iconKey ?? null]
      );
    }
  });
}

export async function getIngredients(): Promise<Ingredient[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM ingredients ORDER BY name');
  return rows.map((r) => ({
    _id: r.id,
    key: r.key ?? undefined,
    name: r.name,
    iconKey: r.icon_key ?? undefined,
    status: r.status ?? undefined
  }));
}

export async function replaceIngredients(ingredients: Ingredient[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM ingredients');
    for (const i of ingredients) {
      await db.runAsync(
        'INSERT INTO ingredients (id,key,name,icon_key,status,synced_at) VALUES (?,?,?,?,?,datetime(\'now\'))',
        [i._id, i.key ?? null, i.name, i.iconKey ?? null, i.status ?? null]
      );
    }
  });
}

export async function getSettings(): Promise<any | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>("SELECT data FROM settings WHERE key='store'");
  return row ? JSON.parse(row.data) : null;
}

export async function setSettings(settings: any): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO settings (key,data,updated_at,synced_at) VALUES ('store',?,datetime('now'),datetime('now')) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at, synced_at=excluded.synced_at",
    [JSON.stringify(settings)]
  );
}

function rowToProduct(r: any): Product {
  return {
    _id: r.id,
    name: r.name,
    category: r.category ?? '',
    price: r.price,
    stock: r.stock,
    stockUnit: r.stock_unit ?? undefined,
    description: r.description ?? undefined,
    imageUrl: r.image_url ?? undefined,
    prepTimeMinutes: r.prep_time_minutes ?? undefined,
    isAvailable: !!r.is_available,
    allergens: r.allergens ? JSON.parse(r.allergens) : [],
    ingredients: r.ingredients ? JSON.parse(r.ingredients) : undefined,
    pointsCost: r.points_cost ?? undefined,
    isPreOrder: !!r.is_pre_order,
    preOrderPurchaseLimit: r.pre_order_purchase_limit ?? undefined,
    preOrderDeadline: r.pre_order_deadline ?? undefined,
    preOrderBatches: r.pre_order_batches ? JSON.parse(r.pre_order_batches) : undefined,
    preOrderOrderedToday: r.pre_order_ordered_today ?? undefined,
    preOrderRemainingAllowance: r.pre_order_remaining_allowance ?? undefined,
    promoType: r.promo_type ?? undefined,
    discountRate: r.discount_rate ?? undefined,
    discountAmount: r.discount_amount ?? undefined,
    isPromoActive: !!r.is_promo_active
  };
}
