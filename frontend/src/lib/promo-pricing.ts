/**
 * Promotion pricing, ported 1:1 from the web app's `lib/utils/promoPricing.ts`
 * so a cart totals the same on both clients.
 *
 * Server-side the cart only stores base prices; the discount is a display +
 * checkout concern, resolved here from the active promo list.
 */
import type { Product } from './types';

export type PromoType = 'percentage' | 'fixed_amount' | 'bundle';

export type Promo = {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  promoType: PromoType;
  /** Bundle promos only. */
  price?: number;
  /** `percentage` promos only. */
  discountRate?: number;
  /** `fixed_amount` promos only. */
  discountAmount?: number;
  /** Products a discount applies to. */
  productIds?: string[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

export type PromoBadge = { kind: 'bundle' | 'discount'; label: string } | null;

function discountPromosFor(promos: Promo[], productId: string): Promo[] {
  return promos.filter(
    p =>
      (p.promoType === 'percentage' || p.promoType === 'fixed_amount') &&
      Array.isArray(p.productIds) &&
      p.productIds.includes(productId)
  );
}

export function getPromoBadgeForProduct({
  promos,
  productId
}: {
  promos: Promo[];
  productId: string;
}): PromoBadge {
  const applicable = discountPromosFor(promos, productId);
  if (applicable.length === 0) return null;

  const p = applicable[0];

  if (p.promoType === 'percentage' && typeof p.discountRate === 'number') {
    return { kind: 'discount', label: `${p.discountRate}% OFF` };
  }
  if (p.promoType === 'fixed_amount' && typeof p.discountAmount === 'number') {
    return { kind: 'discount', label: `₱${p.discountAmount} OFF` };
  }
  return { kind: 'discount', label: 'PROMO' };
}

export function getDiscountedUnitPrice({
  promos,
  productId,
  basePrice
}: {
  promos: Promo[];
  productId: string;
  basePrice: number;
}): { unitPrice: number; badge: PromoBadge } {
  const badge = getPromoBadgeForProduct({ promos, productId });
  if (!badge) return { unitPrice: basePrice, badge: null };

  const applicable = discountPromosFor(promos, productId);
  if (applicable.length === 0) return { unitPrice: basePrice, badge: null };

  const p = applicable[0];
  let discounted = basePrice;

  if (p.promoType === 'percentage' && typeof p.discountRate === 'number') {
    discounted = basePrice * (1 - p.discountRate / 100);
  }
  if (p.promoType === 'fixed_amount' && typeof p.discountAmount === 'number') {
    discounted = basePrice - p.discountAmount;
  }

  const safe = Math.max(0, Math.round(discounted));
  if (safe >= basePrice) return { unitPrice: basePrice, badge };
  return { unitPrice: safe, badge };
}

export function getBundleBadge(): PromoBadge {
  return { kind: 'bundle', label: 'BUNDLE' };
}

/** Active bundle promos, i.e. those with a fixed price. */
export function bundlePromos(promos: Promo[]): (Promo & { price: number })[] {
  return promos.filter(
    (p): p is Promo & { price: number } =>
      p.promoType === 'bundle' && typeof p.price === 'number'
  );
}

/**
 * Pre-orders are products with batch windows. The customer UI hides a batch
 * that has no stock left and shows the remaining allowance otherwise.
 */
export function isPreOrderProduct(product: Product): boolean {
  return product.isPreOrder === true;
}

export type PreOrderDisplay = {
  closed: boolean;
  orderable: boolean;
  statusLine: string;
  subLine: string;
};

/** Units left across every batch of a pre-order product. */
function batchRemaining(product: Product): number {
  return (product.preOrderBatches ?? []).reduce(
    (sum, batch) => sum + Math.max(0, batch.stock - batch.sold),
    0
  );
}

export function preOrderDisplay(product: Product): PreOrderDisplay {
  if (!isPreOrderProduct(product)) {
    return { closed: false, orderable: true, statusLine: '', subLine: '' };
  }

  const batches = product.preOrderBatches ?? [];
  const remaining = batchRemaining(product);
  const allowanced =
    typeof product.preOrderRemainingAllowance === 'number'
      ? product.preOrderRemainingAllowance
      : null;

  const deadline = product.preOrderDeadline ? new Date(product.preOrderDeadline) : null;
  const deadlinePassed =
    deadline !== null && !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();

  const soldOut = batches.length > 0 && remaining <= 0;
  const limitReached = allowanced !== null && allowanced <= 0;
  const closed = soldOut || deadlinePassed || limitReached;

  return {
    closed,
    orderable: !closed,
    statusLine: deadlinePassed
      ? 'Pre-order closed'
      : batches.length > 0
        ? `${remaining} left in this batch`
        : 'Pre-order',
    subLine:
      limitReached
        ? 'You’ve reached your limit'
        : allowanced !== null
          ? `${allowanced} left you can order`
          : 'Limited batch'
  };
}
