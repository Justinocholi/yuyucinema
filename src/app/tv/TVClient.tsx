"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Award,
  TrendingUp,
  Layers,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { TMDBMedia, getTMDBImageUrl, TV_GENRES } from "@/lib/tmdb";

interface TVClientProps {
  initialSeries: TMDBMedia[];
}

const TV_CATEGORIES = [
  { id: "trending", label: "Trending Shows", icon: TrendingUp },
  { id: "popular", label: "Most Popular", icon: Flame },
  { id: "top_rated", label: "Top Rated", icon: Award },
  { id: "airing", label: "Airing Now", icon: Calendar },
];

export default function TVClient({ initialSeries }: TVClientProps) {
  const [series, setSeries] = useState<TMDBMedia[]>(initialSeries);
  const [selectedCategory, setSelectedCategory] = useState("trending");
  const [selectedGenreId, setSelectedGenreId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(500);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch TV series when category, genre, or debounced query changes
  useEffect(() => {
    let isCancelled = false;

    const fetchTV = async () => {
      setIsLoadingInitial(true);
      setCurrentPage(1);

      try {
        let endpoint = `/api/media?type=tv&page=1`;
        if (debouncedQuery.trim()) {
          endpoint += `&query=${encodeURIComponent(debouncedQuery.trim())}`;
        } else {
          endpoint += `&category=${selectedCategory}`;
          if (selectedGenreId > 0) {
            endpoint += `&genre=${selectedGenreId}`;
          }
        }

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Failed to load TV series");
        const data = await res.json();

        if (!isCancelled) {
          setSeries(data.results || []);
          setTotalPages(data.totalPages || 1);
          setIsLoadingInitial(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setIsLoadingInitial(false);
        }
      }
    };

    fetchTV();
    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, selectedGenreId, debouncedQuery]);

  // Load More TV Series
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || currentPage >= totalPages) return;
    setIsLoadingMore(true);

    const nextPage = currentPage + 1;
    try {
      let endpoint = `/api/media?type=tv&page=${nextPage}`;
      if (debouncedQuery.trim()) {
        endpoint += `&query=${encodeURIComponent(debouncedQuery.trim())}`;
      } else {
        endpoint += `&category=${selectedCategory}`;
        if (selectedGenreId > 0) {
          endpoint += `&genre=${selectedGenreId}`;
        }
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to load more TV series");
      const data = await res.json();
      const newItems: TMDBMedia[] = data.results || [];

      if (newItems.length > 0) {
        setSeries((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const uniqueNew = newItems.filter((s) => !existingIds.has(s.id));
          return [...prev, ...uniqueNew];
        });
        setCurrentPage(nextPage);
        setTotalPages(data.totalPages || 1);
      } else {
        setTotalPages(currentPage);
      }
    } catch (err) {
      console.error("Error loading more TV series:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, currentPage, totalPages, debouncedQuery, selectedCategory, selectedGenreId]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!infiniteScrollEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          if (!isLoadingMore && !isLoadingInitial && currentPage < totalPages) {
            handleLoadMore();
          }
        }
      },
      { rootMargin: "400px" }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [infiniteScrollEnabled, isLoadingMore, isLoadingInitial, currentPage, totalPages, handleLoadMore]);

  const hasMore = currentPage < totalPages;

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
            Popular TV Series Hub
          </h1>
          <p className="text-sm text-yugito-muted leading-relaxed">
            Binge-watch full seasons and episodes of the highest-rated television shows — from Breaking Bad, Stranger Things, and The Last of Us to Shōgun, House of the Dragon, and The Boys.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yugito-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TV shows (e.g. Breaking Bad, Stranger Things, Shōgun, Game of Thrones)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101d36]/80 border border-sky-500/25 focus:border-sky-400 focus:outline-none text-xs text-white placeholder-yugito-muted"
          />
        </div>

        {/* Categories Strip (when not searching) */}
        {!searchQuery.trim() && (
          <div className="space-y-3 pt-1 border-t border-sky-500/15">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {TV_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedGenreId(0);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-sky-500/25 border border-sky-400/40"
                        : "bg-[#101d36]/70 border border-sky-500/15 text-yugito-muted hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Genre Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-sky-400 mr-1 flex items-center gap-1 whitespace-nowrap">
                <Layers className="w-3 h-3" />
                <span>Genre:</span>
              </span>
              {TV_GENRES.map((g) => {
                const isSelected = selectedGenreId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGenreId(g.id)}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap text-[11px] transition-all ${
                      isSelected
                        ? "bg-sky-500 text-white font-bold shadow-sm"
                        : "bg-[#101d36]/60 border border-sky-500/10 text-yugito-muted hover:text-white"
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="space-y-8">
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
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-amber-400 font-bold text-[10px]">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{show.voteAverage}</span>
                  </div>
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-sky-500/90 text-white font-black text-[9px] uppercase tracking-wider">
                    Series
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
                    <span className="text-sky-400 font-semibold flex items-center gap-1">
                      <Tv className="w-3 h-3" />
                      <span>Full Seasons</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Initial Loading Skeletons */}
        {isLoadingInitial && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2 rounded-2xl p-2 bg-[#0c1527]/40 border border-sky-500/10">
                <div className="aspect-[2/3] w-full rounded-xl bg-white/5" />
                <div className="h-3 w-3/4 rounded bg-white/10" />
                <div className="h-2 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {/* Sentinel for Infinite Scroll */}
        <div ref={sentinelRef} className="h-10 w-full" />

        {/* Load More Button & Status Footer */}
        <div className="flex flex-col items-center justify-center pt-4 pb-8 space-y-3">
          {hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore || isLoadingInitial}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 border border-sky-400/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading Next Batch...</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Load More Series (Page {currentPage + 1} of {totalPages})</span>
                </>
              )}
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-[#0c1527]/80 border border-sky-500/20 text-center text-xs text-yugito-muted max-w-md">
              <span className="font-bold text-white">End of Catalogue: </span>
              You have loaded all available TV series for this category ({series.length} shows displayed).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
