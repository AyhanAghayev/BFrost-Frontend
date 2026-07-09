import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "bfrost-theme";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  setTheme: (theme) => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
  init: () => {
    if (typeof window === "undefined") return;
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    applyTheme(stored);
    set({ theme: stored });
    
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (get().theme === "system") applyTheme("system");
      });
  },
}));
