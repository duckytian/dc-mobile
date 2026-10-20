import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'dc_access_token';
const REFRESH_KEY = 'dc_refresh_token';

function getWebStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

type MemoryTokens = {
  access?: string;
  refresh?: string;
};

const memory: MemoryTokens = {};

export const tokenStore = {
  async load(): Promise<MemoryTokens> {
    const [access, refresh] = await Promise.all([
      getItem(ACCESS_KEY),
      getItem(REFRESH_KEY)
    ]);
    memory.access = access ?? undefined;
    memory.refresh = refresh ?? undefined;
    return { ...memory };
  },

  get access(): string | undefined {
    return memory.access;
  },

  get refresh(): string | undefined {
    return memory.refresh;
  },

  async set(access: string, refresh: string): Promise<void> {
    memory.access = access;
    memory.refresh = refresh;
    await Promise.all([
      setItem(ACCESS_KEY, access),
      setItem(REFRESH_KEY, refresh)
    ]);
  },

  async setAccess(access: string): Promise<void> {
    memory.access = access;
    await setItem(ACCESS_KEY, access);
  },

  async clear(): Promise<void> {
    memory.access = undefined;
    memory.refresh = undefined;
    await Promise.all([deleteItem(ACCESS_KEY), deleteItem(REFRESH_KEY)]);
  }
};