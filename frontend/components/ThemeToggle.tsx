"use client";

import React, { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initTheme();
    setMounted(true);
  }, [initTheme]);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-transparent ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center gap-2 p-2 rounded-xl transition-all duration-300 cursor-pointer border ${
        isDark
          ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-sm"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm"
      } ${className}`}
      title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Moon size={18} className="text-amber-300 animate-in fade-in zoom-in duration-200" />
        ) : (
          <Sun size={18} className="text-amber-500 animate-in fade-in zoom-in duration-200" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold select-none pr-1">
          {isDark ? "Chế độ Tối" : "Chế độ Sáng"}
        </span>
      )}
    </button>
  );
}
