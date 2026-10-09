import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, phone, location, employment_type, monthly_income, loan_preference')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name || '',
    email: '',
    phone: data.phone || '',
    location: data.location || '',
    employmentType: data.employment_type || 'Salaried',
    monthlyIncome: data.monthly_income || 0,
    loanPreference: data.loan_preference || 'Personal Loan',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    const profile = await fetchProfile(session.user.id);
    if (profile) {
      setUser({
        ...profile,
        email: session.user.email || '',
      });
    } else {
      setUser({
        id: session.user.id,
        name: (session.user.user_metadata?.name as string) || '',
        email: session.user.email || '',
        phone: '',
        location: '',
        employmentType: 'Salaried',
        monthlyIncome: 0,
        loanPreference: 'Personal Loan',
      });
    }
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s);
        setLoading(false);
      })();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      refreshUser();
    } else {
      setUser(null);
    }
  }, [session, refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not confirmed') || msg.includes('email_not_confirmed')) {
        return { success: false, error: 'Please verify your email before signing in.', needsVerification: true };
      }
      if (msg.includes('invalid') || msg.includes('credentials')) {
        return { success: false, error: 'Invalid email or password.' };
      }
      if (msg.includes('rate limit') || msg.includes('too many')) {
        return { success: false, error: 'Too many login attempts. Please try again later.' };
      }
      return { success: false, error: 'Unable to sign in. Please try again.' };
    }

    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return { success: false, error: 'Please verify your email before signing in.', needsVerification: true };
    }

    return { success: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/secure-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Unable to create account.' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit') || msg.includes('too many')) {
        return { success: false, error: 'Too many reset attempts. Please try again later.' };
      }
      return { success: false, error: 'Unable to send reset email. Please try again.' };
    }

    return { success: true };
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Unable to resend verification email.' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!session?.user) return;

    const dbUpdates: Record<string, string | number> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.employmentType !== undefined) dbUpdates.employment_type = updates.employmentType;
    if (updates.monthlyIncome !== undefined) dbUpdates.monthly_income = updates.monthlyIncome;
    if (updates.loanPreference !== undefined) dbUpdates.loan_preference = updates.loanPreference;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', session.user.id);

      if (error) return;
    }

    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, [session]);

  const isEmailVerified = !!session?.user?.email_confirmed_at;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        isEmailVerified,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        resendVerification,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
