"use client";

import React, { useEffect } from "react";
import { useThemeStore } from "@/lib/store/themeStore";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme, initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl transition-all duration-300 cursor-pointer border ${
        isDark
          ? "bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 border-slate-700 shadow-sm"
          : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/80 shadow-sm"
      } ${className}`}
      title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          size={18}
          className={`absolute transition-all duration-300 transform ${
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          size={18}
          className={`absolute transition-all duration-300 transform ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold select-none pr-1">
          {isDark ? "Chế độ Tối" : "Chế độ Sáng"}
        </span>
      )}
    </button>
  );
}
