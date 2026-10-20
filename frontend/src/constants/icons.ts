import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

/**
 * Semantic icon names, mapped to a platform pair.
 *
 * Native tabs render real platform icons, so each entry maps to an SF Symbol on
 * iOS and a Material Symbol on Android. Centralising the pairs here keeps every
 * layout consistent and free of typo'd symbol names.
 */
export type IconName =
  // tab destinations
  | 'order'
  | 'reviews'
  | 'rewards'
  | 'profile'
  | 'queue'
  | 'counter'
  | 'dashboard'
  | 'products'
  | 'more'
  // header / inline actions
  | 'cart'
  | 'bell'
  | 'chat'
  | 'back'
  | 'forward'
  | 'close'
  | 'add'
  | 'remove'
  | 'search'
  | 'history'
  | 'receipt'
  | 'delivery'
  | 'check'
  | 'clock'
  | 'location'
  | 'logout'
  | 'edit'
  | 'delete'
  | 'camera'
  | 'store'
  | 'promo'
  | 'support'
  | 'lock'
  | 'phone'
  | 'mail'
  | 'gift';

type IconPair = {
  sf: SFSymbol;
  /** Filled variant shown while a tab is selected on iOS. */
  sfSelected?: SFSymbol;
  material: AndroidSymbol;
};

export const AppIcons: Record<IconName, IconPair> = {
  order: { sf: 'fork.knife', material: 'restaurant' },
  reviews: { sf: 'star', sfSelected: 'star.fill', material: 'star' },
  rewards: { sf: 'gift', sfSelected: 'gift.fill', material: 'redeem' },
  profile: {
    sf: 'person.crop.circle',
    sfSelected: 'person.crop.circle.fill',
    material: 'person'
  },
  queue: { sf: 'list.bullet.rectangle', material: 'receipt_long' },
  counter: { sf: 'creditcard', sfSelected: 'creditcard.fill', material: 'point_of_sale' },
  dashboard: { sf: 'chart.bar', sfSelected: 'chart.bar.fill', material: 'dashboard' },
  products: { sf: 'takeoutbag.and.cup.and.straw', material: 'inventory_2' },
  more: {
    sf: 'ellipsis.circle',
    sfSelected: 'ellipsis.circle.fill',
    material: 'more_horiz'
  },

  cart: { sf: 'cart', sfSelected: 'cart.fill', material: 'shopping_cart' },
  bell: { sf: 'bell', sfSelected: 'bell.fill', material: 'notifications' },
  chat: { sf: 'bubble.left.and.bubble.right', material: 'chat' },
  back: { sf: 'chevron.left', material: 'arrow_back' },
  forward: { sf: 'chevron.right', material: 'chevron_right' },
  close: { sf: 'xmark', material: 'close' },
  add: { sf: 'plus', material: 'add' },
  remove: { sf: 'minus', material: 'remove' },
  search: { sf: 'magnifyingglass', material: 'search' },
  history: { sf: 'clock.arrow.circlepath', material: 'history' },
  receipt: { sf: 'doc.text', material: 'receipt' },
  delivery: { sf: 'shippingbox', material: 'local_shipping' },
  check: { sf: 'checkmark.circle.fill', material: 'check_circle' },
  clock: { sf: 'clock', material: 'schedule' },
  location: { sf: 'mappin.and.ellipse', material: 'location_on' },
  logout: { sf: 'rectangle.portrait.and.arrow.right', material: 'logout' },
  edit: { sf: 'pencil', material: 'edit' },
  delete: { sf: 'trash', material: 'delete' },
  camera: { sf: 'camera', material: 'photo_camera' },
  store: { sf: 'storefront', material: 'storefront' },
  promo: { sf: 'tag', material: 'local_offer' },
  support: { sf: 'headphones', material: 'support_agent' },
  lock: { sf: 'lock', material: 'lock' },
  phone: { sf: 'phone', material: 'phone' },
  mail: { sf: 'envelope', material: 'mail' },
  gift: { sf: 'gift', sfSelected: 'gift.fill', material: 'card_giftcard' }
};
