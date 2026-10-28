"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Server,
  Star,
  Download,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { TMDBMedia, getTMDBImageUrl } from "@/lib/tmdb";
import DownloadModal from "@/components/player/DownloadModal";

interface WatchTVClientProps {
  show: TMDBMedia;
  seasonNumber: number;
  episodeNumber: number;
}

const TV_PROVIDERS = [
  {
    id: "multiembed",
    name: "MultiEmbed (VIP Cinema)",
    note: "1080p FHD • Multi-Server Failover",
    getUrl: (id: number, s: number, e: number) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc.to (Ultra Cinema)",
    note: "1080p FHD • Fast Direct Stream",
    getUrl: (id: number, s: number, e: number) =>
      `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "2embed",
    name: "2Embed (Fast Mirror)",
    note: "High-Speed CDN • Global Edge",
    getUrl: (id: number, s: number, e: number) =>
      `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: "nontongo",
    name: "NontonGo (Cinema HD)",
    note: "Instant Play • 1080p Stream",
    getUrl: (id: number, s: number, e: number) =>
      `https://www.nontongo.win/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "smashystream",
    name: "SmashyStream (Mirror)",
    note: "1080p TV • Shielded",
    getUrl: (id: number, s: number, e: number) =>
      `https://player.smashystream.com/tv/${id}/${s}/${e}`,
  },
];

export default function WatchTVClient({
  show,
  seasonNumber,
  episodeNumber,
}: WatchTVClientProps) {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState(TV_PROVIDERS[0].id);
  const [selectedSeason, setSelectedSeason] = useState(seasonNumber);
  const [downloadOpen, setDownloadOpen] = useState(false);

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
    TV_PROVIDERS.find((p) => p.id === selectedProvider) || TV_PROVIDERS[0];
  const streamUrl = activeProvider.getUrl(show.id, selectedSeason, episodeNumber);

  // Available seasons
  const seasons = (show.seasons && show.seasons.length > 0)
    ? show.seasons.filter((s) => s.seasonNumber > 0)
    : Array.from({ length: show.numberOfSeasons || 1 }, (_, i) => ({
        id: i + 1,
        seasonNumber: i + 1,
        name: `Season ${i + 1}`,
        episodeCount: 10,
        overview: "",
        posterPath: null,
      }));

  const currentSeasonData = seasons.find((s) => s.seasonNumber === selectedSeason) || seasons[0];
  const totalEpisodesInSeason = currentSeasonData?.episodeCount || 10;

  const handleNext = () => {
    if (episodeNumber < totalEpisodesInSeason) {
      router.push(`/watch-tv/${show.id}/${selectedSeason}/${episodeNumber + 1}`);
    }
  };

  const handlePrev = () => {
    if (episodeNumber > 1) {
      router.push(`/watch-tv/${show.id}/${selectedSeason}/${episodeNumber - 1}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-yugito-muted">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/tv" className="hover:text-white transition-colors">
          TV Shows
        </Link>
        <span>/</span>
        <span className="text-white font-semibold truncate">{show.title}</span>
        <span>/</span>
        <span className="text-sky-300">
          S{selectedSeason} E{episodeNumber}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 3 Cols: Video Player */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-sky-500/25">
            <iframe
              key={`${show.id}-${selectedSeason}-${episodeNumber}-${selectedProvider}`}
              src={streamUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="origin"
              title={`${show.title} S${selectedSeason}E${episodeNumber}`}
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

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Season {selectedSeason} • Episode {episodeNumber}
                </span>
                <span className="text-xs text-yugito-muted">{show.title}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white">
                {show.title} — Episode {episodeNumber}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDownloadOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 transition-all font-semibold text-xs"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Download</span>
              </button>

              <button
                type="button"
                disabled={episodeNumber <= 1}
                onClick={handlePrev}
                className="p-2 rounded-xl bg-[#101d36] hover:bg-[#152545] border border-sky-500/20 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={episodeNumber >= totalEpisodesInSeason}
                onClick={handleNext}
                className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white border border-sky-400/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Server Selector */}
          <div className="p-4 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-sky-500/15">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Server className="w-4 h-4 text-sky-400" />
                <span>Streaming Server</span>
              </div>
              <span className="text-[11px] text-sky-300 font-semibold">Active: {activeProvider.name}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {TV_PROVIDERS.map((p) => {
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
        </div>

        {/* Right 1 Col: Seasons & Episode Selector */}
        <div className="lg:col-span-1 rounded-3xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-sky-500/15">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Episodes</h3>
            </div>
            {/* Season dropdown */}
            <select
              value={selectedSeason}
              onChange={(e) => {
                const newSeason = parseInt(e.target.value, 10);
                setSelectedSeason(newSeason);
                router.push(`/watch-tv/${show.id}/${newSeason}/1`);
              }}
              className="bg-[#101d36] text-white text-xs font-semibold px-2 py-1 rounded-lg border border-sky-500/30 focus:outline-none"
            >
              {seasons.map((s) => (
                <option key={s.seasonNumber} value={s.seasonNumber}>
                  Season {s.seasonNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Episode List Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-2 max-h-[460px] overflow-y-auto pr-1">
            {Array.from({ length: totalEpisodesInSeason }, (_, i) => {
              const epNum = i + 1;
              const isCurrent = epNum === episodeNumber;
              return (
                <Link
                  key={epNum}
                  href={`/watch-tv/${show.id}/${selectedSeason}/${epNum}`}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white font-black border-sky-300 shadow-md shadow-sky-500/30 scale-105"
                      : "bg-[#101d36]/70 hover:bg-[#152545] text-yugito-muted hover:text-white border-sky-500/15"
                  }`}
                >
                  <div className="text-[10px] text-yugito-subtle">EP</div>
                  <div className="text-xs font-bold">{epNum}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <DownloadModal
        isOpen={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        title={`${show.title} S${selectedSeason}E${episodeNumber}`}
        streamUrl={streamUrl}
        quality="1080p FHD"
        type="episode"
      />
    </div>
  );
}
