"use client";

import { WatchHistoryItem, WatchlistItem, WatchlistStatus } from "@/types/anime";

const HISTORY_KEY = "yugito_watch_history";
const WATCHLIST_KEY = "yugito_watchlist";
const SETTINGS_KEY = "yugito_player_settings";

export interface PlayerSettings {
  volume: number;
  muted: boolean;
  preferredAudio: "sub" | "dub";
  autoPlayNext: boolean;
  autoSkipIntro: boolean;
}

const DEFAULT_SETTINGS: PlayerSettings = {
  volume: 1,
  muted: false,
  preferredAudio: "sub",
  autoPlayNext: true,
  autoSkipIntro: false,
};

// --- WATCH HISTORY ---

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to read watch history:", e);
    return [];
  }
}

export function getWatchHistoryItem(animeId: number): WatchHistoryItem | null {
  const history = getWatchHistory();
  return history.find((h) => h.animeId === animeId) || null;
}

export function saveWatchProgress(item: Omit<WatchHistoryItem, "updatedAt" | "progressPercent">): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory();
    const duration = item.duration > 0 ? item.duration : 1;
    const progressPercent = Math.min(100, Math.max(0, Math.round((item.currentTime / duration) * 100)));

    const existingIndex = history.findIndex((h) => h.animeId === item.animeId);
    const updatedItem: WatchHistoryItem = {
      ...item,
      progressPercent,
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      history[existingIndex] = updatedItem;
    } else {
      history.unshift(updatedItem);
    }

    // Keep up to 50 recent items
    const trimmed = history.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent("yugito_history_updated"));
  } catch (e) {
    console.error("Failed to save watch progress:", e);
  }
}

export function removeWatchHistoryItem(animeId: number): void {
  if (typeof window === "undefined") return;
  try {
    const history = getWatchHistory().filter((h) => h.animeId !== animeId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent("yugito_history_updated"));
  } catch (e) {
    console.error("Failed to remove history item:", e);
  }
}

export function clearWatchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new CustomEvent("yugito_history_updated"));
  } catch (e) {
    console.error("Failed to clear history:", e);
  }
}

// --- WATCHLIST ---

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to read watchlist:", e);
    return [];
  }
}

export function getWatchlistItem(animeId: number): WatchlistItem | null {
  const list = getWatchlist();
  return list.find((item) => item.animeId === animeId) || null;
}

export function setWatchlistStatus(
  anime: { id: number; title: string; cover: string; banner?: string; format?: string; episodes?: number },
  status: WatchlistStatus
): void {
  if (typeof window === "undefined") return;
  try {
    const list = getWatchlist();
    const existingIndex = list.findIndex((item) => item.animeId === anime.id);

    const updatedItem: WatchlistItem = {
      animeId: anime.id,
      animeTitle: anime.title,
      animeCover: anime.cover,
      animeBanner: anime.banner,
      format: anime.format,
      totalEpisodes: anime.episodes,
      status,
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedItem;
    } else {
      list.unshift(updatedItem);
    }

    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("yugito_watchlist_updated"));
  } catch (e) {
    console.error("Failed to update watchlist:", e);
  }
}

export function removeWatchlistItem(animeId: number): void {
  if (typeof window === "undefined") return;
  try {
    const list = getWatchlist().filter((item) => item.animeId !== animeId);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("yugito_watchlist_updated"));
  } catch (e) {
    console.error("Failed to remove from watchlist:", e);
  }
}

// --- PLAYER SETTINGS ---

export function getPlayerSettings(): PlayerSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function savePlayerSettings(settings: Partial<PlayerSettings>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getPlayerSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Failed to save player settings:", e);
  }
}
