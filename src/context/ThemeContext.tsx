import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('reservas_belem_theme') as Theme;
    if (saved === 'light' || saved === 'dark') return saved;
    // Default to light theme for first-time visitors
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('reservas_belem_theme', theme);

    // Update dynamic meta tags for Android/iOS status bars & webview
    const themeColorMeta = document.getElementById('theme-color-meta');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#0B0E14' : '#ECEEF4');
    }

    const colorSchemeMeta = document.getElementById('color-scheme-meta');
    if (colorSchemeMeta) {
      colorSchemeMeta.setAttribute('content', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
