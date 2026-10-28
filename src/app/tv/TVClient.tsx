"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clapperboard,
  Search,
  Star,
  Play,
  Flame,
  Sparkles,
  Tv,
  Calendar,
} from "lucide-react";
import { TMDBMedia, getTMDBImageUrl, searchTMDB, getTrendingTV } from "@/lib/tmdb";

interface TVClientProps {
  initialSeries: TMDBMedia[];
}

export default function TVClient({ initialSeries }: TVClientProps) {
  const [series, setSeries] = useState<TMDBMedia[]>(initialSeries);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSeries(initialSeries);
      return;
    }

    let isCancelled = false;
    const doSearch = async () => {
      setIsLoading(true);
      try {
        const res = await searchTMDB(debouncedQuery, "tv");
        if (!isCancelled) {
          setSeries(res.results);
          setIsLoading(false);
        }
      } catch {
        if (!isCancelled) setIsLoading(false);
      }
    };

    doSearch();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, initialSeries]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 space-y-8">
      {/* Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-[#0c1527]/80 backdrop-blur-xl border border-sky-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold uppercase tracking-wider">
              <Clapperboard className="w-3.5 h-3.5 text-sky-400" />
              <span>Television Series & Dramas</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
              Multi-Season • 1080p FHD
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Popular TV Series
          </h1>
          <p className="text-sm text-yugito-muted leading-relaxed">
            Binge-watch full seasons and episodes of the highest-rated television shows — from Breaking Bad, Stranger Things, and The Last of Us to Shōgun and The Boys.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yugito-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TV shows (e.g. Breaking Bad, Stranger Things, Shōgun)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101d36]/80 border border-sky-500/25 focus:border-sky-400 focus:outline-none text-xs text-white placeholder-yugito-muted"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {series.map((show) => {
          const poster = getTMDBImageUrl(show.posterPath, "w500");
          return (
            <Link
              key={show.id}
              href={`/watch-tv/${show.id}/1/1`}
              className="group flex flex-col space-y-2 rounded-2xl p-2 bg-[#0c1527]/60 hover:bg-[#101d36]/80 border border-sky-500/15 hover:border-sky-400/40 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-sky-500/15"
            >
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/40 border border-sky-500/10">
                <Image
                  src={poster}
                  alt={show.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-amber-400 font-bold text-[10px]">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{show.voteAverage}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/40 scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 px-1">
                <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-sky-300 transition-colors">
                  {show.title}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-yugito-muted">
                  <span>{show.firstAirDate ? new Date(show.firstAirDate).getFullYear() : "TV"}</span>
                  <span className="text-sky-400 font-semibold">TV Series</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
