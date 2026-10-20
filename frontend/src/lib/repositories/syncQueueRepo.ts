import { getDb } from '../db';
import { newId } from '../id';

export type QueuedAction = {
  id: string;
  entity: string;
  action: string;
  payload: any;
  createdAt: string;
  attempts: number;
  lastError?: string | null;
  status: string;
};

export async function enqueue(entity: string, action: string, payload: any): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.runAsync(
    "INSERT INTO sync_queue (id,entity,action,payload,created_at,status) VALUES (?,?,?,?,datetime('now'),'pending')",
    [id, entity, action, JSON.stringify(payload)]
  );
  return id;
}

export async function getPending(): Promise<QueuedAction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM sync_queue WHERE status='pending' ORDER BY created_at ASC"
  );
  return rows.map((r) => ({
    id: r.id,
    entity: r.entity,
    action: r.action,
    payload: JSON.parse(r.payload),
    createdAt: r.created_at,
    attempts: r.attempts,
    lastError: r.last_error,
    status: r.status
  }));
}

export async function markDone(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_queue WHERE id=?', [id]);
}

export async function markFailed(id: string, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE sync_queue SET attempts=attempts+1, last_error=?, status='pending' WHERE id=?",
    [error, id]
  );
}

export async function countPending(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>("SELECT COUNT(*) as c FROM sync_queue WHERE status='pending'");
  return row?.c ?? 0;
}
