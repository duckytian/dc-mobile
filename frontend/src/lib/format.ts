import { Palette } from '@/constants/design';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'completed'
  | 'cancelled';

export type OrderType = 'pickup' | 'delivery' | 'reservation';
export type PaymentStatus = 'unpaid' | 'down_payment' | 'paid';

/** ₱1,234.00 — prices are stored in whole pesos but always shown with cents. */
export function formatPeso(amount: number | null | undefined): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/** Compact label for tight spaces: ₱1.2k */
export function formatPesoCompact(amount: number | null | undefined): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  if (Math.abs(value) >= 1000) {
    return `₱${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `₱${value.toLocaleString('en-PH')}`;
}

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  on_the_way: 'On the way',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status as OrderStatus] ?? status;
}

/** Foreground/background pair for a status pill. */
export function orderStatusColors(status: string): { fg: string; bg: string } {
  switch (status) {
    case 'pending':
      return { fg: Palette.warning, bg: Palette.warningSoft };
    case 'confirmed':
      return { fg: Palette.info, bg: Palette.infoSoft };
    case 'preparing':
      return { fg: Palette.info, bg: Palette.infoSoft };
    case 'ready':
      return { fg: Palette.success, bg: Palette.successSoft };
    case 'on_the_way':
      return { fg: Palette.brand, bg: Palette.surfaceTint };
    case 'completed':
      return { fg: Palette.success, bg: Palette.successSoft };
    case 'cancelled':
      return { fg: Palette.danger, bg: Palette.dangerSoft };
    default:
      return { fg: Palette.muted, bg: Palette.surfaceAlt };
  }
}

/** A customer-facing status line, with the delivery/pickup nuance spelled out. */
export function orderStatusHint(status: string, orderType?: string): string {
  switch (status) {
    case 'pending':
      return 'Waiting for the store to confirm your order.';
    case 'confirmed':
      return orderType === 'delivery'
        ? 'Confirmed! Your rider will be arranged shortly.'
        : 'Confirmed! We’ll start cooking soon.';
    case 'preparing':
      return 'Your order is being prepared.';
    case 'ready':
      return orderType === 'delivery'
        ? 'Ready and waiting for a rider to pick it up.'
        : 'Ready for pickup — come on over!';
    case 'on_the_way':
      return 'Your rider is on the way.';
    case 'completed':
      return 'Completed. Salamat!';
    case 'cancelled':
      return 'This order was cancelled.';
    default:
      return '';
  }
}

/** True while the order is still in progress (used for badges and polling). */
export function isActiveOrder(status: string): boolean {
  return status !== 'completed' && status !== 'cancelled';
}

/** Which statuses an order has already reached — drives the tracking stepper. */
export const TRACKING_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed'
];

export function trackingStepsFor(orderType?: string): OrderStatus[] {
  if (orderType === 'delivery') {
    return ['pending', 'confirmed', 'preparing', 'on_the_way', 'completed'];
  }
  return TRACKING_STEPS;
}

export function paymentStatusLabel(status?: string): string {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'down_payment':
      return 'Down payment';
    case 'unpaid':
      return 'Unpaid';
    default:
      return '—';
  }
}

export function orderTypeLabel(type?: string): string {
  switch (type) {
    case 'delivery':
      return 'Delivery';
    case 'pickup':
      return 'Pickup';
    case 'reservation':
      return 'Reservation';
    default:
      return 'Order';
  }
}

/** "Aug 3, 2:45 PM" — short enough for a list row. */
export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/** "2:45 PM" */
export function formatTime(value?: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

/** Short order reference from a Mongo id, e.g. "…4C52". */
export function orderReference(id?: string | null): string {
  if (!id) return '—';
  return `#${id.slice(-6).toUpperCase()}`;
}

export function initialsOf(firstName?: string, lastName?: string): string {
  const a = (firstName ?? '').trim().charAt(0);
  const b = (lastName ?? '').trim().charAt(0);
  return `${a}${b}`.toUpperCase() || '?';
}
