import {randomBytes} from 'crypto';
import {Request, Response, NextFunction} from 'express';
import {CookieOptions} from 'express';
import {ApiError} from '../utils/error';
import {env} from '../config/env';
import {ErrorCodes} from '../constants/errorCodes';
import {CSRF_COOKIE} from '../constants/cookies';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Public auth endpoints don't rely on an existing session (they ARE the
// session — login, register, password reset). Exempting them lets clients
// with a stale cookie jar still authenticate; everything they accept is
// validated by Zod DTOs and verified with JWTs / codes anyway.
const CSRF_EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/resend-verification',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/verify-reset-code',
  '/api/auth/resend-reset-code',
  '/api/auth/reset-password'
]);

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

function getCsrfCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE === 'true',
    sameSite: env.COOKIE_SAMESITE ?? 'lax',
    path: '/'
  };
}

export function issueCsrfToken(_req: Request, res: Response) {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE, token, getCsrfCookieOptions());
  res.status(200).json({csrfToken: token});
}

export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (!UNSAFE_METHODS.has(req.method)) {
    return next();
  }

  if (CSRF_EXEMPT_PATHS.has(req.path)) {
    return next();
  }

  if (req.originalUrl.startsWith('/api/auth/')) {
    return next();
  }

  if (!req.headers.cookie) {
    return next();
  }

  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers['x-csrf-token'] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(
      new ApiError(403, ErrorCodes.CSRF_TOKEN_INVALID, 'Invalid CSRF token')
    );
  }

  return next();
}
