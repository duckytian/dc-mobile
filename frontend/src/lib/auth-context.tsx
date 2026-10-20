import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, ApiError } from './api';
import { tokenStore } from './token-store';

export type User = {
  id: string;
  type: 'customer' | 'cashier' | 'admin';
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  username?: string;
  profilePhoto?: string;
  businessName?: string;
  businessLogo?: string;
  storeAddress?: string;
  businessContactNumber?: string;
  operatingHours?: string;
  businessType?: string;
  closingTime?: string;
  advanceCloseMinutes?: number;
  defaultPrepMinutes?: number;
  isManuallyClosed?: boolean;
  manualCloseReason?: string;
};

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type SignUpParams = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  username?: string;
};

type AuthIdentifier = { email?: string; phoneNumber?: string };

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  verify: (identifier: AuthIdentifier, code: string) => Promise<void>;
  resendVerification: (identifier: AuthIdentifier) => Promise<void>;
  forgotPassword: (identifier: AuthIdentifier) => Promise<void>;
  resetPassword: (
    identifier: AuthIdentifier,
    code: string,
    newPassword: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>('/api/auth/me');
      setUser(data.user);
      setStatus('signedIn');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setStatus('signedOut');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const tokens = await tokenStore.load();
        if (!tokens.access && !tokens.refresh) {
          if (!cancelled) {
            setUser(null);
            setStatus('signedOut');
          }
          return;
        }

        const data = await api.get<{ user: User }>('/api/auth/me');
        if (!cancelled) {
          setUser(data.user);
          setStatus('signedIn');
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus('signedOut');
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const field: AuthIdentifier = identifier.includes('@')
      ? { email: identifier }
      : { phoneNumber: identifier };
    const data = await api.post<{ accessToken: string; refreshToken: string }>(
      '/api/auth/login',
      { ...field, password }
    );
    await tokenStore.set(data.accessToken, data.refreshToken);
    await refreshUser();
  }, [refreshUser]);

  const signUp = useCallback(async (params: SignUpParams) => {
    await api.post('/api/auth/register', params);
  }, []);

  const verify = useCallback(async (identifier: AuthIdentifier, code: string) => {
    await api.post('/api/auth/verify', { ...identifier, code });
  }, []);

  const resendVerification = useCallback(async (identifier: AuthIdentifier) => {
    await api.post('/api/auth/resend-verification', { ...identifier });
  }, []);

  const forgotPassword = useCallback(async (identifier: AuthIdentifier) => {
    await api.post('/api/auth/forgot-password', { ...identifier });
  }, []);

  const resetPassword = useCallback(
    async (identifier: AuthIdentifier, code: string, newPassword: string) => {
      await api.post('/api/auth/reset-password', {
        ...identifier,
        code,
        newPassword
      });
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      const refreshToken = tokenStore.refresh;
      await api.post('/api/auth/logout', refreshToken ? { refreshToken } : undefined);
    } catch {
      // ignore
    }
    await tokenStore.clear();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      signIn,
      signUp,
      verify,
      resendVerification,
      forgotPassword,
      resetPassword,
      signOut,
      refreshUser
    }),
    [
      status,
      user,
      signIn,
      signUp,
      verify,
      resendVerification,
      forgotPassword,
      resetPassword,
      signOut,
      refreshUser
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}