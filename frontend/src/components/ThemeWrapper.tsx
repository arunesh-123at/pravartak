import React from 'react';
import { useTheme } from './ThemeContext';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {children}
    </div>
  );
}