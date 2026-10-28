"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Clock, X, Trash2 } from "lucide-react";
import { WatchHistoryItem } from "@/types/anime";
import { getWatchHistory, removeWatchHistoryItem, clearWatchHistory } from "@/lib/storage";

export default function ContinueWatching() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadHistory = () => {
    setHistory(getWatchHistory());
  };

  useEffect(() => {
    setMounted(true);
    loadHistory();
    window.addEventListener("yugito_history_updated", loadHistory);
    return () => window.removeEventListener("yugito_history_updated", loadHistory);
  }, []);

  if (!mounted || history.length === 0) {
    return null; // Prompt requirement: hide this section when there is no history
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-black tracking-tight text-white">Continue Watching</h2>
          <span className="text-xs text-sky-300 font-semibold bg-sky-500/15 px-2.5 py-0.5 rounded-full border border-sky-500/30">
            {history.length}
          </span>
        </div>

        <button
          type="button"
          onClick={clearWatchHistory}
          className="text-xs text-yugito-subtle hover:text-red-400 flex items-center gap-1 transition-colors"
          title="Clear all viewing history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {history.slice(0, 5).map((item) => (
          <div
            key={item.animeId}
            className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#0c1527]/70 border border-sky-500/20 hover:border-sky-400/50 backdrop-blur-md transition-all hover:shadow-xl hover:shadow-sky-500/20"
          >
            {/* Poster / Thumbnail with Progress Overlay */}
            <div className="relative aspect-video w-full overflow-hidden bg-black/40">
              {item.animeBanner || item.animeCover ? (
                <Image
                  src={item.animeBanner || item.animeCover}
                  alt={item.animeTitle}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-yugito-surface text-yugito-subtle">
                  🎬
                </div>
              )}

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeWatchHistoryItem(item.animeId);
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-yugito-red opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Remove from history"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Play Resume Button on hover */}
              <Link
                href={`/watch/${item.animeId}/${item.episodeNumber}`}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/40 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
              </Link>

              {/* Progress Bar at the bottom of the thumbnail */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-300"
                  style={{ width: `${item.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <Link href={`/watch/${item.animeId}/${item.episodeNumber}`}>
                <h4
                  className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors truncate"
                  title={item.animeTitle}
                >
                  {item.animeTitle}
                </h4>
              </Link>
              <div className="flex items-center justify-between text-[11px] text-yugito-muted mt-1">
                <span className="text-sky-300">Episode {item.episodeNumber}</span>
                <span className="text-sky-400 font-bold">{item.progressPercent}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
