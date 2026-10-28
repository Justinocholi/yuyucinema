import React from "react";
import { Anime } from "@/types/anime";
import AnimeCard from "./AnimeCard";

interface AnimeGridProps {
  animeList: Anime[];
  isLoading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
  showRank?: boolean;
}

export default function AnimeGrid({
  animeList,
  isLoading = false,
  skeletonCount = 12,
  emptyMessage = "No anime found matching your criteria.",
  showRank = false,
}: AnimeGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl overflow-hidden bg-yugito-card border border-yugito-border/60 animate-pulse"
          >
            <div className="aspect-[2/3] bg-yugito-surface" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-yugito-surface rounded w-3/4" />
              <div className="h-3 bg-yugito-surface rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!animeList || animeList.length === 0) {
    return (
      <div className="py-16 text-center bg-yugito-card/50 rounded-2xl border border-yugito-border p-8">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-base font-semibold text-white mb-1">No results found</h3>
        <p className="text-xs text-yugito-muted max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {animeList.map((anime, idx) => (
        <AnimeCard
          key={anime.id}
          anime={anime}
          rank={showRank ? idx + 1 : undefined}
          priority={idx < 6}
        />
      ))}
    </div>
  );
}
