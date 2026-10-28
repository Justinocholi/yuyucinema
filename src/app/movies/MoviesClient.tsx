"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Film,
  Sparkles,
  Search,
  Star,
  Play,
  Filter,
  SlidersHorizontal,
  Flame,
  Award,
  Compass,
  Download,
  Clapperboard,
} from "lucide-react";
import { Anime } from "@/types/anime";
import { TMDBMedia, getTMDBImageUrl, searchTMDB, getTrendingMovies } from "@/lib/tmdb";
import { searchAnime } from "@/lib/anilist";
import AnimeGrid from "@/components/anime/AnimeGrid";

interface MoviesClientProps {
  initialAnimeMovies: Anime[];
  initialCinemaMovies: TMDBMedia[];
}

export default function MoviesClient({
  initialAnimeMovies,
  initialCinemaMovies,
}: MoviesClientProps) {
  // Mode: 'cinema' (Hollywood/World normal movies) | 'anime' (Anime films)
  const [activeTab, setActiveTab] = useState<"cinema" | "anime">("cinema");

  // Cinema movies state
  const [cinemaList, setCinemaList] = useState<TMDBMedia[]>(initialCinemaMovies);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Anime movies state
  const [animeList, setAnimeList] = useState<Anime[]>(initialAnimeMovies);
  const [animeGenre, setAnimeGenre] = useState("All");

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

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Search Cinema movies
  useEffect(() => {
    if (activeTab !== "cinema") return;
    if (!debouncedQuery.trim()) {
      setCinemaList(initialCinemaMovies);
      return;
    }

    let isCancelled = false;
    const fetchCinema = async () => {
      setIsLoading(true);
      try {
        const res = await searchTMDB(debouncedQuery, "movie");
        if (!isCancelled) {
          setCinemaList(res.results);
          setIsLoading(false);
        }
      } catch {
        if (!isCancelled) setIsLoading(false);
      }
    };
    fetchCinema();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, activeTab, initialCinemaMovies]);

  // Search Anime movies
  useEffect(() => {
    if (activeTab !== "anime") return;

    let isCancelled = false;
    const fetchAnime = async () => {
      setIsLoading(true);
      try {
        const res = await searchAnime({
          query: debouncedQuery || undefined,
          genre: animeGenre !== "All" ? animeGenre : undefined,
          format: "MOVIE",
          perPage: 28,
        });
        if (!isCancelled) {
          setAnimeList(res.media);
          setIsLoading(false);
        }
      } catch {
        if (!isCancelled) setIsLoading(false);
      }
    };
    fetchAnime();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, animeGenre, activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 space-y-8">
      {/* Cinematic Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-[#0c1527]/80 backdrop-blur-xl border border-sky-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold uppercase tracking-wider">
              <Film className="w-3.5 h-3.5 text-sky-400" />
              <span>Global Cinema & Anime Movies</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
              1080p FHD • Stream & Download
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Feature Films Hub
          </h1>
          <p className="text-sm text-yugito-muted leading-relaxed">
            Experience blockbuster Hollywood cinema, award-winning dramas, and legendary anime feature films with multi-audio Sub/Dub and direct high-speed download.
          </p>
        </div>
      </div>

      {/* Main Tab Switcher: Cinema Movies vs Anime Films */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-2 rounded-2xl bg-[#0c1527]/90 border border-sky-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("cinema")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "cinema"
                ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-500/30 border border-sky-400/40"
                : "text-yugito-muted hover:text-white hover:bg-white/5"
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>Cinema & Hollywood Movies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("anime")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "anime"
                ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-sky-500/30 border border-sky-400/40"
                : "text-yugito-muted hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Anime Feature Films</span>
          </button>
        </div>

        <div className="text-xs text-sky-300 font-semibold px-3">
          {activeTab === "cinema" ? `${cinemaList.length} Cinema Titles` : `${animeList.length} Anime Films`}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 space-y-3">
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

        {/* If Anime tab, show genre strip */}
        {activeTab === "anime" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none pt-1 border-t border-sky-500/15">
            <span className="text-[10px] uppercase font-bold text-sky-400 mr-1">Genre:</span>
            {ANIME_GENRES.map((g) => {
              const isSelected = animeGenre === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setAnimeGenre(g)}
                  className={`px-3 py-1 rounded-xl transition-all ${
                    isSelected
                      ? "bg-sky-500 text-white font-bold"
                      : "bg-[#101d36]/60 text-yugito-muted hover:text-white"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Content */}
      {activeTab === "cinema" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
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
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-amber-400 font-bold text-[10px]">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{m.voteAverage}</span>
                  </div>
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-sky-500/90 text-white font-black text-[9px] uppercase tracking-wider">
                    Movie
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
      ) : (
        <AnimeGrid
          animeList={animeList}
          isLoading={isLoading}
          emptyMessage="No anime movies found. Try adjusting the search."
        />
      )}
    </div>
  );
}
