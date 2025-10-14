// hooks/useAuth.ts
import { createContext, useContext, useEffect, useState, ReactNode, createElement } from 'react';
import { api } from '@/config/api';

interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Listen for storage changes to sync auth state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (e.newValue === null) {
          // Token was removed in another tab
          setUser(null);
        } else if (e.newValue && !user) {
          // Token was added in another tab, recheck auth
          checkAuth();
        }
      }
    };

    // Listen for visibility changes to recheck auth when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden && localStorage.getItem('auth_token') && !user) {
        // User returned to tab and we have a token but no user, recheck auth
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Validate token format first
        if (token.split('.').length !== 3) {
          console.warn('Invalid token format, removing from storage');
          localStorage.removeItem('auth_token');
          return;
        }

        try {
          const userData = await api.get('/auth/me');
          setUser(userData);
        } catch (apiError) {
          console.error('Auth API call failed:', apiError);
          // Only remove token if it's a 401/403 error
          if (apiError instanceof Error && (apiError.message.includes('401') || apiError.message.includes('403'))) {
            localStorage.removeItem('auth_token');
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't remove token on network errors, only on auth errors
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        localStorage.removeItem('auth_token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await api.post('/auth/login', { email, password });
      localStorage.setItem('auth_token', userData.token);
      setUser(userData.user);
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('400') || errorMessage.includes('401')) {
        throw new Error('Invalid email or password');
      } else if (errorMessage.includes('500')) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error('Login failed. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('auth_token', userData.token);
      setUser(userData.user);
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('User already exists')) {
        throw new Error('An account with this email already exists. Please login instead.');
      } else if (errorMessage.includes('400')) {
        throw new Error('Please check your information and try again.');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  // Use createElement instead of JSX since this is a .ts file
  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};