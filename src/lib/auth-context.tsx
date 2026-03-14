'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface AuthCredentials {
  canvas_url: string;
  canvas_token: string;
  expires_at?: number; // timestamp in milliseconds
}

interface AuthContextType {
  isAuthenticated: boolean;
  credentials: AuthCredentials | null;
  login: (data: AuthCredentials) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  credentials: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

const STORAGE_KEY_URL = 'canvas_url';
const STORAGE_KEY_TOKEN = 'canvas_token';
const STORAGE_KEY_EXPIRES = 'canvas_auth_expires';

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load credentials from sessionStorage on mount
  useEffect(() => {
    try {
      const url = sessionStorage.getItem(STORAGE_KEY_URL);
      const token = sessionStorage.getItem(STORAGE_KEY_TOKEN);
      const expiresStr = sessionStorage.getItem(STORAGE_KEY_EXPIRES);
      
      if (url && token && expiresStr) {
        const expiresAt = parseInt(expiresStr, 10);
        
        // Check if the session has already expired
        if (Date.now() > expiresAt) {
          sessionStorage.removeItem(STORAGE_KEY_URL);
          sessionStorage.removeItem(STORAGE_KEY_TOKEN);
          sessionStorage.removeItem(STORAGE_KEY_EXPIRES);
          setCredentials(null);
        } else {
          setCredentials({ canvas_url: url, canvas_token: token, expires_at: expiresAt });
        }
      }
    } catch {
      // sessionStorage not available (SSR or private mode)
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY_URL);
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_EXPIRES);
    setCredentials(null);
  }, []);

  // Periodic check to auto-logout if session expires while app is open
  useEffect(() => {
    if (!credentials?.expires_at) return;

    const checkExpiration = () => {
      if (credentials.expires_at && Date.now() > credentials.expires_at) {
        logout();
      }
    };

    // Check every minute
    const intervalId = setInterval(checkExpiration, 60 * 1000);
    
    // Also check immediately just in case
    checkExpiration();

    return () => clearInterval(intervalId);
  }, [credentials, logout]);

  const login = useCallback((data: AuthCredentials) => {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    
    sessionStorage.setItem(STORAGE_KEY_URL, data.canvas_url);
    sessionStorage.setItem(STORAGE_KEY_TOKEN, data.canvas_token);
    sessionStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());
    
    setCredentials({ ...data, expires_at: expiresAt });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!credentials,
        credentials,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
