import { create } from 'zustand';

// Sync theme class to document element helper
const applyTheme = (theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    } else {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    }
  }
};

// Defensive check for localStorage
const getStorageItem = (key, fallback) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) || fallback;
    }
  } catch {
    // Ignore storage access errors
  }
  return fallback;
};

const setStorageItem = (key, value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore
  }
};

// Initial theme check
const initialTheme = 'dark'; // locked to dark per GEMINI.md
applyTheme(initialTheme);

export const useSettingsStore = create((set) => ({
  theme: 'dark',
  inputMode: getStorageItem('bms-input-mode', 'mouse'), // 'mouse' | 'touch'

  setTheme: (theme) => {
    setStorageItem('bms-theme', 'dark');
    applyTheme('dark');
    set({ theme: 'dark' });
  },

  setInputMode: (inputMode) => {
    setStorageItem('bms-input-mode', inputMode);
    set({ inputMode });
  }
}));
