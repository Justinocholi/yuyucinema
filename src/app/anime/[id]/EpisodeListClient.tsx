"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Search, Filter, Clock, CheckCircle } from "lucide-react";
import { EpisodeInfo } from "@/types/anime";
import { getWatchHistoryItem } from "@/lib/storage";

interface EpisodeListClientProps {
  animeId: number;
  episodes: EpisodeInfo[];
}

const EPISODES_PER_CHUNK = 25;

export default function EpisodeListClient({ animeId, episodes }: EpisodeListClientProps) {
  const [search, setSearch] = useState("");
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);

  // Check watch history for this anime
  const historyItem = useMemo(() => {
    return getWatchHistoryItem(animeId);
  }, [animeId]);

  // Compute pagination range chunks (e.g. 1-25, 26-50...)
  const totalCount = episodes.length;
  const chunkCount = Math.ceil(totalCount / EPISODES_PER_CHUNK);
  const ranges = useMemo(() => {
    if (totalCount <= EPISODES_PER_CHUNK) return [];
    const list = [];
    for (let i = 0; i < chunkCount; i++) {
      const start = i * EPISODES_PER_CHUNK + 1;
      const end = Math.min((i + 1) * EPISODES_PER_CHUNK, totalCount);
      list.push({ label: `${start}-${end}`, start, end, index: i });
    }
    return list;
  }, [totalCount, chunkCount]);

  // Filter episodes by search and active range
  const filteredEpisodes = useMemo(() => {
    let list = episodes;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return list.filter(
        (ep) =>
          ep.number.toString() === q ||
          (ep.title && ep.title.toLowerCase().includes(q)) ||
          `episode ${ep.number}`.includes(q)
      );
    }

    if (ranges.length > 0) {
      const activeRange = ranges[selectedRangeIndex];
      if (activeRange) {
        list = list.slice(activeRange.start - 1, activeRange.end);
      }
    }

    return list;
  }, [episodes, search, ranges, selectedRangeIndex]);

  return (
    <div className="space-y-4">
      {/* Header, Search & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-yugito-border">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Episodes</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yugito-card border border-yugito-border text-yugito-accentLight">
              {episodes.length}
            </span>
          </h2>
        </div>

        {/* Search input for long series */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search episode # or title..."
            className="w-full bg-yugito-surface text-yugito-text placeholder-yugito-muted/60 text-xs px-3 py-2 pl-8 rounded-xl border border-yugito-border focus:border-yugito-accent focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-yugito-muted absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Range Pills for series with > 25 episodes */}
      {ranges.length > 0 && !search && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {ranges.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setSelectedRangeIndex(r.index)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors ${
                selectedRangeIndex === r.index
                  ? "bg-yugito-accent text-white"
                  : "bg-yugito-card text-yugito-muted hover:text-white hover:bg-yugito-surface border border-yugito-border"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* Episode Grid / List */}
      {filteredEpisodes.length === 0 ? (
        <div className="py-12 text-center bg-yugito-card/50 rounded-xl border border-yugito-border p-6 text-xs text-yugito-muted">
          No episodes matched your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredEpisodes.map((ep) => {
            const isCurrentWatched = historyItem?.episodeNumber === ep.number;
            const isCompleted = historyItem && historyItem.episodeNumber > ep.number;

            return (
              <Link
                key={ep.id}
                href={`/watch/${animeId}/${ep.number}`}
                className={`group flex items-start gap-3 p-3 rounded-xl bg-yugito-card border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-yugito ${
                  isCurrentWatched
                    ? "border-yugito-accent/80 bg-yugito-accent/5"
                    : "border-yugito-border hover:border-yugito-accent/50"
                }`}
              >
                {/* Thumbnail / Number preview */}
                <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-yugito-surface flex items-center justify-center">
                  {ep.image ? (
                    <Image
                      src={ep.image}
                      alt={ep.title || `Episode ${ep.number}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-yugito-surface text-yugito-subtle text-xs font-bold">
                      EP {ep.number}
                    </div>
                  )}

                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 rounded-full bg-yugito-accent text-white flex items-center justify-center shadow">
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Watched Badge */}
                  {isCurrentWatched && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-yugito-accent text-white text-[9px] font-bold">
                      Watched
                    </div>
                  )}
                </div>

                {/* Episode Details */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between text-[11px] text-yugito-muted mb-0.5">
                    <span className="font-bold text-yugito-accentLight">Ep {ep.number}</span>
                    {ep.duration && <span>{ep.duration}m</span>}
                  </div>

                  <h4
                    className="text-xs font-semibold text-yugito-text group-hover:text-white line-clamp-1"
                    title={ep.title}
                  >
                    {ep.title || `Episode ${ep.number}`}
                  </h4>

                  {ep.description ? (
                    <p className="text-[11px] text-yugito-subtle line-clamp-2 mt-1 leading-snug">
                      {ep.description}
                    </p>
                  ) : (
                    <div className="text-[10px] text-yugito-subtle mt-1 flex items-center gap-1">
                      <span>Click to watch episode</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
