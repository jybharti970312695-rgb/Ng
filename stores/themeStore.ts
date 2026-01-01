import { create } from 'zustand';
import { IThemeState, ThemeOS } from '../types';

export const useThemeStore = create<IThemeState>((set) => ({
  os: 'android', // Default fallback
  darkMode: false,
  
  setOS: (os: ThemeOS) => set({ os }),
  
  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode;
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { darkMode: newMode };
  }),

  detectOS: () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/windows/i.test(userAgent)) {
      set({ os: 'windows' });
    } else {
      set({ os: 'android' });
    }
  }
}));