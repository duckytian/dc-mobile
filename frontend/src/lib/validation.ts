/**
 * Lightweight client-side validation so users see friendly messages instantly
 * instead of raw server (Zod) errors like "String must contain at least 1 character".
 * The server still validates everything — this is only the first line of defence.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) {
    return `${label} is required`;
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) {
    return 'Email is required';
  }
  if (!EMAIL_RE.test(email)) {
    return 'Enter a valid email address';
  }
  return null;
}

const PHONE_RE = /^[+]?[\d\s()-]{7,15}$/;

export function validateEmailOrPhone(value: string): string | null {
  const identifier = value.trim();
  if (!identifier) {
    return 'Email or phone number is required';
  }
  if (EMAIL_RE.test(identifier)) {
    return null;
  }
  if (PHONE_RE.test(identifier)) {
    return null;
  }
  return 'Enter a valid email address or phone number';
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return 'Password is required';
  }
  return null;
}

/** Full password policy — mirrors the backend `passwordSchema`. */
export function validateNewPassword(value: string): string | null {
  if (!value) {
    return 'Password is required';
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(value)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(value)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(value)) {
    return 'Password must contain at least one digit';
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'Password must contain at least one special character';
  }
  return null;
}

export function validateCode(value: string): string | null {
  const code = value.trim();
  if (!code) {
    return 'Verification code is required';
  }
  if (!/^\d{6}$/.test(code)) {
    return 'Enter the 6-digit code';
  }
  return null;
}

/** Returns the first validation error message, or null when every check passes. */
export function firstError(...results: (string | null)[]): string | null {
  return results.find((message): message is string => Boolean(message)) ?? null;
}
