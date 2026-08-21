import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, logout as logoutService } from '@/api/authService';

const AuthContext = createContext(null);

const USER_STORAGE_KEY = "mbaara_user";

const getStoredUser = () => {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  if (user) {
    window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.sessionStorage.removeItem(USER_STORAGE_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredUser()));
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAppState();

    if (typeof window !== "undefined") {
      const onAuthChanged = () => {
        checkUserAuth();
      };
      window.addEventListener("mbaara-auth-changed", onAuthChanged);
      return () => {
        window.removeEventListener("mbaara-auth-changed", onAuthChanged);
      };
    }
    return undefined;
  }, []);

  const checkAppState = async () => {
    setAuthError(null);
    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      persistUser(currentUser);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('mbaara-user-updated'));
        window.dispatchEvent(new Event('mbaara-progress-updated'));
      }
    } catch (error) {
      const status = error?.status ?? (error instanceof Error ? null : null);
      const isAuthenticationFailure = status === 401 || status === 403;
      const cachedUser = getStoredUser();
      if (isAuthenticationFailure || !cachedUser) {
        setUser(null);
        setIsAuthenticated(false);
        persistUser(null);
      } else {
        // Keep the cached profile during a transient network/proxy failure;
        // the server remains authoritative and the next check can reconcile it.
        setUser(cachedUser);
        setIsAuthenticated(true);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('mbaara-user-updated'));
        window.dispatchEvent(new Event('mbaara-progress-updated'));
      }
      if (isAuthenticationFailure) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else {
        setAuthError({ type: 'unknown', message: error?.message || 'Failed to verify authentication' });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const updateUser = (updates) => {
    setUser((currentUser) => {
      const nextUser = currentUser ? { ...currentUser, ...updates } : currentUser;
      persistUser(nextUser);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("mbaara-user-updated"));
      }
      return nextUser;
    });
  };

  const logout = async () => {
    try {
      await logoutService();
    } catch (err) {
      // If the network/logout call fails, still clear client state so the
      // user is logged out in the UI. The backend will eventually expire
      // server-side cookies/tokens.
      console.warn("Logout request failed:", err);
    }
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setAuthChecked(true);
    persistUser(null);
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
