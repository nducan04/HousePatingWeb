"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import ThemeToggle from "@/components/ThemeToggle";
import AuthNav from "@/lib/components/AuthNav";

interface PublicNavbarProps {
  activeRoute?: string;
  onOpenLogin?: () => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export default function PublicNavbar({
  activeRoute = "/",
  onOpenLogin,
  searchTerm: externalSearch,
  onSearchChange,
}: PublicNavbarProps) {
  const router = useRouter();
  const { cartItemCount } = useCartStore();
  const [localSearch, setLocalSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentSearch = externalSearch !== undefined ? externalSearch : localSearch;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(currentSearch);
    } else if (currentSearch.trim()) {
      router.push(`/shop?q=${encodeURIComponent(currentSearch.trim())}`);
    }
  };

  const navLinks = [
    { label: "Trang chủ", href: "/" },
    { label: "Sản phẩm", href: "/shop" },
    { label: "Bảng màu", href: "/colors" },
    { label: "Theo dõi & Tra cứu", href: "/tracking" },
    { label: "Quy trình", href: "/#quy-trinh" },
    { label: "Tin tức", href: "/#tin-tuc" },
  ];

  return (
    <header className="sticky top-0 z-[100] bg-white/85 dark:bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 no-underline group flex-shrink-0"
        >
          <img
            src="/vtsc.png"
            alt="VTSC Logo"
            className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              activeRoute === link.href ||
              (link.href !== "/" && activeRoute.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all no-underline ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Search + Cart + Theme + Auth */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search Box (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden lg:flex items-center w-[180px] xl:w-[220px] bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-3.5 h-10 border border-slate-200/50 dark:border-slate-700/80 transition-colors"
          >
            <Search size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm sản phẩm, mã màu..."
              className="bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 ml-2.5 w-full placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={currentSearch}
              onChange={(e) => {
                if (onSearchChange) onSearchChange(e.target.value);
                else setLocalSearch(e.target.value);
              }}
            />
          </form>

          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative group cursor-pointer no-underline p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            title="Giỏ hàng"
          >
            <ShoppingCart
              size={21}
              className="transition-colors text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
            />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Dark / Light Mode Switcher */}
          <ThemeToggle />

          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

          {/* User Auth or Sign-in Button */}
          <AuthNav onOpenLogin={onOpenLogin} />

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200/60 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-2xl px-6 py-4 space-y-2 animate-in slide-in-from-top-3 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full bg-slate-100 dark:bg-slate-800/90 rounded-2xl px-4 h-11 border border-slate-200 dark:border-slate-700 mb-3">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Tìm sản phẩm sơn, mã màu..."
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-slate-100 ml-3 w-full"
              value={currentSearch}
              onChange={(e) => {
                if (onSearchChange) onSearchChange(e.target.value);
                else setLocalSearch(e.target.value);
              }}
            />
          </form>

          {navLinks.map((link) => {
            const isActive =
              activeRoute === link.href ||
              (link.href !== "/" && activeRoute.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm no-underline transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
