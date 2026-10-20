/**
 * Shared design tokens for app screens.
 *
 * The app runs a single light theme (see `app.json` -> `userInterfaceStyle`),
 * so these are plain hex values rather than a light/dark table. They mirror the
 * public web app's palette so the two look like the same product:
 *
 *   deep   #2D4A35  sidebar / darkest brand green
 *   brand  #3C5E45  primary actions, headers
 *   mid    #4A7C59  hover / active states
 *   mint   #7ED4A0  success accents, progress
 *   accent #FBD897  highlights on dark green, badges
 */
export const Palette = {
  deep: '#2D4A35',
  brand: '#3C5E45',
  mid: '#4A7C59',
  mint: '#7ED4A0',
  accent: '#FBD897',

  ink: '#1A1A1A',
  inkSoft: '#4B5563',
  muted: '#6B7280',
  faint: '#9CA3AF',

  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F5',
  surfaceTint: '#E8F0E3',
  border: '#E5E7EB',
  divider: '#F0F1F0',

  danger: '#C30010',
  dangerSoft: '#FEE2E2',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  info: '#1D4ED8',
  infoSoft: '#DBEAFE',
  success: '#15803D',
  successSoft: '#DCFCE7'
} as const;

/** 4pt spacing scale — step `n` is `n * 4` px. */
export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999
} as const;

/** Card surface: white, hairline border, soft shadow. */
export const CardShadow = '0 1px 3px rgba(16, 24, 40, 0.08)';
export const RaisedShadow = '0 4px 12px rgba(16, 24, 40, 0.12)';
