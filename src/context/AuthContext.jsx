import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signIn, signUp, signOut, getSession, fetchProfile, updateProfile, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isE2E = typeof window !== 'undefined' && window.localStorage.getItem('e2e-test') === 'true';

  const deriveProfile = useCallback((sessionUser) => {
    const meta = sessionUser?.user_metadata || {};
    return {
      id: sessionUser.id,
      username: meta.username || sessionUser.email?.split('@')[0] || '',
      display_name: meta.display_name || meta.full_name || sessionUser.email?.split('@')[0] || '',
      avatar_url: meta.avatar_url || null,
    };
  }, []);

  const loadProfile = useCallback(async (sessionUser) => {
    try {
      const p = await fetchProfile(sessionUser.id);
      if (p) {
        setProfile(p);
      } else {
        // Profile doesn't exist — create it from user metadata
        const fallback = deriveProfile(sessionUser);
        const { data: created } = await supabase
          .from('profiles')
          .upsert({ id: sessionUser.id, ...fallback, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .select()
          .single();
        if (created) setProfile(created);
        else setProfile(fallback);
      }
    } catch {
      // If DB fails, use derived profile from metadata
      setProfile(deriveProfile(sessionUser));
    }
  }, [deriveProfile]);

  useEffect(() => {
    if (isE2E) {
      setUser({ id: 'e2e-test-user', email: 'test@test.com' });
      setLoading(false);
      return;
    }
    getSession()
      .then(s => {
        if (s?.user) {
          setUser(s.user);
          return loadProfile(s.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    const data = await signIn(email, password);
    setUser(data.user);
    await loadProfile(data.user);
    return data;
  }, [loadProfile]);

  const register = useCallback(async (email, password, username) => {
    const data = await signUp(email, password, username);
    if (data.user) {
      setUser(data.user);
      await loadProfile(data.user);
    }
    return data;
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const saveProfile = useCallback(async (updates) => {
    if (!user) return;
    const updated = await updateProfile(user.id, updates);
    setProfile(updated);
    return updated;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      saveProfile,
      refreshProfile: () => user ? loadProfile(user) : Promise.resolve(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
