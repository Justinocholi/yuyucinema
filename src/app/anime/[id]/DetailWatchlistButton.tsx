"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, Check, ChevronDown } from "lucide-react";
import { Anime, WatchlistStatus } from "@/types/anime";
import { getWatchlistItem, setWatchlistStatus, removeWatchlistItem } from "@/lib/storage";

export default function DetailWatchlistButton({ anime }: { anime: Anime }) {
  const [status, setStatus] = useState<WatchlistStatus | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const title =
    anime.title.english || anime.title.romaji || anime.title.userPreferred || "Untitled";
  const poster = anime.coverImage?.large || anime.coverImage?.medium || "";

  useEffect(() => {
    const item = getWatchlistItem(anime.id);
    setStatus(item ? item.status : null);

    const handleUpdate = () => {
      const updated = getWatchlistItem(anime.id);
      setStatus(updated ? updated.status : null);
    };

    window.addEventListener("yugito_watchlist_updated", handleUpdate);
    return () => window.removeEventListener("yugito_watchlist_updated", handleUpdate);
  }, [anime.id]);

  const handleSelectStatus = (newStatus: WatchlistStatus) => {
    setWatchlistStatus(
      {
        id: anime.id,
        title,
        cover: poster,
        banner: anime.bannerImage,
        format: anime.format,
        episodes: anime.episodes,
      },
      newStatus
    );
    setStatus(newStatus);
    setDropdownOpen(false);
  };

  const handleRemove = () => {
    removeWatchlistItem(anime.id);
    setStatus(null);
    setDropdownOpen(false);
  };

  const statusLabels: Record<WatchlistStatus, string> = {
    watching: "Watching",
    planning: "Plan to Watch",
    completed: "Completed",
    dropped: "Dropped",
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center rounded-xl bg-yugito-card border border-yugito-border overflow-hidden">
        <button
          type="button"
          onClick={() => {
            if (status) {
              handleRemove();
            } else {
              handleSelectStatus("planning");
            }
          }}
          className={`flex-grow flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold transition-colors ${
            status
              ? "text-yugito-accentLight bg-yugito-accent/10"
              : "text-yugito-text hover:text-white hover:bg-yugito-surface"
          }`}
        >
          {status ? <Check className="w-4 h-4 text-yugito-accent" /> : <Bookmark className="w-4 h-4" />}
          <span>{status ? statusLabels[status] : "Add to Watchlist"}</span>
        </button>

        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-2.5 text-yugito-muted hover:text-white border-l border-yugito-border hover:bg-yugito-surface transition-colors"
          aria-label="Change status"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {dropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-yugito-card border border-yugito-border rounded-xl shadow-yugito py-1 z-30 text-xs">
          {(["watching", "planning", "completed", "dropped"] as WatchlistStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelectStatus(s)}
              className={`w-full text-left px-3.5 py-2 hover:bg-yugito-surface flex items-center justify-between ${
                status === s ? "text-yugito-accent font-bold" : "text-yugito-text"
              }`}
            >
              <span>{statusLabels[s]}</span>
              {status === s && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}

          {status && (
            <div className="border-t border-yugito-border mt-1 pt-1">
              <button
                type="button"
                onClick={handleRemove}
                className="w-full text-left px-3.5 py-2 text-yugito-red hover:bg-yugito-surface"
              >
                Remove from Watchlist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
