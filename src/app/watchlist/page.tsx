"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Play, Trash2, CheckCircle, Clock } from "lucide-react";
import { WatchlistItem, WatchlistStatus } from "@/types/anime";
import { getWatchlist, removeWatchlistItem, setWatchlistStatus } from "@/lib/storage";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [activeTab, setActiveTab] = useState<WatchlistStatus | "all">("all");
  const [mounted, setMounted] = useState(false);

  const loadList = () => {
    setWatchlist(getWatchlist());
  };

  useEffect(() => {
    setMounted(true);
    loadList();
    window.addEventListener("yugito_watchlist_updated", loadList);
    return () => window.removeEventListener("yugito_watchlist_updated", loadList);
  }, []);

  const tabs: Array<{ id: WatchlistStatus | "all"; label: string }> = [
    { id: "all", label: "All Titles" },
    { id: "watching", label: "Watching" },
    { id: "planning", label: "Plan to Watch" },
    { id: "completed", label: "Completed" },
    { id: "dropped", label: "Dropped" },
  ];

  const filteredList =
    activeTab === "all" ? watchlist : watchlist.filter((item) => item.status === activeTab);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yugito-accent/20 text-yugito-accent flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Watchlist
            </h1>
            <p className="text-xs sm:text-sm text-yugito-muted">
              {watchlist.length} {watchlist.length === 1 ? "title" : "titles"} saved to your library
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8 border-b border-yugito-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === "all"
              ? watchlist.length
              : watchlist.filter((i) => i.status === tab.id).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${
                isActive
                  ? "bg-yugito-accent text-white shadow-md shadow-yugito-accent/30"
                  : "bg-yugito-card/80 text-yugito-muted hover:text-white hover:bg-yugito-surface border border-yugito-border/50"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-yugito-surface text-yugito-subtle"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Watchlist Grid / Empty State */}
      {filteredList.length === 0 ? (
        <div className="py-20 text-center bg-yugito-card/50 rounded-2xl border border-yugito-border p-8">
          <div className="text-4xl mb-3">🔖</div>
          <h3 className="text-base font-bold text-white mb-1">Your watchlist is empty</h3>
          <p className="text-xs text-yugito-muted max-w-sm mx-auto mb-6">
            Explore anime titles and bookmark your favorites to track what to watch next.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yugito-accent hover:bg-yugito-accentHover text-white text-xs font-bold shadow-lg shadow-yugito-accent/30 transition-all"
          >
            <span>Discover Anime</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredList.map((item) => (
            <div
              key={item.animeId}
              className="group relative flex flex-col rounded-xl overflow-hidden bg-yugito-card border border-yugito-border hover:border-yugito-accent/60 transition-all duration-300 hover:shadow-yugito"
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] w-full bg-yugito-surface overflow-hidden">
                {item.animeCover ? (
                  <Image
                    src={item.animeCover}
                    alt={item.animeTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Status Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-black/60 backdrop-blur-sm text-yugito-accentLight text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10 uppercase">
                    {item.status}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeWatchlistItem(item.animeId);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-yugito-red transition-colors z-10 opacity-0 group-hover:opacity-100"
                  title="Remove from watchlist"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                {/* Play Button on hover */}
                <Link
                  href={`/watch/${item.animeId}/1`}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-yugito-accent text-white flex items-center justify-center shadow-lg shadow-yugito-accent/40 transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </Link>
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col justify-between flex-grow">
                <Link href={`/anime/${item.animeId}`}>
                  <h3
                    className="text-xs font-semibold text-yugito-text group-hover:text-white transition-colors line-clamp-2"
                    title={item.animeTitle}
                  >
                    {item.animeTitle}
                  </h3>
                </Link>

                <div className="flex items-center justify-between text-[11px] text-yugito-muted mt-2">
                  <span>{item.format || "Anime"}</span>
                  {item.totalEpisodes && <span>{item.totalEpisodes} eps</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
