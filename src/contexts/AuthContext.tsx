import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, getCurrentUser, clearAccessToken } from '@/utils/authApi';
import type { CurrentUser } from '@/utils/authApi';

interface AuthContextType {
  user: CurrentUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperUser: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isSuperUser: false,
  refresh: async () => {},
  logout: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);

  const computeRoles = (role?: string) => {
    const adminRoles = ['admin', 'superadmin'];
    const superRoles = ['superadmin'];
    setIsAdmin(role ? adminRoles.includes(role) : false);
    setIsSuperUser(role ? superRoles.includes(role) : false);
  };

  const refresh = async () => {
    setIsLoading(true);
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setIsAdmin(false);
        setIsSuperUser(false);
        return;
      }
      const current = await getCurrentUser();
      setUser(current);
      computeRoles(current.role);
    } catch (e) {
            setUser(null);
            setIsAdmin(false);
            setIsSuperUser(false);
    } finally {
          setIsLoading(false);
        }
  };

  const logout = () => {
    clearAccessToken();
    setUser(null);
    setIsAdmin(false);
    setIsSuperUser(false);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refresh();
      if (!mounted) return;
    })();
    return () => { mounted = false; };
  }, []);

  const value = {
    user,
    isLoading,
    isAdmin,
    isSuperUser,
    refresh,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};