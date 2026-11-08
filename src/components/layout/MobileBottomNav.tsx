"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Film,
  Compass,
  Trophy,
  Tv,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [hasLiveSports, setHasLiveSports] = useState(true);

  // Periodic check if there are live sports events
  useEffect(() => {
    const checkLive = async () => {
      try {
        const res = await fetch("/api/sports?status=live");
        const d = await res.json();
        if (d.liveCount !== undefined) {
          setHasLiveSports(d.liveCount > 0);
        }
      } catch {}
    };
    checkLive();
    const interval = setInterval(checkLive, 90000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { name: "Home", href: "/", icon: Home },
    { name: "Movies", href: "/movies", icon: Film },
    { name: "Anime", href: "/explore", icon: Compass },
    { name: "Sports", href: "/sports", icon: Trophy, hasBadge: hasLiveSports, badgeText: "LIVE" },
    { name: "Live TV", href: "/channels", icon: Tv, hasBadge: true, badgeText: "24/7" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070b16]/90 backdrop-blur-2xl border-t border-sky-500/20 px-2 py-1.5 shadow-2xl safe-area-inset-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "text-sky-400 font-bold scale-105"
                  : "text-yugito-muted hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" : ""}`} />
                {item.hasBadge && (
                  <span className={`absolute -top-1 -right-2 text-[8px] font-black uppercase px-1 rounded-full ${
                    item.badgeText === "LIVE"
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-sky-500/80 text-white"
                  }`}>
                    {item.badgeText}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? "text-sky-300 font-extrabold" : "text-yugito-muted font-medium"}`}>
                {item.name}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-sky-400 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
