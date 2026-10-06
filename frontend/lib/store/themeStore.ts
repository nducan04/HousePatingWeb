import { create } from "zustand";

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  initTheme: () => {
    if (typeof window === "undefined") return;
    try {
      const savedTheme = localStorage.getItem("vtsc_theme") as "light" | "dark" | null;
      let activeTheme: "light" | "dark" = "light";
      if (savedTheme === "dark") {
        activeTheme = "dark";
      } else {
        activeTheme = "light";
      }
      
      if (activeTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      set({ theme: activeTheme });
    } catch (e) {
      set({ theme: "light" });
    }
  },
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      try {
        localStorage.setItem("vtsc_theme", theme);
      } catch (e) {}
    }
    set({ theme });
  },
  toggleTheme: () => {
    const isCurrentlyDark = typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : get().theme === "dark";
    const nextTheme = isCurrentlyDark ? "light" : "dark";
    get().setTheme(nextTheme);
  },
}));
