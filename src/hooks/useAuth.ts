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
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const userData = await api.get('/auth/me');
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
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