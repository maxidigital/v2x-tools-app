import { create } from 'zustand';

type Theme = 'dark' | 'light';
const KEY = 'v2x-theme';

function readInitial(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch {
    // ignore
  }
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // quota / unavailable
  }
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

/**
 * Shared theme store. Using one store (not per-component useState) is essential:
 * the CodeMirror editors receive the theme as a prop, so every consumer must
 * re-render on toggle — otherwise an editor keeps a stale theme (input stays dark
 * in light mode, etc.). The no-flash script in index.html sets the initial class.
 */
const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitial(),
  setTheme: (theme) => {
    apply(theme);
    set({ theme });
  },
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ theme: next });
  },
}));

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const setTheme = useThemeStore((s) => s.setTheme);
  return { theme, toggle, setTheme, isDark: theme === 'dark' };
}
