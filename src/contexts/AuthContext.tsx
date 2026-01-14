import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type FamilyRole = 'parent' | 'child';

interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string | null;
  name: string;
  role: FamilyRole;
  pin_code: string | null;
  color: string;
  avatar_emoji: string;
  created_at: string;
}

interface Family {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentMember: FamilyMember | null;
  family: Family | null;
  isParent: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loginWithPin: (pin: string) => Promise<{ error: Error | null }>;
  setCurrentMember: (member: FamilyMember | null) => void;
  refreshFamily: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isParent = currentMember?.role === 'parent';

  const fetchFamilyData = async (userId: string) => {
    try {
      // Get the family member record for this user
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (memberError || !memberData) {
        // User doesn't have a family yet
        setCurrentMember(null);
        setFamily(null);
        return;
      }

      setCurrentMember(memberData as FamilyMember);

      // Get the family
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', memberData.family_id)
        .single();

      if (!familyError && familyData) {
        setFamily(familyData as Family);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    }
  };

  const refreshFamily = async () => {
    if (user) {
      await fetchFamilyData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Defer to avoid blocking auth state update
          setTimeout(() => fetchFamilyData(newSession.user.id), 0);
        } else {
          setCurrentMember(null);
          setFamily(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchFamilyData(existingSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name }
      }
    });

    if (error) return { error: error as Error };

    // Create a family for the new user
    if (data.user) {
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({ name: `${name}'s Family`, created_by: data.user.id })
        .select()
        .single();

      if (familyError) {
        console.error('Error creating family:', familyError);
        return { error: familyError as Error };
      }

      // Add the user as a parent in the family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: data.user.id,
          name,
          role: 'parent',
          color: '#8B5CF6',
          avatar_emoji: '👨'
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        return { error: memberError as Error };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentMember(null);
    setFamily(null);
  };

  const loginWithPin = async (pin: string) => {
    if (!family) {
      return { error: new Error('No family found') };
    }

    const { data: memberData, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', family.id)
      .eq('pin_code', pin)
      .single();

    if (error || !memberData) {
      return { error: new Error('Invalid PIN') };
    }

    setCurrentMember(memberData as FamilyMember);
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      currentMember,
      family,
      isParent,
      isLoading,
      signIn,
      signUp,
      signOut,
      loginWithPin,
      setCurrentMember,
      refreshFamily
    }}>
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
