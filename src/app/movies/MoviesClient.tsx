"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Film,
  Sparkles,
  Search,
  Star,
  Play,
  Clapperboard,
  Download,
  Loader2,
  TrendingUp,
  Flame,
  Award,
  Calendar,
  Layers,
  ChevronDown,
} from "lucide-react";
import { Anime } from "@/types/anime";
import { TMDBMedia, getTMDBImageUrl, MOVIE_GENRES } from "@/lib/tmdb";
import { searchAnime } from "@/lib/anilist";
import AnimeGrid from "@/components/anime/AnimeGrid";

interface MoviesClientProps {
  initialAnimeMovies: Anime[];
  initialCinemaMovies: TMDBMedia[];
}

const CATEGORIES = [
  { id: "trending", label: "Trending Now", icon: TrendingUp },
  { id: "popular", label: "Most Popular", icon: Flame },
  { id: "top_rated", label: "Top Rated", icon: Award },
  { id: "now_playing", label: "In Theaters", icon: Calendar },
];

const ANIME_GENRES = [
  "All",
  "Action",
  "Adventure",
  "Drama",
  "Fantasy",
  "Romance",
  "Sci-Fi",
  "Supernatural",
  "Mystery",
];

export default function MoviesClient({
  initialAnimeMovies,
  initialCinemaMovies,
}: MoviesClientProps) {
  // Mode: 'cinema' (Hollywood/World cinema movies) | 'anime' (Anime films)
  const [activeTab, setActiveTab] = useState<"cinema" | "anime">("cinema");

  // Cinema movies state
  const [cinemaList, setCinemaList] = useState<TMDBMedia[]>(initialCinemaMovies);
  const [selectedCategory, setSelectedCategory] = useState("trending");
  const [selectedGenreId, setSelectedGenreId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(500);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(true);

  // Anime movies state
  const [animeList, setAnimeList] = useState<Anime[]>(initialAnimeMovies);
  const [animeGenre, setAnimeGenre] = useState("All");
  const [animePage, setAnimePage] = useState(1);
  const [animeHasNext, setAnimeHasNext] = useState(true);
  const [isLoadingAnimeMore, setIsLoadingAnimeMore] = useState(false);

  // Observer ref for infinite scrolling
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Cinema movies when category, genre, or debounced query changes
  useEffect(() => {
    if (activeTab !== "cinema") return;

    let isCancelled = false;
    const fetchCinema = async () => {
      setIsLoadingInitial(true);
      setCurrentPage(1);

      try {
        let endpoint = `/api/media?type=movie&page=1`;
        if (debouncedQuery.trim()) {
          endpoint += `&query=${encodeURIComponent(debouncedQuery.trim())}`;
        } else {
          endpoint += `&category=${selectedCategory}`;
          if (selectedGenreId > 0) {
            endpoint += `&genre=${selectedGenreId}`;
          }
        }

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Failed to load movies");
        const data = await res.json();

        if (!isCancelled) {
          setCinemaList(data.results || []);
          setTotalPages(data.totalPages || 1);
          setIsLoadingInitial(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setIsLoadingInitial(false);
        }
      }
    };

    fetchCinema();
    return () => {
      isCancelled = true;
    };
  }, [activeTab, selectedCategory, selectedGenreId, debouncedQuery]);

  // Fetch Anime movies when search query or genre changes
  useEffect(() => {
    if (activeTab !== "anime") return;

    let isCancelled = false;
    const fetchAnime = async () => {
      setIsLoadingInitial(true);
      setAnimePage(1);

      try {
        const res = await searchAnime({
          query: debouncedQuery || undefined,
          genre: animeGenre !== "All" ? animeGenre : undefined,
          format: "MOVIE",
          page: 1,
          perPage: 28,
        });

        if (!isCancelled) {
          setAnimeList(res.media);
          setAnimeHasNext(res.hasNextPage);
          setIsLoadingInitial(false);
        }
      } catch {
        if (!isCancelled) setIsLoadingInitial(false);
      }
    };

    fetchAnime();
    return () => {
      isCancelled = true;
    };
  }, [activeTab, debouncedQuery, animeGenre]);

  // Load More Cinema Movies
  const handleLoadMoreCinema = useCallback(async () => {
    if (isLoadingMore || currentPage >= totalPages) return;
    setIsLoadingMore(true);

    const nextPage = currentPage + 1;
    try {
      let endpoint = `/api/media?type=movie&page=${nextPage}`;
      if (debouncedQuery.trim()) {
        endpoint += `&query=${encodeURIComponent(debouncedQuery.trim())}`;
      } else {
        endpoint += `&category=${selectedCategory}`;
        if (selectedGenreId > 0) {
          endpoint += `&genre=${selectedGenreId}`;
        }
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Load more failed");
      const data = await res.json();
      const newItems: TMDBMedia[] = data.results || [];

      if (newItems.length > 0) {
        setCinemaList((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = newItems.filter((m) => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
        setCurrentPage(nextPage);
        setTotalPages(data.totalPages || 1);
      } else {
        setTotalPages(currentPage);
      }
    } catch (err) {
      console.error("Error loading more cinema movies:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, currentPage, totalPages, debouncedQuery, selectedCategory, selectedGenreId]);

  // Load More Anime Movies
  const handleLoadMoreAnime = useCallback(async () => {
    if (isLoadingAnimeMore || !animeHasNext) return;
    setIsLoadingAnimeMore(true);

    const nextPage = animePage + 1;
    try {
      const res = await searchAnime({
        query: debouncedQuery || undefined,
        genre: animeGenre !== "All" ? animeGenre : undefined,
        format: "MOVIE",
        page: nextPage,
        perPage: 28,
      });

      if (res.media.length > 0) {
        setAnimeList((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const uniqueNew = res.media.filter((a) => !existingIds.has(a.id));
          return [...prev, ...uniqueNew];
        });
        setAnimePage(nextPage);
        setAnimeHasNext(res.hasNextPage);
      } else {
        setAnimeHasNext(false);
      }
    } catch (err) {
      console.error("Error loading more anime movies:", err);
    } finally {
      setIsLoadingAnimeMore(false);
    }
  }, [isLoadingAnimeMore, animeHasNext, animePage, debouncedQuery, animeGenre]);

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    if (!infiniteScrollEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          if (activeTab === "cinema") {
            if (!isLoadingMore && !isLoadingInitial && currentPage < totalPages) {
              handleLoadMoreCinema();
            }
          } else {
            if (!isLoadingAnimeMore && !isLoadingInitial && animeHasNext) {
              handleLoadMoreAnime();
            }
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
  }, [
    activeTab,
    infiniteScrollEnabled,
    isLoadingMore,
    isLoadingAnimeMore,
    isLoadingInitial,
    currentPage,
    totalPages,
    animeHasNext,
    handleLoadMoreCinema,
    handleLoadMoreAnime,
  ]);

  const hasMoreCinema = currentPage < totalPages;
  const hasMoreAnime = animeHasNext;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-20 space-y-6 sm:space-y-8">
      {/* Cinematic Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-10 bg-[#0c1527]/80 backdrop-blur-xl border border-sky-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold uppercase tracking-wider">
              <Film className="w-3.5 h-3.5 text-sky-400" />
              <span>Global Cinema & Anime Movies</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
              1080p FHD • Stream & Download
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Feature Films Hub
          </h1>
          <p className="text-xs sm:text-sm text-yugito-muted leading-relaxed">
            Experience blockbuster Hollywood cinema, award-winning dramas, and legendary anime feature films with multi-audio Sub/Dub, smart stream failover, and direct high-speed download.
          </p>
        </div>
      </div>

      {/* Main Tab Switcher: Cinema Movies vs Anime Films */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-2 sm:p-2.5 rounded-2xl bg-[#0c1527]/90 border border-sky-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab("cinema");
              setSearchQuery("");
            }}
            className={`flex-1 sm:flex-initial justify-center flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === "cinema"
                ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-500/30 border border-sky-400/40"
                : "text-yugito-muted hover:text-white hover:bg-white/5"
            }`}
          >
            <Clapperboard className="w-4 h-4 shrink-0" />
            <span className="truncate">Cinema & Movies</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("anime");
              setSearchQuery("");
            }}
            className={`flex-1 sm:flex-initial justify-center flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              activeTab === "anime"
                ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-500/30 border border-sky-400/40"
                : "text-yugito-muted hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">Anime Films</span>
          </button>
        </div>

        <div className="text-xs text-sky-300 font-semibold px-2 sm:px-3 text-center sm:text-right">
          {activeTab === "cinema"
            ? `${cinemaList.length} Loaded (${currentPage} / ${totalPages} Pages)`
            : `${animeList.length} Anime Films Loaded`}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yugito-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "cinema"
                ? "Search movies (e.g. Dune, Deadpool, Oppenheimer, Inception)..."
                : "Search anime films (e.g. Your Name, Mugen Train, Spirited Away)..."
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101d36]/80 border border-sky-500/25 focus:border-sky-400 focus:outline-none text-xs text-white placeholder-yugito-muted"
          />
        </div>

        {/* Categories Strip for Cinema (only when not searching) */}
        {activeTab === "cinema" && !searchQuery.trim() && (
          <div className="space-y-3 pt-1 border-t border-sky-500/15">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
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
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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

            {/* Genre Strip for Cinema */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-sky-400 mr-1 flex items-center gap-1 whitespace-nowrap">
                <Layers className="w-3 h-3" />
                <span>Genre:</span>
              </span>
              {MOVIE_GENRES.map((g) => {
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

        {/* If Anime tab, show anime genre strip */}
        {activeTab === "anime" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none pt-1 border-t border-sky-500/15">
            <span className="text-[10px] uppercase font-bold text-sky-400 mr-1 whitespace-nowrap">Genre:</span>
            {ANIME_GENRES.map((g) => {
              const isSelected = animeGenre === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setAnimeGenre(g)}
                  className={`px-3 py-1 rounded-xl whitespace-nowrap text-[11px] transition-all ${
                    isSelected
                      ? "bg-sky-500 text-white font-bold shadow-sm"
                      : "bg-[#101d36]/60 border border-sky-500/10 text-yugito-muted hover:text-white"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Section */}
      {activeTab === "cinema" ? (
        <div className="space-y-8">
          {/* Cinema Movies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
            {cinemaList.map((m) => {
              const poster = getTMDBImageUrl(m.posterPath, "w500");
              return (
                <Link
                  key={m.id}
                  href={`/watch-movie/${m.id}`}
                  className="group flex flex-col space-y-2 rounded-2xl p-2 bg-[#0c1527]/60 hover:bg-[#101d36]/80 border border-sky-500/15 hover:border-sky-400/40 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-sky-500/15"
                >
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/40 border border-sky-500/10">
                    <Image
                      src={poster}
                      alt={m.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-amber-400 font-bold text-[10px]">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{m.voteAverage}</span>
                    </div>
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-sky-500/90 text-white font-black text-[9px] uppercase tracking-wider">
                      1080p
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/40 scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0.5 px-1">
                    <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-sky-300 transition-colors">
                      {m.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-yugito-muted">
                      <span>{m.releaseDate ? new Date(m.releaseDate).getFullYear() : "Cinema"}</span>
                      <span className="text-sky-400 font-semibold flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Initial Loading Skeletons */}
          {isLoadingInitial && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
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
            {hasMoreCinema ? (
              <button
                type="button"
                onClick={handleLoadMoreCinema}
                disabled={isLoadingMore || isLoadingInitial}
                className="flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 border border-sky-400/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-center"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading Next Batch...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Load More Movies (Page {currentPage + 1} of {totalPages})</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-[#0c1527]/80 border border-sky-500/20 text-center text-xs text-yugito-muted max-w-md mx-3">
                <span className="font-bold text-white">End of Catalogue: </span>
                You have reached the end of the available movie library for this filter ({cinemaList.length} titles displayed).
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <AnimeGrid
            animeList={animeList}
            isLoading={isLoadingInitial}
            emptyMessage="No anime movies found. Try adjusting the search."
          />

          {/* Sentinel for Anime Infinite Scroll */}
          <div ref={sentinelRef} className="h-10 w-full" />

          {/* Load More Button for Anime */}
          <div className="flex flex-col items-center justify-center pt-4 pb-8 space-y-3">
            {hasMoreAnime ? (
              <button
                type="button"
                onClick={handleLoadMoreAnime}
                disabled={isLoadingAnimeMore || isLoadingInitial}
                className="flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 border border-sky-400/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-center"
              >
                {isLoadingAnimeMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading More Anime Films...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Load More Anime Films (Page {animePage + 1})</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-[#0c1527]/80 border border-sky-500/20 text-center text-xs text-yugito-muted max-w-md mx-3">
                <span className="font-bold text-white">End of Catalogue: </span>
                All anime feature films for this category have been loaded.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
