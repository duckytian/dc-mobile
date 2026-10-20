import rateLimit from 'express-rate-limit';

// Local development escape hatch — set RATE_LIMIT_ENABLED=false in .env while
// testing against your phone so a few failed logins don't lock the IP out for
// 15 minutes. Production leaves it unset and keeps the real limits.
const rateLimitingDisabled = process.env.RATE_LIMIT_ENABLED === 'false';
const skip = () => rateLimitingDisabled;

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 15,                  
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

export const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

export const guestOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip
});

// Keyed by IP like the other limiters, so the ceiling is generous enough for
// several walk-in customers sharing one network. It only exists to stop a
// single source from spamming submissions.
export const reviewLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip
});
