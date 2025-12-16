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

    try {
      await supabase.rpc('sync_user_role_from_employees', { p_user_id: userId });
      console.log('Role synced from employees table');
    } catch (syncError) {
      console.error('Error syncing role:', syncError);
    }

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
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      const isAdmin = employeeData?.role === 'admin' || employeeData?.role === 'super_admin';

      const { data: newProfile, error: insertError } = await supabase
        .from('typemind_profiles')
        .insert({
          id: userId,
          email: userData?.user?.email || '',
          full_name: userData?.user?.user_metadata?.full_name || userData?.user?.email || '',
          role: isAdmin ? 'admin' : 'student',
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

    console.log('Profile fetched:', data);
    return data;
  };

  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const urlRole = urlParams.get('role');

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

            try {
              await supabase.rpc('sync_user_role_from_employees', { p_user_id: session.user.id });
              console.log('Role synced from employees table (vSuite flow)');
            } catch (syncError) {
              console.error('Error syncing role (vSuite flow):', syncError);
            }

            let profileData = await supabase
              .from('typemind_profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!profileData.data) {
              const { data: employeeData } = await supabase
                .from('employees')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();

              const isAdmin = employeeData?.role === 'admin' || employeeData?.role === 'super_admin';
              const roleFromEmployee = isAdmin ? 'admin' : 'student';

              const { data: newProfile } = await supabase
                .from('typemind_profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email || '',
                  full_name: session.user.user_metadata?.full_name || session.user.email || '',
                  role: roleFromEmployee,
                  level: 'beginner'
                })
                .select()
                .single();

              setProfile(newProfile);
            } else {
              profileData = await supabase
                .from('typemind_profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              setProfile(profileData.data);
            }

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
