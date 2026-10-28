"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Server,
  Star,
  Clock,
  Calendar,
  Download,
  Share2,
  Bookmark,
  Sparkles,
  Film,
  Play,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { TMDBMedia, getTMDBImageUrl } from "@/lib/tmdb";
import DownloadModal from "@/components/player/DownloadModal";

interface WatchMovieClientProps {
  movie: TMDBMedia;
}

const MOVIE_PROVIDERS = [
  {
    id: "multiembed",
    name: "MultiEmbed (VIP Cinema)",
    note: "1080p FHD • Multi-Server Failover",
    getUrl: (id: number) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
  {
    id: "vidsrc",
    name: "VidSrc.to (Ultra Cinema)",
    note: "1080p FHD • Fast Direct Stream",
    getUrl: (id: number) => `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    id: "2embed",
    name: "2Embed (Fast Mirror)",
    note: "High-Speed CDN • Global Edge",
    getUrl: (id: number) => `https://www.2embed.cc/embed/${id}`,
  },
  {
    id: "nontongo",
    name: "NontonGo (Cinema HD)",
    note: "Instant Play • 1080p Stream",
    getUrl: (id: number) => `https://www.nontongo.win/embed/movie/${id}`,
  },
  {
    id: "smashystream",
    name: "SmashyStream (Mirror)",
    note: "1080p Theatrical • Shielded",
    getUrl: (id: number) => `https://player.smashystream.com/movie/${id}`,
  },
];

export default function WatchMovieClient({ movie }: WatchMovieClientProps) {
  const [selectedProvider, setSelectedProvider] = useState(MOVIE_PROVIDERS[0].id);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Ad-Shield & Anti-Popup Interceptor:
  // Neutralize rogue window.open or clickjacking popup calls attempted by embed scripts
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string) {
      console.warn("[Yugito Ad-Shield] Neutralized popup attempt:", url);
      return null;
    };
    return () => {
      window.open = originalOpen;
    };
  }, []);

  const activeProvider =
    MOVIE_PROVIDERS.find((p) => p.id === selectedProvider) || MOVIE_PROVIDERS[0];
  const streamUrl = activeProvider.getUrl(movie.id);

  const backdrop = getTMDBImageUrl(movie.backdropPath, "original");
  const poster = getTMDBImageUrl(movie.posterPath, "w500");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-yugito-muted">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/movies" className="hover:text-white transition-colors">
          Movies
        </Link>
        <span>/</span>
        <span className="text-white font-semibold truncate">{movie.title}</span>
      </div>

      {/* Main Player Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 3 Cols: Video Player & Controls */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-sky-500/25">
            <iframe
              key={`${movie.id}-${selectedProvider}`}
              src={streamUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="origin"
              title={movie.title}
            />

            {/* Quality & Ad-Shield Watermarks */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider">
                {activeProvider.name}
              </span>
              <span className="px-2 py-1 rounded-xl bg-sky-500/80 backdrop-blur-md text-white text-[10px] font-black">
                1080p FHD
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Ad-Shield Active</span>
              </span>
            </div>
          </div>

          {/* Action Bar (Title, Download & Save) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Feature Film
                </span>
                {movie.releaseDate && (
                  <span className="text-xs text-yugito-muted">
                    {new Date(movie.releaseDate).getFullYear()}
                  </span>
                )}
                {movie.runtime && (
                  <>
                    <span className="text-yugito-muted">•</span>
                    <span className="text-xs text-yugito-muted">{movie.runtime} min</span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{movie.title}</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDownloadOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 border border-sky-400/40"
              >
                <Download className="w-4 h-4" />
                <span>Download Movie</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isBookmarked
                    ? "bg-sky-500 text-white border-sky-400"
                    : "bg-[#101d36]/70 hover:bg-[#152545] text-yugito-muted hover:text-white border-sky-500/20"
                }`}
                title="Save to Watchlist"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Provider Selector Strip */}
          <div className="p-4 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-sky-500/15">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Server className="w-4 h-4 text-sky-400" />
                <span>Streaming Server</span>
              </div>
              <span className="text-[11px] text-sky-300 font-semibold">
                Multi-Server Cinema Gateway
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {MOVIE_PROVIDERS.map((p) => {
                const isSelected = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProvider(p.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-sky-500/25 border-sky-400 text-sky-200 shadow-md shadow-sky-500/20"
                        : "bg-[#101d36]/70 border-sky-500/15 text-yugito-muted hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${isSelected ? "bg-sky-400 animate-pulse" : "bg-white/20"}`}
                    />
                    <div className="flex flex-col items-start text-left leading-tight">
                      <span>{p.name}</span>
                      <span className="text-[9px] text-yugito-subtle">{p.note}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Synopsis */}
          <div className="p-5 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Overview</h3>
            <p className="text-xs sm:text-sm text-yugito-muted leading-relaxed">
              {movie.overview}
            </p>
          </div>
        </div>

        {/* Right 1 Col: Movie Poster & Info */}
        <div className="lg:col-span-1 rounded-3xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 p-5 space-y-4 shadow-xl">
          <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden border border-sky-500/25 shadow-lg">
            <Image src={poster} alt={movie.title} fill className="object-cover" priority />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-sky-500/15">
              <span className="text-yugito-muted">Audience Rating</span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{movie.voteAverage} / 10</span>
              </span>
            </div>

            {movie.releaseDate && (
              <div className="flex items-center justify-between pb-2 border-b border-sky-500/15">
                <span className="text-yugito-muted">Release Date</span>
                <span className="text-white font-semibold">{movie.releaseDate}</span>
              </div>
            )}

            {movie.runtime && (
              <div className="flex items-center justify-between pb-2 border-b border-sky-500/15">
                <span className="text-yugito-muted">Duration</span>
                <span className="text-white font-semibold">{movie.runtime} minutes</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-yugito-muted">Format</span>
              <span className="text-sky-300 font-semibold uppercase">Theatrical Movie</span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <DownloadModal
        isOpen={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        title={movie.title}
        streamUrl={streamUrl}
        quality="1080p FHD"
        type="movie"
      />
    </div>
  );
}
