/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem('counsel_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authService.me();
      setUser(res.data?.data?.user || null);
      setProfile(res.data?.data?.profile || null);
    } catch {
      localStorage.removeItem('counsel_token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('counsel_token');
    if (!token) {
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    authService
      .me()
      .then((res) => {
        if (!active) return;
        setUser(res.data?.data?.user || null);
        setProfile(res.data?.data?.profile || null);
      })
      .catch(() => {
        localStorage.removeItem('counsel_token');
        if (!active) return;
        setUser(null);
        setProfile(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setProfile(null);
    };
    window.addEventListener('counsel:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('counsel:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const data = res.data?.data;
    if (data?.token) {
      localStorage.setItem('counsel_token', data.token);
      setUser(data.user);
      setProfile(data.profile || null);
    }
    return data;
  };

  const register = async (payload) => {
    const res = await authService.register(payload);
    const data = res.data?.data;
    if (data?.token) {
      localStorage.setItem('counsel_token', data.token);
      setUser(data.user);
      await loadSession();
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on sign out
    } finally {
      localStorage.removeItem('counsel_token');
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfileState = (nextProfile) => {
    setProfile(nextProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshSession: loadSession,
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
