import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('cashier.db');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0,
      stock_unit TEXT,
      description TEXT,
      image_url TEXT,
      prep_time_minutes INTEGER,
      is_available INTEGER NOT NULL DEFAULT 1,
      allergens TEXT,
      ingredients TEXT,
      points_cost INTEGER,
      is_pre_order INTEGER NOT NULL DEFAULT 0,
      pre_order_purchase_limit INTEGER,
      pre_order_deadline TEXT,
      pre_order_batches TEXT,
      pre_order_ordered_today INTEGER,
      pre_order_remaining_allowance INTEGER,
      promo_type TEXT,
      discount_rate REAL,
      discount_amount REAL,
      is_promo_active INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT,
      icon_key TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      key TEXT,
      name TEXT NOT NULL,
      icon_key TEXT,
      status TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      is_guest INTEGER NOT NULL DEFAULT 0,
      guest_info TEXT,
      order_type TEXT NOT NULL,
      order_source TEXT NOT NULL DEFAULT 'in-store',
      total_amount REAL NOT NULL DEFAULT 0,
      delivery_fee REAL NOT NULL DEFAULT 0,
      rider_notes TEXT,
      change_for TEXT,
      cancel_reason TEXT,
      order_status TEXT NOT NULL DEFAULT 'pending',
      status_history TEXT,
      estimated_prep_minutes INTEGER,
      estimated_ready_at TEXT,
      overdue_notified_at TEXT,
      stock_deducted INTEGER NOT NULL DEFAULT 0,
      points_awarded INTEGER,
      points_reversed INTEGER NOT NULL DEFAULT 0,
      payment_status TEXT DEFAULT 'unpaid',
      payment_verified INTEGER NOT NULL DEFAULT 0,
      payment_proof_url TEXT,
      payment_note TEXT,
      payment_method TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      local_only INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      price REAL NOT NULL DEFAULT 0,
      prep_time_minutes INTEGER,
      special_request TEXT,
      pre_order_batch_start TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      order_id TEXT,
      review_id TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      product_name TEXT,
      type TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      previous_stock REAL,
      new_stock REAL,
      reason TEXT,
      note TEXT,
      performed_by TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
  `);
}
