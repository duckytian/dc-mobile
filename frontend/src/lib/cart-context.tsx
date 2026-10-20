import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import { api } from './api';
import { getDiscountedUnitPrice, type Promo } from './promo-pricing';
import type { Cart, CartItem } from './types';

type CartContextValue = {
  items: CartItem[];
  count: number;
  /** Sum of line totals with any active promo discount applied. */
  subtotal: number;
  /** What the same items would cost with no promos — used to show savings. */
  listSubtotal: number;
  savings: number;
  /** Active promos, shared with the menu so badges and totals agree. */
  promos: Promo[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addItem: (item: {
    productId: string;
    name: string;
    price: number;
    quantity?: number;
    imageUrl?: string;
    instructions?: string;
  }) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * Cart state for the customer area.
 *
 * The server is the source of truth (it enforces stock and pre-order limits),
 * so every mutation round-trips and stores the returned cart. Promo pricing is
 * resolved locally from the live promo list, matching the web client.
 */
export function CartProvider({
  children,
  promos
}: {
  children: ReactNode;
  promos: Promo[];
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ cart: Cart | null }>('/api/cart/me');
      setItems(data.cart?.items ?? []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback<CartContextValue['addItem']>(
    async input => {
      const data = await api.post<{ cart: Cart }>('/api/cart/items', {
        productId: input.productId,
        name: input.name,
        price: input.price,
        quantity: input.quantity ?? 1,
        imageUrl: input.imageUrl,
        instructions: input.instructions
      });
      setItems(data.cart?.items ?? []);
    },
    []
  );

  const setQuantity = useCallback(async (productId: string, quantity: number) => {
    const data = await api.patch<{ cart: Cart }>(
      `/api/cart/items/${productId}`,
      { quantity }
    );
    setItems(data.cart?.items ?? []);
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    const data = await api.delete<{ cart: Cart }>(`/api/cart/items/${productId}`);
    setItems(data.cart?.items ?? []);
  }, []);

  const clear = useCallback(async () => {
    await api.delete('/api/cart/me');
    setItems([]);
  }, []);

  const totals = useMemo(() => {
    const list = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discounted = items.reduce((sum, i) => {
      const { unitPrice } = getDiscountedUnitPrice({
        promos,
        productId: i.productId,
        basePrice: i.price
      });
      return sum + unitPrice * i.quantity;
    }, 0);
    return { list, discounted: Math.round(discounted), savings: Math.round(list - discounted) };
  }, [items, promos]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: totals.discounted,
      listSubtotal: totals.list,
      savings: totals.savings,
      promos,
      loading,
      error,
      refresh,
      addItem,
      setQuantity,
      removeItem,
      clear
    }),
    [items, totals, promos, loading, error, refresh, addItem, setQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return ctx;
}
