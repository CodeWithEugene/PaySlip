import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createAuthClient } from '@neondatabase/neon-js/auth';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

type AuthAction = { authenticated: boolean; verificationRequired: boolean };
type AuthContextValue = {
  user: AuthUser | null;
  status: 'loading' | 'ready' | 'unavailable';
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthAction>;
  signUp: (name: string, email: string, password: string) => Promise<AuthAction>;
  signOut: () => Promise<void>;
};

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;
const neonAuth = authUrl ? createAuthClient(authUrl) : null;
const AuthContext = createContext<AuthContextValue | null>(null);

function messageFrom(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const error = (result as { error?: { message?: string } }).error;
  return error?.message || null;
}

function userFrom(result: unknown): AuthUser | null {
  if (!result || typeof result !== 'object') return null;
  const session = (result as { data?: { user?: AuthUser } }).data;
  return session?.user ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>(neonAuth ? 'loading' : 'unavailable');

  const refresh = useCallback(async () => {
    if (!neonAuth) return null;
    const result = await neonAuth.getSession();
    const error = messageFrom(result);
    if (error) throw new Error(error);
    const nextUser = userFrom(result);
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    if (!neonAuth) return;
    void refresh().catch(() => setUser(null)).finally(() => setStatus('ready'));
  }, [refresh]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    configured: Boolean(neonAuth),
    async signIn(email, password) {
      if (!neonAuth) throw new Error('Authentication is not configured for this deployment.');
      const result = await neonAuth.signIn.email({ email, password });
      const error = messageFrom(result);
      if (error) throw new Error(error);
      const currentUser = await refresh();
      return { authenticated: Boolean(currentUser), verificationRequired: false };
    },
    async signUp(name, email, password) {
      if (!neonAuth) throw new Error('Authentication is not configured for this deployment.');
      const result = await neonAuth.signUp.email({ name, email, password });
      const error = messageFrom(result);
      if (error) throw new Error(error);
      const currentUser = await refresh();
      return { authenticated: Boolean(currentUser), verificationRequired: !currentUser };
    },
    async signOut() {
      if (!neonAuth) return;
      const result = await neonAuth.signOut();
      const error = messageFrom(result);
      if (error) throw new Error(error);
      setUser(null);
    },
  }), [refresh, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
