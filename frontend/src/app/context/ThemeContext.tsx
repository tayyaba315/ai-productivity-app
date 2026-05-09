import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  mode: string;
  accent: string;
  setMode: (mode: string) => void;
  setAccent: (accent: string) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<string>('dark');
  const [accent, setAccentState] = useState<string>('purple');

  useEffect(() => {
    const savedMode = localStorage.getItem('alignai.mode');
    const savedAccent = localStorage.getItem('alignai.accent');
    if (savedMode) setModeState(savedMode);
    if (savedAccent) setAccentState(savedAccent);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'theme-green', 'theme-pink', 'theme-blue');
    
    // Add mode class
    root.classList.add(mode);
    
    // Add accent class
    if (accent === 'green') root.classList.add('theme-green');
    if (accent === 'pink') root.classList.add('theme-pink');
    if (accent === 'blue') root.classList.add('theme-blue');
    // purple is the default, no extra class needed for it
  }, [mode, accent]);

  const setMode = (newMode: string) => {
    setModeState(newMode);
    localStorage.setItem('alignai.mode', newMode);
  };

  const setAccent = (newAccent: string) => {
    setAccentState(newAccent);
    localStorage.setItem('alignai.accent', newAccent);
  };

  const toggleMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);