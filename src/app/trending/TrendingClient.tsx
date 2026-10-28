"use client";

import React, { useState } from "react";
import { TrendingUp, Flame, Loader2, Sparkles, Filter } from "lucide-react";
import { Anime } from "@/types/anime";
import { getTrendingAnime, searchAnime } from "@/lib/anilist";
import AnimeGrid from "@/components/anime/AnimeGrid";

interface TrendingClientProps {
  initialTrending: Anime[];
  initialHasNext: boolean;
}

export default function TrendingClient({
  initialTrending,
  initialHasNext,
}: TrendingClientProps) {
  const [animeList, setAnimeList] = useState<Anime[]>(initialTrending);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialHasNext);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Trending" },
    { id: "action", label: "Action & Adventure", genre: "Action" },
    { id: "romance", label: "Romance & Drama", genre: "Romance" },
    { id: "fantasy", label: "Fantasy & Supernatural", genre: "Fantasy" },
    { id: "comedy", label: "Comedy & Slice of Life", genre: "Comedy" },
  ];

  const handleCategoryChange = async (cat: typeof categories[0]) => {
    setSelectedCategory(cat.id);
    setIsLoadingMore(true);
    setCurrentPage(1);

    try {
      if (cat.genre) {
        const res = await searchAnime({
          genre: cat.genre,
          sort: "TRENDING_DESC",
          page: 1,
          perPage: 30,
        });
        setAnimeList(res.media);
        setHasNextPage(res.hasNextPage);
      } else {
        const res = await getTrendingAnime(1, 30);
        setAnimeList(res.media);
        setHasNextPage(res.hasNextPage);
      }
    } catch (err) {
      console.error("Error loading category:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const currentCat = categories.find((c) => c.id === selectedCategory);
      let newMedia: Anime[] = [];
      let nextAvailable = false;

      if (currentCat?.genre) {
        const res = await searchAnime({
          genre: currentCat.genre,
          sort: "TRENDING_DESC",
          page: nextPage,
          perPage: 30,
        });
        newMedia = res.media;
        nextAvailable = res.hasNextPage;
      } else {
        const res = await getTrendingAnime(nextPage, 30);
        newMedia = res.media;
        nextAvailable = res.hasNextPage;
      }

      if (newMedia.length > 0) {
        setAnimeList((prev) => [...prev, ...newMedia]);
        setCurrentPage(nextPage);
        setHasNextPage(nextAvailable);
      } else {
        setHasNextPage(false);
      }
    } catch (err) {
      console.error("Error loading more trending anime:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 space-y-8">
      {/* Cinematic Glass Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-[#0c1527]/75 backdrop-blur-xl border border-sky-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                <span>Global Rankings</span>
              </span>
              <span className="text-xs text-sky-400/80 font-medium">
                Updated in real-time
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Trending Anime Top 100+
            </h1>
            <p className="text-xs sm:text-sm text-yugito-muted max-w-xl">
              Explore the hottest, highest-rated, and most engaged anime series worldwide right now, ranked by global streaming activity.
            </p>
          </div>

          <div className="text-left sm:text-right bg-sky-500/10 border border-sky-500/20 px-4 py-2.5 rounded-2xl backdrop-blur-md">
            <div className="text-[11px] text-sky-300 uppercase tracking-wider font-semibold">Loaded Titles</div>
            <div className="text-xl font-black text-white">{animeList.length} Anime</div>
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/25 font-bold"
                  : "bg-[#101d36]/70 hover:bg-[#152545] text-yugito-muted hover:text-white border-sky-500/15"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid with Global Ranks (#1, #2, #3, ...) */}
      <AnimeGrid
        animeList={animeList}
        showRank={true}
        emptyMessage="No trending titles available right now."
      />

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex flex-col items-center justify-center pt-8 pb-4 space-y-3">
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={handleLoadMore}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-sm shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 border border-sky-400/40"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Loading Next 30 Anime...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Load More Trending Anime ({animeList.length}+)</span>
              </>
            )}
          </button>
          <p className="text-xs text-yugito-subtle">
            Showing top {animeList.length} titles. Click to load the next 30 anime rankings.
          </p>
        </div>
      )}
    </div>
  );
}
