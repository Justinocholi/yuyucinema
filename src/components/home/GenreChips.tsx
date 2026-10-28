"use client";

import React from "react";
import Link from "next/link";
import { Flame, Compass, Laugh, Heart, Sparkles, Wand2, Rocket, Coffee, Trophy, Ghost, Search, Skull } from "lucide-react";

const GENRES = [
  { name: "Action", icon: Flame, color: "hover:border-red-500/50 hover:text-red-400" },
  { name: "Adventure", icon: Compass, color: "hover:border-emerald-500/50 hover:text-emerald-400" },
  { name: "Comedy", icon: Laugh, color: "hover:border-amber-500/50 hover:text-amber-400" },
  { name: "Drama", icon: Heart, color: "hover:border-pink-500/50 hover:text-pink-400" },
  { name: "Fantasy", icon: Wand2, color: "hover:border-purple-500/50 hover:text-purple-400" },
  { name: "Romance", icon: Sparkles, color: "hover:border-rose-500/50 hover:text-rose-400" },
  { name: "Sci-Fi", icon: Rocket, color: "hover:border-cyan-500/50 hover:text-cyan-400" },
  { name: "Slice of Life", icon: Coffee, color: "hover:border-lime-500/50 hover:text-lime-400" },
  { name: "Sports", icon: Trophy, color: "hover:border-orange-500/50 hover:text-orange-400" },
  { name: "Supernatural", icon: Ghost, color: "hover:border-indigo-500/50 hover:text-indigo-400" },
  { name: "Mystery", icon: Search, color: "hover:border-teal-500/50 hover:text-teal-400" },
  { name: "Psychological", icon: Skull, color: "hover:border-violet-500/50 hover:text-violet-400" },
];

export default function GenreChips() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Browse by Genre</h2>
          <p className="text-xs text-yugito-muted mt-0.5">Explore anime catalogs tailored to your mood</p>
        </div>
        <Link
          href="/explore"
          className="text-xs font-semibold text-yugito-accentLight hover:text-white transition-colors"
        >
          View All Filters
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {GENRES.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.name}
              href={`/explore?genre=${encodeURIComponent(g.name)}`}
              className={`flex items-center gap-2.5 p-3 rounded-2xl bg-[#0c1527]/70 border border-sky-500/15 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-500/15 backdrop-blur-md group ${g.color}`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#101d36] border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold truncate">{g.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
