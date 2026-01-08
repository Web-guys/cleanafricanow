import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'municipality' | 'citizen' | 'tourist' | 'ngo';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRoles: AppRole[];
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: AppRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  getRoleBasedRedirect: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer fetching roles and profile
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRoles([]);
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesData) {
        setUserRoles(rolesData.map((r: any) => r.role));
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, cities(*)')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: AppRole = 'citizen') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });
    
    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }

    // If signup successful and user is created, update their role
    if (data.user && role !== 'citizen') {
      setTimeout(async () => {
        try {
          // Delete default citizen role
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', data.user.id);
          
          // Insert selected role
          await supabase
            .from('user_roles')
            .insert([{ user_id: data.user.id, role: role }]);
        } catch (err) {
          console.error('Error updating role:', err);
        }
      }, 1000);
    }
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email sent",
        description: "Check your inbox for the password reset link.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRoles([]);
    setProfile(null);
    
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const hasRole = (role: AppRole): boolean => {
    return userRoles.includes(role);
  };

  const getRoleBasedRedirect = (): string => {
    if (userRoles.includes('admin')) {
      return '/admin';
    } else if (userRoles.includes('municipality')) {
      return '/municipality';
    } else if (userRoles.includes('ngo')) {
      return '/ngo';
    } else {
      return '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRoles,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        hasRole,
        getRoleBasedRedirect,
      }}
    >
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
