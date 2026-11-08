"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Star,
  Play,
  Film,
  Tv,
  Compass,
  Tag,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { TMDBMedia, getTMDBImageUrl } from "@/lib/tmdb";
import { Anime } from "@/types/anime";

export interface MediaRecommendationItem {
  id: number;
  title: string;
  poster: string;
  rating?: number | string;
  year?: string;
  format?: string;
  genres?: string[];
  href: string;
}

interface MediaRecommendationsProps {
  type: "movie" | "tv" | "anime";
  currentId: number;
  currentTitle: string;
  currentGenres: string[];
  initialItems: any[];
  title?: string;
  subtitle?: string;
}

export default function MediaRecommendations({
  type,
  currentId,
  currentTitle,
  currentGenres,
  initialItems,
  title = "Shows You Might Like",
  subtitle = "Curated recommendations based on genre and audience favorites",
}: MediaRecommendationsProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [items, setItems] = useState<any[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize initial items into standardized recommendation format
  const normalizeItem = (item: any): MediaRecommendationItem => {
    if (type === "movie") {
      const m = item as TMDBMedia;
      const releaseYear = m.releaseDate ? m.releaseDate.split("-")[0] : undefined;
      const genresList = m.genres?.map((g) => g.name) || [];
      return {
        id: m.id,
        title: m.title || "Untitled Movie",
        poster: getTMDBImageUrl(m.posterPath, "w500"),
        rating: m.voteAverage,
        year: releaseYear,
        format: "Movie",
        genres: genresList,
        href: `/watch-movie/${m.id}`,
      };
    }

    if (type === "tv") {
      const t = item as TMDBMedia;
      const firstYear = t.firstAirDate ? t.firstAirDate.split("-")[0] : undefined;
      const genresList = t.genres?.map((g) => g.name) || [];
      return {
        id: t.id,
        title: t.name || t.title || "Untitled Series",
        poster: getTMDBImageUrl(t.posterPath, "w500"),
        rating: t.voteAverage,
        year: firstYear,
        format: "TV Series",
        genres: genresList,
        href: `/watch-tv/${t.id}/1/1`,
      };
    }

    // Anime
    const a = (item.mediaRecommendation || item) as Anime;
    const aTitle =
      a.title?.english || a.title?.romaji || a.title?.userPreferred || "Untitled Anime";
    const aCover =
      a.coverImage?.extraLarge ||
      a.coverImage?.large ||
      a.coverImage?.medium ||
      "/placeholder-poster.png";
    const aScore = a.averageScore ? (a.averageScore / 10).toFixed(1) : undefined;
    const aYear = a.seasonYear ? `${a.seasonYear}` : undefined;

    return {
      id: a.id,
      title: aTitle,
      poster: aCover,
      rating: aScore,
      year: aYear,
      format: a.format || "Anime",
      genres: a.genres || [],
      href: `/watch/${a.id}/1`,
    };
  };

  const handleGenreSelect = async (genre: string) => {
    setSelectedGenre(genre);

    if (genre === "All") {
      setItems(initialItems);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/recommendations?type=${type}&id=${currentId}&genre=${encodeURIComponent(genre)}&limit=12`
      );
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        setItems(data.results);
      } else {
        // Filter in-memory if API returns empty
        const filtered = initialItems.filter((it: any) => {
          const norm = normalizeItem(it);
          return norm.genres?.some((g) => g.toLowerCase() === genre.toLowerCase());
        });
        setItems(filtered.length > 0 ? filtered : initialItems);
      }
    } catch (err) {
      console.warn("Failed to fetch genre recommendations:", err);
      setItems(initialItems);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedList = items
    .map(normalizeItem)
    .filter((item) => item.id !== currentId && Boolean(item.title));

  return (
    <section className="mt-12 space-y-5 rounded-3xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 p-5 sm:p-7 shadow-2xl">
      {/* Header with Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-500/15">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              {title}
            </h2>
          </div>
          <p className="text-xs text-yugito-muted mt-0.5">
            {subtitle} matching <span className="text-sky-300 font-bold">{currentTitle}</span>
          </p>
        </div>

        <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-sky-400" />
          <span>Genre-Powered Recommendations</span>
        </span>
      </div>

      {/* Interactive Genre Filter Pills */}
      {currentGenres && currentGenres.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-yugito-muted font-bold uppercase tracking-wider shrink-0 text-[11px] pr-1">
            Filter by Genre:
          </span>

          <button
            type="button"
            onClick={() => handleGenreSelect("All")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 border ${
              selectedGenre === "All"
                ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/25"
                : "bg-[#101d36]/80 text-yugito-muted hover:text-white border-sky-500/15 hover:bg-[#152545]"
            }`}
          >
            All Recommendations ({initialItems.length})
          </button>

          {currentGenres.map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => handleGenreSelect(g)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 border ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/25"
                    : "bg-[#101d36]/80 text-yugito-muted hover:text-white border-sky-500/15 hover:bg-[#152545]"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Recommendations */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-sky-300 font-semibold tracking-wide">
            Fetching {selectedGenre} Recommendations...
          </p>
        </div>
      ) : normalizedList.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#101d36]/50 border border-sky-500/15 text-center text-xs text-yugito-muted space-y-2">
          <Compass className="w-8 h-8 text-sky-400/50 mx-auto" />
          <p className="font-semibold text-white">No other {selectedGenre} titles found right now.</p>
          <p>Click "All Recommendations" to browse audience favorites.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {normalizedList.slice(0, 12).map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex flex-col rounded-2xl bg-[#0c1527]/90 hover:bg-[#101d36] border border-sky-500/15 hover:border-sky-400/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/20 hover:-translate-y-1"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/40">
                <Image
                  src={item.poster}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1527] via-transparent to-transparent opacity-80" />

                {/* Rating Badge */}
                {item.rating !== undefined && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-black text-amber-400 shadow-md">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                )}

                {/* Format / Year Badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-sky-500/80 backdrop-blur-md text-[9px] font-black text-white uppercase tracking-wider">
                  {item.year || item.format}
                </div>

                {/* Play Button Overlay on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 p-0.5 shadow-xl shadow-sky-500/40">
                    <div className="w-full h-full rounded-full bg-[#0a1224]/80 flex items-center justify-center pl-0.5">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Container */}
              <div className="p-3 flex flex-col justify-between flex-grow space-y-2">
                <div>
                  <h3
                    className="font-bold text-xs text-white group-hover:text-sky-300 transition-colors line-clamp-1"
                    title={item.title}
                  >
                    {item.title}
                  </h3>

                  {/* Genres snippet */}
                  {item.genres && item.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-yugito-muted group-hover:border-sky-500/30 group-hover:text-sky-200 transition-colors"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-sky-500/10 flex items-center justify-between text-[10px] text-yugito-subtle">
                  <span>Watch Now</span>
                  <ChevronRight className="w-3 h-3 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
