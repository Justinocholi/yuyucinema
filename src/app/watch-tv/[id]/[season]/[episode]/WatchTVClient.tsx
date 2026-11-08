"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Maximize,
  Minimize,
  AlertCircle,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { TMDBMedia, getTMDBImageUrl } from "@/lib/tmdb";
import DownloadModal from "@/components/player/DownloadModal";
import MediaRecommendations from "@/components/recommendations/MediaRecommendations";
import { saveMediaProgress } from "@/lib/storage";

interface WatchTVClientProps {
  show: TMDBMedia;
  seasonNumber: number;
  episodeNumber: number;
  initialRecommendations?: TMDBMedia[];
}

const TV_PROVIDERS = [
  {
    id: "multiembed",
    name: "MultiEmbed (VIP Cinema)",
    badge: "1080p FHD",
    note: "Multi-Server Failover • Fast CDN",
    getUrl: (id: number, s: number, e: number) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc.to (Ultra Cinema)",
    badge: "1080p FHD",
    note: "High-Speed Direct Stream • Global Edge",
    getUrl: (id: number, s: number, e: number) =>
      `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "2embed",
    name: "2Embed (Fast Mirror)",
    badge: "Fast CDN",
    note: "Global Edge • Multi-Audio & Subtitles",
    getUrl: (id: number, s: number, e: number) =>
      `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: "nontongo",
    name: "NontonGo (Cinema HD)",
    badge: "Instant Play",
    note: "Fast Playback • 1080p Stream",
    getUrl: (id: number, s: number, e: number) =>
      `https://www.nontongo.win/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrcicu",
    name: "VidSrc ICU (Cinema Mirror)",
    badge: "HD Mirror",
    note: "Ultra-Resilient Mirror • Multiple Tracks",
    getUrl: (id: number, s: number, e: number) =>
      `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "smashystream",
    name: "SmashyStream (Shielded)",
    badge: "Shielded",
    note: "High Bitrate • Ad-Protected Edge",
    getUrl: (id: number, s: number, e: number) =>
      `https://player.smashystream.com/tv/${id}/${s}/${e}`,
  },
];

export default function WatchTVClient({
  show,
  seasonNumber,
  episodeNumber,
  initialRecommendations = [],
}: WatchTVClientProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [providerIndex, setProviderIndex] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(seasonNumber);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [failoverToast, setFailoverToast] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionWatchdogRef = useRef<NodeJS.Timeout | null>(null);

  const activeProvider = TV_PROVIDERS[providerIndex] || TV_PROVIDERS[0];
  const streamUrl = activeProvider.getUrl(show.id, selectedSeason, episodeNumber);

  // Available seasons
  const seasons =
    show.seasons && show.seasons.length > 0
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

  // Track watch progress
  useEffect(() => {
    saveMediaProgress("tv", show.id, show.title, { season: selectedSeason, episode: episodeNumber });
  }, [show.id, show.title, selectedSeason, episodeNumber]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      const activeFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(activeFs);
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  // Ad-Shield & Anti-Popup Interceptor
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string) {
      console.warn("[Yuyu Ad-Shield] Neutralized popup attempt:", url);
      return null;
    };
    return () => {
      window.open = originalOpen;
    };
  }, []);

  // Connection watchdog
  useEffect(() => {
    setIsConnecting(true);
    setFailoverToast(null);

    if (connectionWatchdogRef.current) clearTimeout(connectionWatchdogRef.current);

    connectionWatchdogRef.current = setTimeout(() => {
      setIsConnecting(false);
      const nextIndex = (providerIndex + 1) % TV_PROVIDERS.length;
      setFailoverToast(`Server ${providerIndex + 1} took too long. Try switching to ${TV_PROVIDERS[nextIndex].name}`);
    }, 10000);

    return () => {
      if (connectionWatchdogRef.current) clearTimeout(connectionWatchdogRef.current);
    };
  }, [providerIndex, selectedSeason, episodeNumber]);

  const handleIframeLoaded = () => {
    if (connectionWatchdogRef.current) clearTimeout(connectionWatchdogRef.current);
    setTimeout(() => {
      setIsConnecting(false);
    }, 800);
  };

  const handleSwitchToNextServer = useCallback(() => {
    const nextIdx = (providerIndex + 1) % TV_PROVIDERS.length;
    setProviderIndex(nextIdx);
    setFailoverToast(`Switching to ${TV_PROVIDERS[nextIdx].name}...`);
    setTimeout(() => setFailoverToast(null), 3000);
  }, [providerIndex]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    const isCurrentlyFs = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement
    );

    if (!isCurrentlyFs) {
      const el = containerRef.current as any;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  };

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3500);
  };

  const handleNext = useCallback(() => {
    if (episodeNumber < totalEpisodesInSeason) {
      router.push(`/watch-tv/${show.id}/${selectedSeason}/${episodeNumber + 1}`);
    }
  }, [episodeNumber, totalEpisodesInSeason, router, show.id, selectedSeason]);

  const handlePrev = useCallback(() => {
    if (episodeNumber > 1) {
      router.push(`/watch-tv/${show.id}/${selectedSeason}/${episodeNumber - 1}`);
    }
  }, [episodeNumber, router, show.id, selectedSeason]);

  // Keyboard navigation (F=Fullscreen, N=Next Episode, P=Prev Episode, S=Next Server)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === "KeyF") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === "KeyN") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "KeyP") {
        e.preventDefault();
        handlePrev();
      } else if (e.code === "KeyS") {
        e.preventDefault();
        handleSwitchToNextServer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, handleSwitchToNextServer]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-20 md:pb-16 space-y-4 sm:space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-yugito-muted overflow-x-auto scrollbar-none py-1">
        <Link href="/" className="hover:text-white transition-colors shrink-0">
          Home
        </Link>
        <span className="shrink-0">/</span>
        <Link href="/tv" className="hover:text-white transition-colors shrink-0">
          TV Shows
        </Link>
        <span className="shrink-0">/</span>
        <span className="text-white font-semibold truncate shrink-0 max-w-[140px] sm:max-w-none">{show.title}</span>
        <span className="shrink-0">/</span>
        <span className="text-sky-300 font-bold shrink-0">
          S{selectedSeason} E{episodeNumber}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 3 Cols: Video Player & TV Controls */}
        <div className="lg:col-span-3 space-y-4">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-sky-500/25 group select-none"
          >
            {/* Embed Video Surface */}
            <iframe
              key={`${show.id}-${selectedSeason}-${episodeNumber}-${activeProvider.id}`}
              src={streamUrl}
              onLoad={handleIframeLoaded}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture; cross-origin-isolated"
              allowFullScreen
              referrerPolicy="origin"
              title={`${show.title} S${selectedSeason}E${episodeNumber}`}
            />

            {/* Connecting Spinner Overlay */}
            {isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none z-20 transition-opacity p-4 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mb-3" />
                <p className="text-xs font-bold text-white tracking-wide">
                  Connecting to {activeProvider.name}...
                </p>
                <span className="text-[10px] text-sky-400 mt-1">
                  Loading Season {selectedSeason} • Episode {episodeNumber}
                </span>
              </div>
            )}

            {/* Seamless Top Floating Bar (Auto-Hides) */}
            <div
              className={`absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
                controlsVisible || isConnecting ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-lg">
                  {activeProvider.name}
                </span>
                <span className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-sky-500/80 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-black">
                  S{selectedSeason} E{episodeNumber}
                </span>
                <span className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-bold items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ad-Shield Active</span>
                </span>
              </div>

              {/* Floating Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleSwitchToNextServer}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-black/80 hover:bg-black/95 text-white/90 hover:text-white border border-white/15 backdrop-blur-md text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                  title="Switch streaming mirror (Key: S)"
                >
                  <Server className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Next Mirror</span>
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-black/80 hover:bg-black/95 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-lg active:scale-95"
                  title={isFullscreen ? "Exit Fullscreen (Key: F)" : "Enter Fullscreen (Key: F)"}
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Failover Toast Notification */}
            {failoverToast && (
              <div className="absolute bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-30 bg-black/95 border border-sky-400/40 px-3 sm:px-4 py-2 rounded-xl text-xs text-sky-200 font-semibold shadow-2xl backdrop-blur-md flex items-center justify-between sm:justify-start gap-2 animate-fadeIn pointer-events-auto">
                <div className="flex items-center gap-2 truncate">
                  <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">{failoverToast}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToNextServer}
                  className="shrink-0 ml-2 px-2.5 py-1 rounded bg-sky-500 text-white font-bold text-[10px] hover:bg-sky-400 transition-colors"
                >
                  Switch Now
                </button>
              </div>
            )}
          </div>

          {/* Action Bar with Next/Prev Episode Quick Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Season {selectedSeason} • Episode {episodeNumber}
                </span>
                <span className="text-xs text-yugito-muted">{show.title}</span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-white">
                {show.title} — Episode {episodeNumber}
              </h1>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setDownloadOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 transition-all font-semibold text-xs"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Download</span>
              </button>

              <button
                type="button"
                disabled={episodeNumber <= 1}
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#101d36] hover:bg-[#152545] border border-sky-500/20 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Previous Episode (Key: P)"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Prev</span>
              </button>

              <button
                type="button"
                disabled={episodeNumber >= totalEpisodesInSeason}
                onClick={handleNext}
                className="flex items-center gap-1 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white border border-sky-400/40 text-xs font-bold shadow-lg shadow-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                title="Next Episode (Key: N)"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Server Selector */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-sky-500/15">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Server className="w-4 h-4 text-sky-400" />
                <span>Streaming Server Gateway</span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-sky-300 font-semibold">
                Auto-Failover Active • {TV_PROVIDERS.length} Verified Mirrors
              </span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              {TV_PROVIDERS.map((p, idx) => {
                const isSelected = providerIndex === idx;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProviderIndex(idx)}
                    className={`flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-sky-500/25 border-sky-400 text-sky-200 shadow-md shadow-sky-500/20"
                        : "bg-[#101d36]/70 border-sky-500/15 text-yugito-muted hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-sky-400 animate-pulse" : "bg-white/20"}`}
                    />
                    <div className="flex flex-col items-start text-left leading-tight truncate">
                      <span className="truncate">{p.name}</span>
                      <span className="text-[9px] text-yugito-subtle hidden sm:inline">{p.note}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Seasons & Episode Selector Drawer */}
        <div className="lg:col-span-1 rounded-2xl sm:rounded-3xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 p-4 space-y-4 shadow-xl">
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
          <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-3 gap-1.5 sm:gap-2 max-h-[360px] sm:max-h-[460px] overflow-y-auto pr-1">
            {Array.from({ length: totalEpisodesInSeason }, (_, i) => {
              const epNum = i + 1;
              const isCurrent = epNum === episodeNumber;
              return (
                <Link
                  key={epNum}
                  href={`/watch-tv/${show.id}/${selectedSeason}/${epNum}`}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white font-black border-sky-300 shadow-md shadow-sky-500/30 scale-105"
                      : "bg-[#101d36]/70 hover:bg-[#152545] text-yugito-muted hover:text-white border-sky-500/15"
                  }`}
                >
                  <div className="text-[9px] text-yugito-subtle">EP</div>
                  <div className="text-xs font-bold">{epNum}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Genre-based Recommendations Section */}
      <MediaRecommendations
        type="tv"
        currentId={show.id}
        currentTitle={show.title || show.name || "TV Series"}
        currentGenres={show.genres?.map((g) => g.name) || []}
        initialItems={initialRecommendations.length > 0 ? initialRecommendations : show.recommendations || []}
        title="Recommended TV Shows For You"
        subtitle="Explore more television series matching this genre"
      />

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
