import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
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

// Mock users database
export const mockUsers: User[] = [
  {
    id: 'student1',
    email: 'student@test.com',
    name: 'John Doe',
    role: 'student',
    studentId: 'STU001'
  },
  {
    id: 'mentor1',
    email: 'mentor@test.com',
    name: 'Dr. Smith',
    role: 'mentor'
  },
  {
    id: 'parent1',
    email: 'parent@test.com',
    name: 'Mary Doe',
    role: 'parent',
    childId: 'STU001'
  }
];

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
    // Mock authentication - in real app, this would call an API
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password') {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return true;
    }
    return false;
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