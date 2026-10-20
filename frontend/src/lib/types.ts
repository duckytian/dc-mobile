/**
 * API response types shared by the mobile screens.
 *
 * These mirror what the Express API actually returns (verified against the
 * running server), not the raw Mongo documents — e.g. order items come back
 * with `productId` populated into an object.
 */

export type StockUnit = 'kg' | 'pc' | 'pack' | 'tray' | 'box' | 'bottle';

export type PreOrderBatch = {
  startTime: string;
  endTime: string;
  stock: number;
  sold: number;
};

export type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  stockUnit?: StockUnit;
  description?: string;
  imageUrl?: string;
  prepTimeMinutes?: number | null;
  isAvailable: boolean;
  allergens?: string[];
  ingredients?: unknown[];
  pointsCost?: number | null;

  isPreOrder?: boolean;
  preOrderPurchaseLimit?: number | null;
  preOrderDeadline?: string | null;
  preOrderBatches?: PreOrderBatch[] | null;
  /** Computed by the API: units the customer already ordered today. */
  preOrderOrderedToday?: number;
  /** Computed by the API: units the customer may still order. */
  preOrderRemainingAllowance?: number | null;

  /** Legacy single-promo fields still present on some documents. */
  promoType?: 'percentage' | 'fixed_amount' | 'bundle';
  discountRate?: number;
  discountAmount?: number;
  isPromoActive?: boolean;
};

export type Category = {
  _id: string;
  name: string;
  imageUrl?: string;
  iconKey?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  instructions?: string;
};

export type Cart = {
  _id?: string;
  customerId?: string;
  items: CartItem[];
};

export type OrderItemProduct = {
  _id: string;
  name: string;
  category?: string;
  imageUrl?: string;
  isPreOrder?: boolean;
};

export type OrderItem = {
  _id: string;
  orderId?: string;
  productId: OrderItemProduct | string;
  quantity: number;
  price: number;
  prepTimeMinutes?: number;
  preOrderBatchStart?: string | null;
};

export type OrderStatusEntry = {
  status: string;
  at: string;
};

export type PrepTiming = {
  preparingAt?: string | null;
  dueAt?: string | null;
  estimatedPrepMinutes?: number | null;
  isOverdue?: boolean;
  minutesRemaining?: number | null;
  isRunning?: boolean;
};

export type Order = {
  _id: string;
  customerId?: string | null;
  isGuest: boolean;
  guestInfo?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address?: string;
  };
  orderType: 'pickup' | 'delivery' | 'reservation';
  orderSource: 'online' | 'in-store';
  totalAmount: number;
  deliveryFee: number;
  riderNotes?: string;
  changeFor?: string;
  cancelReason?: string;
  orderStatus: string;
  statusHistory: OrderStatusEntry[];
  estimatedPrepMinutes?: number | null;
  estimatedReadyAt?: string | null;
  paymentStatus?: 'unpaid' | 'down_payment' | 'paid';
  paymentVerified?: boolean;
  paymentProofUrl?: string | null;
  paymentNote?: string | null;
  paymentMethod?: string | null;
  pointsAwarded?: number | null;
  items?: OrderItem[];
  prepTiming?: PrepTiming;
  createdAt: string;
  updatedAt: string;
};

export type ReviewMessage = {
  _id?: string;
  authorType: 'customer' | 'admin';
  senderName: string;
  body: string;
  createdAt: string;
};

export type Review = {
  _id: string;
  customerId?: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  orderId?: string | null;
  images?: { url: string; alt?: string }[];
  /** Legacy single reply, still present alongside `messages`. */
  reply?: string | null;
  replyDate?: string | null;
  messages?: ReviewMessage[];
  isAutoRejected?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type ReviewEligibility = {
  eligible: boolean;
  remainingCount: number;
};

export type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  orderId?: string | null;
  reviewId?: string | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type RewardProduct = {
  _id: string;
  name: string;
  category?: string;
  price?: number;
  stock?: number;
  description?: string;
  imageUrl?: string;
  /** Points needed to redeem. The API names this `pointsRequired`. */
  pointsRequired: number;
};

export type RewardRedemption = {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  pointsSpent: number;
  quantity: number;
  redeemCode?: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  createdAt: string;
};

export type RewardsSummary = {
  points: number;
  products: RewardProduct[];
  redemptions: RewardRedemption[];
};

export type StoreStatus = {
  isOpen: boolean;
  closingTime?: string;
  advanceCloseMinutes?: number;
  isManuallyClosed?: boolean;
  manualCloseReason?: string;
  /** Preformatted, e.g. "11:50 PM". */
  closesAt?: string;
  reopenMessage?: string;
};

export type SupportConversation = {
  _id: string;
  subject?: string;
  status?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt?: string;
};

export type SupportMessage = {
  _id: string;
  body: string;
  senderName?: string;
  authorType?: 'customer' | 'admin';
  createdAt: string;
};

export type Cashier = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  username?: string;
  phoneNumber?: string;
  address?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  createdAt?: string;
};

export type Ingredient = {
  _id: string;
  key?: string;
  name: string;
  iconKey?: string;
  status?: 'active' | 'pending';
};

export type StockMovement = {
  _id: string;
  productId: { _id: string; name: string } | null;
  type: 'restock' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: 'spoilage' | 'adjustment';
  note?: string;
  performedBy?: { _id: string; firstName: string; lastName: string } | null;
  createdAt: string;
};
