export function newId(): string {
  // Good enough for offline-created rows; server replaces with Mongo _id on sync.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
