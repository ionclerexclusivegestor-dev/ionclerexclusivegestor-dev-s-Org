import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<ThemeMode>('light');

  const setTheme = () => {};
  const toggleTheme = () => {};

  useEffect(() => {
    try {
      localStorage.setItem('ioncler_theme', 'light');
    } catch {
      // Ignora falha de localstorage
    }

    const root = document.documentElement;
    root.classList.add('light');
    root.classList.remove('dark');
    document.body.style.backgroundColor = '#f8fafc';
    document.body.style.color = '#0f172a';
  }, []);

  const isDark = false;

  return (
    <ThemeContext.Provider value={{ theme: 'light', isDark: false, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
