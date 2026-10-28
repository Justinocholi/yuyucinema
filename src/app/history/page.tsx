"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { History, Play, Trash2, Clock, X } from "lucide-react";
import { WatchHistoryItem } from "@/types/anime";
import { getWatchHistory, removeWatchHistoryItem, clearWatchHistory } from "@/lib/storage";
import { formatTimeAgo } from "@/lib/utils";

export default function HistoryPage() {
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

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="h-8 bg-yugito-card rounded w-48 mb-6 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yugito-accent/20 text-yugito-accent flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Watch History
            </h1>
            <p className="text-xs sm:text-sm text-yugito-muted">
              Resume watching your recently streamed episodes
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={clearWatchHistory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-yugito-card hover:bg-yugito-red/10 border border-yugito-border hover:border-yugito-red/40 text-xs text-yugito-muted hover:text-yugito-red transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History Items List */}
      {history.length === 0 ? (
        <div className="py-20 text-center bg-yugito-card/50 rounded-2xl border border-yugito-border p-8">
          <div className="text-4xl mb-3">🕒</div>
          <h3 className="text-base font-bold text-white mb-1">No watch history found</h3>
          <p className="text-xs text-yugito-muted max-w-sm mx-auto mb-6">
            Episodes you watch will automatically be recorded here so you can easily resume right where you left off.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yugito-accent hover:bg-yugito-accentHover text-white text-xs font-bold shadow-lg shadow-yugito-accent/30 transition-all"
          >
            <span>Start Watching</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.animeId}
              className="group flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-yugito-card border border-yugito-border hover:border-yugito-accent/60 transition-all hover:shadow-yugito"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Thumbnail with progress overlay */}
                <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-yugito-surface">
                  {item.animeBanner || item.animeCover ? (
                    <Image
                      src={item.animeBanner || item.animeCover}
                      alt={item.animeTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                  )}

                  {/* Play overlay on hover */}
                  <Link
                    href={`/watch/${item.animeId}/${item.episodeNumber}`}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-8 h-8 rounded-full bg-yugito-accent text-white flex items-center justify-center shadow">
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </div>
                  </Link>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                    <div
                      className="h-full bg-yugito-accent"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-yugito-accentLight">
                      Episode {item.episodeNumber}
                    </span>
                    <span className="text-yugito-subtle">•</span>
                    <span className="text-yugito-muted text-[11px]">
                      {item.progressPercent}% finished
                    </span>
                  </div>

                  <Link href={`/watch/${item.animeId}/${item.episodeNumber}`}>
                    <h3 className="text-sm font-bold text-white hover:text-yugito-accentLight transition-colors truncate">
                      {item.animeTitle}
                    </h3>
                  </Link>

                  <div className="text-[11px] text-yugito-subtle flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Watched {formatTimeAgo(item.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/watch/${item.animeId}/${item.episodeNumber}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yugito-accent hover:bg-yugito-accentHover text-white text-xs font-bold transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">Resume</span>
                </Link>

                <button
                  type="button"
                  onClick={() => removeWatchHistoryItem(item.animeId)}
                  className="p-2 rounded-xl text-yugito-subtle hover:text-yugito-red hover:bg-yugito-surface transition-colors"
                  title="Remove from history"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
