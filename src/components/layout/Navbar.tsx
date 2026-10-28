"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bookmark,
  Compass,
  TrendingUp,
  Calendar,
  Home,
  User,
  History,
  X,
  Sparkles,
  Menu,
  Tv,
  Film,
  Clapperboard,
} from "lucide-react";
import { getWatchlist } from "@/lib/storage";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update watchlist count
  useEffect(() => {
    const updateCount = () => {
      const list = getWatchlist();
      setWatchlistCount(list.length);
    };
    updateCount();
    window.addEventListener("yugito_watchlist_updated", updateCount);
    return () => window.removeEventListener("yugito_watchlist_updated", updateCount);
  }, []);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Anime", href: "/explore", icon: Compass },
    { name: "Movies", href: "/movies", icon: Film },
    { name: "TV Series", href: "/tv", icon: Clapperboard },
    { name: "Live TV", href: "/channels", icon: Tv, isLive: true },
    { name: "Trending", href: "/trending", icon: TrendingUp },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Watchlist", href: "/watchlist", icon: Bookmark, badge: watchlistCount },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#070b16]/85 backdrop-blur-xl border-b border-sky-500/20 py-2.5 shadow-2xl shadow-black/60"
            : "bg-gradient-to-b from-[#070b16]/95 via-[#070b16]/60 to-transparent py-3.5 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Brand Logo & Desktop Nav */}
            <div className="flex items-center gap-7">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-sky-400/50 shadow-lg shadow-sky-500/25 group-hover:scale-105 group-hover:border-sky-300 transition-all duration-300 ring-2 ring-sky-500/20">
                  <Image
                    src="/logo.jpg"
                    alt="Yugito Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-wider text-white group-hover:text-sky-300 transition-colors drop-shadow-sm">
                    YUGITO
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-sky-400 font-bold -mt-1 flex items-center gap-1">
                    <span>CINEMA</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "text-white bg-sky-500/20 border border-sky-400/30 text-sky-200 shadow-md shadow-sky-500/10"
                          : "text-yugito-muted hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-sky-400" : ""}`} />
                      <span>{link.name}</span>
                      {link.isLive && (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          LIVE
                        </span>
                      )}
                      {Boolean(link.badge) && link.badge! > 0 && (
                        <span className="bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {link.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-yugito-accent rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Search, Profile & Mobile Hamburger */}
            <div className="flex items-center gap-3">
              {/* Desktop Search Bar */}
              <form onSubmit={handleSearchSubmit} className="hidden sm:flex relative items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anime... (/)"
                  className="w-48 lg:w-64 bg-yugito-surface/80 hover:bg-yugito-surface text-yugito-text placeholder-yugito-muted/60 text-sm px-3.5 py-2 pl-9 rounded-full border border-yugito-border focus:border-yugito-accent focus:w-72 focus:outline-none transition-all"
                />
                <Search className="w-4 h-4 text-yugito-muted absolute left-3 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-yugito-muted hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Mobile Search Icon Trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="sm:hidden p-2 rounded-lg bg-yugito-surface/80 text-yugito-muted hover:text-white border border-yugito-border"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* History Button */}
              <Link
                href="/history"
                className={`p-2 rounded-lg text-yugito-muted hover:text-white hover:bg-yugito-surface/80 border border-transparent hover:border-yugito-border transition-colors ${
                  pathname === "/history" ? "text-yugito-accent" : ""
                }`}
                title="Watch History"
              >
                <History className="w-5 h-5" />
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full bg-yugito-card border border-yugito-border hover:border-yugito-accent/50 transition-colors"
                  aria-label="User Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-yugito-accent/20 text-yugito-accentLight flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-yugito-card border border-yugito-border rounded-xl shadow-yugito py-2 z-50 text-sm animate-fadeIn">
                    <div className="px-4 py-2 border-b border-yugito-border">
                      <div className="font-semibold text-yugito-text">Guest Explorer</div>
                      <div className="text-[11px] text-yugito-accentLight flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-3 h-3" /> Local Storage Active
                      </div>
                    </div>
                    <Link
                      href="/watchlist"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-yugito-muted hover:text-white hover:bg-yugito-surface"
                    >
                      <span className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4" /> My Watchlist
                      </span>
                      {watchlistCount > 0 && (
                        <span className="text-xs bg-yugito-accent/20 text-yugito-accentLight px-1.5 py-0.5 rounded-full font-bold">
                          {watchlistCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/history"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-yugito-muted hover:text-white hover:bg-yugito-surface"
                    >
                      <History className="w-4 h-4" /> Viewing History
                    </Link>
                    <div className="border-t border-yugito-border mt-1 pt-1">
                      <div className="px-4 py-2 text-[11px] text-yugito-subtle leading-tight">
                        Cloud sync and authentication will be available in future releases. All progress is preserved locally.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-yugito-surface/80 text-yugito-muted hover:text-white border border-sky-500/20 backdrop-blur-md"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Dropdown */}
          {searchOpen && (
            <div className="sm:hidden mt-3 pt-3 border-t border-sky-500/20 animate-fadeIn">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anime, movies, series..."
                  className="w-full bg-[#0c1527]/90 text-yugito-text placeholder-yugito-muted/60 text-sm px-4 py-2.5 pl-10 rounded-xl border border-sky-500/30 focus:border-sky-400 focus:outline-none"
                  autoFocus
                />
                <Search className="w-4 h-4 text-yugito-muted absolute left-3.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-yugito-muted hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <nav className="lg:hidden mt-3 py-3 border-t border-sky-500/20 flex flex-col gap-1.5 animate-fadeIn bg-[#0c1527]/95 backdrop-blur-xl p-3 rounded-2xl border border-sky-500/20 shadow-2xl">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? "text-white bg-sky-500/20 border border-sky-400/40 text-sky-200"
                        : "text-yugito-muted hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : ""}`} />
                      <span>{link.name}</span>
                      {link.isLive && (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    {Boolean(link.badge) && link.badge! > 0 && (
                      <span className="bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
