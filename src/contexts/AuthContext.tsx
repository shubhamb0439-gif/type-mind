import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  hasAccess: boolean;
  loading: boolean;
  signInWithAzure: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('app_permissions')
      .select('*, apps!inner(name)')
      .eq('employee_id', userId)
      .eq('apps.name', 'Typemind')
      .maybeSingle();

    if (error) {
      console.error('Error checking access:', error);
      return false;
    }

    return !!data;
  };

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for user:', userId);

    const hasTypeMindAccess = await checkAccess(userId);
    setHasAccess(hasTypeMindAccess);

    if (!hasTypeMindAccess) {
      console.log('User does not have TypeMind access');
      return null;
    }

    const { data: appPermissionData } = await supabase
      .from('app_permissions')
      .select('app_role, apps!inner(name)')
      .eq('employee_id', userId)
      .eq('apps.name', 'Typemind')
      .maybeSingle();

    const roleFromPermissions = appPermissionData?.app_role || 'student';
    console.log('Role from app_permissions:', roleFromPermissions);

    const { data, error } = await supabase
      .from('typemind_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!data) {
      const { data: userData } = await supabase.auth.getUser();
      const { data: employeeData } = await supabase
        .from('employees')
        .select('full_name, email')
        .eq('id', userId)
        .maybeSingle();

      const { data: newProfile, error: insertError } = await supabase
        .from('typemind_profiles')
        .insert({
          id: userId,
          email: employeeData?.email || userData?.user?.email || '',
          full_name: employeeData?.full_name || userData?.user?.user_metadata?.full_name || userData?.user?.email || '',
          role: roleFromPermissions,
          level: 'beginner'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return null;
      }

      console.log('Profile created:', newProfile);
      return newProfile;
    }

    if (data.role !== roleFromPermissions) {
      console.log(`Updating role from ${data.role} to ${roleFromPermissions}`);
      const { data: updatedProfile } = await supabase
        .from('typemind_profiles')
        .update({ role: roleFromPermissions })
        .eq('id', userId)
        .select()
        .single();

      console.log('Profile updated:', updatedProfile);
      return updatedProfile || data;
    }

    console.log('Profile fetched:', data);
    return data;
  };

  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');

      if (urlToken) {
        console.log('Token detected from vSuite, authenticating...');
        try {
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: urlToken,
            refresh_token: urlToken,
          });

          if (error) {
            console.error('Error setting session from token:', error);
          } else if (session?.user) {
            console.log('Session established from vSuite token');
            setUser(session.user);
            setHasAccess(true);

            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);

            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err) {
          console.error('Error during vSuite authentication:', err);
        } finally {
          setLoading(false);
        }
      } else {
        supabase.auth.getSession().then(({ data: { session } }) => {
          (async () => {
            setUser(session?.user ?? null);
            if (session?.user) {
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
            }
            setLoading(false);
          })();
        });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
          setHasAccess(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithAzure = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email profile',
        redirectTo: window.location.origin,
      }
    });

    if (error) {
      console.error('Azure SSO error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during sign out:', error);
        throw error;
      }
      setUser(null);
      setProfile(null);
      setHasAccess(false);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
      setProfile(null);
      setHasAccess(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, hasAccess, loading, signInWithAzure, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
