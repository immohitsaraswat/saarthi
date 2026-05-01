import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('saarthi_token');
    const storedUser = localStorage.getItem('saarthi_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('saarthi_token');
        localStorage.removeItem('saarthi_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('saarthi_token', token);
    // Fetch fresh profile to get onboarding + preferences fields
    try {
      const meRes = await authAPI.me();
      const fullUser = meRes.data.user;
      localStorage.setItem('saarthi_user', JSON.stringify(fullUser));
      setUser(fullUser);
      return fullUser;
    } catch {
      localStorage.setItem('saarthi_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('saarthi_token', token);
    localStorage.setItem('saarthi_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('saarthi_token');
    localStorage.removeItem('saarthi_user');
    setUser(null);
    window.location.href = '/login';
  };

  // Refresh user from backend (picks up onboarding flags etc.)
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      const fresh = res.data.user;
      localStorage.setItem('saarthi_user', JSON.stringify(fresh));
      setUser(fresh);
      return fresh;
    } catch { /* ignore */ }
  }, []);

  // Update profile/preferences and sync state
  const updateUser = useCallback(async (payload) => {
    const res = await authAPI.updateMe(payload);
    const updated = res.data.user;
    localStorage.setItem('saarthi_user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  }, []);

  // Mark an onboarding step complete instantly (no API call — backend sets it async)
  const updateOnboarding = useCallback((flag) => {
    setUser((prev) => {
      if (!prev?.onboarding) return prev;           // existing user, no checklist
      if (prev.onboarding[flag]) return prev;       // already done, skip re-render
      const updated = {
        ...prev,
        onboarding: { ...prev.onboarding, [flag]: true },
      };
      localStorage.setItem('saarthi_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUser, updateOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
