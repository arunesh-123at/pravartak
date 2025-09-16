import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin } from '../lib/api';

interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'student' | 'mentor' | 'parent';
  studentId?: string;
  childId?: string; // For parents to link to their child's student record
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'mentor' | 'parent';
  childId?: string; // For parents during registration
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Deprecated mock users removed in favor of backend API

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on app load
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const resp = await apiLogin(email, password);
      // Handle both mentor and student responses
      const mapped: User = resp && (resp as any).role ? {
        id: (resp as any).id,
        email: (resp as any).email,
        name: (resp as any).full_name,
        role: (resp as any).role,
      } : {
        id: (resp as any).id,
        email: (resp as any).email,
        name: (resp as any).full_name,
        role: 'mentor'
      };
      setUser(mapped);
      localStorage.setItem('currentUser', JSON.stringify(mapped));
      return true;
    } catch (e) {
      return false;
    }
  };



  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}