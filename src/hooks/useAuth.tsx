import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Error checking admin role:', errorMessage);
      return false;
    }
    return !!data;
  };

  const updateAuthState = async (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    
    // Wait for admin check to complete before setting isLoading to false
    if (session?.user) {
      try {
        const isAdminUser = await checkAdminRole(session.user.id);
        setIsAdmin(isAdminUser);
      } catch (error) {
        const errorMessage = formatSupabaseError(error);
        console.error('Error checking admin role:', errorMessage);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await updateAuthState(session);
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await updateAuthState(session);
    };
    
    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Sign up with Supabase Authentication
    // Note: For immediate access, email confirmation must be disabled in Supabase dashboard
    // Go to: Authentication > Providers > Email > Disable "Confirm email"
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/login`,
      }
    });
    
    if (error) {
      // Only log errors in development to avoid exposing sensitive information
      if (import.meta.env.DEV) {
        console.error('SignUp error:', error);
      }
      return { error };
    }
    
    // Log successful signup for debugging (only in development, no PII)
    if (import.meta.env.DEV) {
      console.log('SignUp successful:', {
        hasUser: !!data.user,
        emailConfirmed: !!data.user?.confirmed_at,
        hasSession: !!data.session
      });
      
      // If user was created but no session (email confirmation required)
      if (data.user && !data.session) {
        console.warn('User created but email confirmation is required. Please check email or disable confirmation in Supabase settings.');
      }
    }
    
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
