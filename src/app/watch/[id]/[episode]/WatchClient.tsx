"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Server,
  Layers,
  Search,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  SkipForward,
  Bookmark,
  Share2,
  Headphones,
  Subtitles,
  Sparkles,
  Download,
} from "lucide-react";
import { Anime, EpisodeInfo, StreamSource } from "@/types/anime";
import VideoPlayer from "@/components/player/VideoPlayer";
import DownloadModal from "@/components/player/DownloadModal";
import { PROVIDERS } from "@/lib/streaming";
import { getWatchHistoryItem, getPlayerSettings, savePlayerSettings } from "@/lib/storage";

interface WatchClientProps {
  anime: Anime;
  episodeNumber: number;
  episodes: EpisodeInfo[];
  initialStreams: StreamSource[];
  initialError?: string;
}

export default function WatchClient({
  anime,
  episodeNumber,
  episodes,
  initialStreams,
  initialError,
}: WatchClientProps) {
  const router = useRouter();

  // State: audio ('sub' = Japanese original, 'dub' = English dub)
  const [audio, setAudio] = useState<"sub" | "dub">("sub");
  const initialProvider = initialStreams[0]?.server?.toLowerCase() || "anizone";
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [streams, setStreams] = useState<StreamSource[]>(initialStreams);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [isLoadingStream, setIsLoadingStream] = useState(initialStreams.length === 0 && !initialError);
  const [streamError, setStreamError] = useState<string | null>(initialError || null);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    const prefs = getPlayerSettings();
    if (prefs.preferredAudio && prefs.preferredAudio !== audio) {
      setAudio(prefs.preferredAudio);
      if (prefs.preferredAudio === "dub") {
        setSelectedProvider("aniwaves");
        fetchStream("aniwaves", "dub");
      }
    }
    setAutoPlayNext(prefs.autoPlayNext);
  }, []);

  // Current episode info
  const currentEp =
    episodes.find((e) => e.number === episodeNumber) || {
      id: `${episodeNumber}`,
      number: episodeNumber,
      title: `Episode ${episodeNumber}`,
    };

  const hasNext = episodeNumber < (anime.episodes || episodes.length);
  const hasPrev = episodeNumber > 1;

  // Active stream source
  const activeStream = streams[currentStreamIndex] || null;

  // Fetch stream for selected episode, provider, and audio
  const fetchStream = useCallback(
    async (prov: string, aud: "sub" | "dub") => {
      setIsLoadingStream(true);
      setStreamError(null);

      try {
        const titleParam = encodeURIComponent(
          anime.title.english || anime.title.romaji || anime.title.userPreferred || "Anime"
        );
        const malParam = anime.idMal ? `&malId=${anime.idMal}` : "";
        const res = await fetch(
          `/api/stream?id=${anime.id}&episode=${episodeNumber}&audio=${aud}&provider=${prov}&title=${titleParam}${malParam}`
        );
        const data = await res.json();

        if (data.streams && data.streams.length > 0) {
          setStreams(data.streams);
          setCurrentStreamIndex(0);
        } else {
          // Automatic guaranteed failover to Vidnest HD
          const fallbackStream: StreamSource = {
            url: `https://vidnest.fun/anime/${anime.id}/${episodeNumber}/${aud}`,
            rawUrl: `https://vidnest.fun/anime/${anime.id}/${episodeNumber}/${aud}`,
            type: "embed",
            server: "Vidnest (Streambert HD)",
            quality: "1080p FHD",
            subtitles: [],
            priority: 1,
            isActive: true,
            audio: aud,
          };
          setStreams([fallbackStream]);
          setCurrentStreamIndex(0);
        }
      } catch (err) {
        // Guaranteed fallback on network error
        const fallbackStream: StreamSource = {
          url: `https://vidnest.fun/anime/${anime.id}/${episodeNumber}/${aud}`,
          rawUrl: `https://vidnest.fun/anime/${anime.id}/${episodeNumber}/${aud}`,
          type: "embed",
          server: "Vidnest (Streambert HD)",
          quality: "1080p FHD",
          subtitles: [],
          priority: 1,
          isActive: true,
          audio: aud,
        };
        setStreams([fallbackStream]);
        setCurrentStreamIndex(0);
      } finally {
        setIsLoadingStream(false);
      }
    },
    [anime.id, anime.idMal, anime.title, episodeNumber]
  );

  // If initialStreams is empty or needs refresh on audio switch
  useEffect(() => {
    if (initialStreams.length === 0 && !initialError) {
      fetchStream(selectedProvider, audio);
    }
  }, []);

  const handleProviderChange = (newProvider: string) => {
    setSelectedProvider(newProvider);
    fetchStream(newProvider, audio);
  };

  const handleAudioChange = (newAudio: "sub" | "dub") => {
    setAudio(newAudio);
    savePlayerSettings({ preferredAudio: newAudio });
    let targetProvider = selectedProvider;
    // Auto-select optimal provider when switching audio language
    if (newAudio === "dub" && (selectedProvider === "anizone" || selectedProvider === "animedunya")) {
      targetProvider = "aniwaves";
      setSelectedProvider("aniwaves");
    } else if (newAudio === "sub" && selectedProvider === "aniwaves") {
      targetProvider = "anizone";
      setSelectedProvider("anizone");
    }
    fetchStream(targetProvider, newAudio);
  };

  const handleNextEpisode = () => {
    if (hasNext) {
      router.push(`/watch/${anime.id}/${episodeNumber + 1}`);
    }
  };

  const handlePrevEpisode = () => {
    if (hasPrev) {
      router.push(`/watch/${anime.id}/${episodeNumber - 1}`);
    }
  };

  // Filter episodes for sidebar
  const filteredEpisodes = episodes.filter((ep) => {
    if (!episodeSearch.trim()) return true;
    const q = episodeSearch.toLowerCase().trim();
    return (
      ep.number.toString() === q ||
      (ep.title && ep.title.toLowerCase().includes(q)) ||
      `episode ${ep.number}`.includes(q)
    );
  });

  const animeTitle =
    anime.title.english || anime.title.romaji || anime.title.userPreferred || "Anime";
  const poster = anime.coverImage?.large || anime.coverImage?.medium || "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-yugito-muted mb-4 overflow-hidden">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href={`/anime/${anime.id}`} className="hover:text-white transition-colors truncate">
          {animeTitle}
        </Link>
        <span>/</span>
        <span className="text-yugito-text font-semibold whitespace-nowrap">
          {anime.format === "MOVIE" ? "Full Feature Film" : `Episode ${episodeNumber}`}
        </span>
      </div>

      {/* Main Player & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 3 Columns: Player & Controls */}
        <div className="lg:col-span-3 space-y-4">
          {/* Video Player */}
          <VideoPlayer
            animeId={anime.id}
            animeTitle={animeTitle}
            animeCover={poster}
            episodeNumber={episodeNumber}
            episodeTitle={currentEp.title}
            streamSource={activeStream}
            onNextEpisode={handleNextEpisode}
            onPrevEpisode={handlePrevEpisode}
            hasNextEpisode={hasNext}
            hasPrevEpisode={hasPrev}
            onRetry={() => fetchStream(selectedProvider, audio)}
            errorMessage={streamError || undefined}
            currentAudio={audio}
            onAudioChange={handleAudioChange}
          />

          {/* Audio Selection & Subtitle Controls Strip */}
          <div className="p-3.5 rounded-2xl bg-yugito-card border border-yugito-border flex flex-wrap items-center justify-between gap-3">
            {/* Audio Language Choice: Japanese vs English Dub */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-yugito-muted flex items-center gap-1.5 uppercase tracking-wider">
                <Headphones className="w-3.5 h-3.5 text-yugito-accent" />
                <span>Audio:</span>
              </span>
              <div className="inline-flex rounded-xl bg-yugito-surface p-1 border border-yugito-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleAudioChange("sub")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    audio === "sub"
                      ? "bg-yugito-accent text-white shadow-sm font-bold"
                      : "text-yugito-muted hover:text-white"
                  }`}
                >
                  <span>🇯🇵 Japanese (Sub)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAudioChange("dub")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    audio === "dub"
                      ? "bg-yugito-accent text-white shadow-sm font-bold"
                      : "text-yugito-muted hover:text-white"
                  }`}
                >
                  <span>🇺🇸 English Dub</span>
                </button>
              </div>
            </div>

            {/* Quick Subtitle Tip & Shortcut Hint */}
            <div className="flex items-center gap-2 text-xs text-yugito-muted">
              <span className="flex items-center gap-1 text-[11px] bg-yugito-surface px-2.5 py-1 rounded-lg border border-yugito-border">
                <Subtitles className="w-3.5 h-3.5 text-yugito-accent" />
                <span>Toggle Subtitles: Click</span>
                <kbd className="px-1 py-0.2 bg-black/40 rounded border border-white/10 text-white font-mono font-bold text-[10px]">CC</kbd>
                <span>or press</span>
                <kbd className="px-1 py-0.2 bg-black/40 rounded border border-white/10 text-white font-mono font-bold text-[10px]">C</kbd>
              </span>
            </div>
          </div>

          {/* Episode Title & Navigation Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-yugito-card border border-yugito-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-yugito-accent text-white">
                  {anime.format === "MOVIE" ? "Feature Film" : `Episode ${episodeNumber}`}
                </span>
                <span className="text-xs text-yugito-muted uppercase">
                  {audio === "dub" ? "English Dub" : "Japanese with English Subs"}
                </span>
              </div>
              <h1 className="text-lg font-bold text-white mt-1">
                {currentEp.title || (anime.format === "MOVIE" ? "Full Feature Film" : `Episode ${episodeNumber}`)}
              </h1>
            </div>

            {/* Action Buttons: Download & Prev / Next */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDownloadOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 transition-all shadow-sm"
                title="Download this video"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download</span>
              </button>

              <button
                type="button"
                disabled={!hasPrev}
                onClick={handlePrevEpisode}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  hasPrev
                    ? "bg-yugito-surface hover:bg-sky-600 text-white border-sky-500/20"
                    : "opacity-40 cursor-not-allowed bg-yugito-surface/50 text-yugito-subtle border-transparent"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                type="button"
                disabled={!hasNext}
                onClick={handleNextEpisode}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  hasNext
                    ? "bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white border-sky-400/40 shadow-md shadow-sky-500/20"
                    : "opacity-40 cursor-not-allowed bg-yugito-surface/50 text-yugito-subtle border-transparent"
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Download Manager Modal */}
          <DownloadModal
            isOpen={downloadOpen}
            onClose={() => setDownloadOpen(false)}
            title={`${animeTitle} - ${currentEp.title || "Full Movie"}`}
            streamUrl={activeStream?.url || activeStream?.rawUrl}
            subtitlesUrl={activeStream?.subtitles?.[0]?.url}
            quality={activeStream?.quality || "1080p FHD"}
          />

          {/* Source & Server Selector Box */}
          <div className="p-4 rounded-2xl bg-yugito-card border border-yugito-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-yugito-border/60">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Server className="w-4 h-4 text-yugito-accent" />
                <span>Streaming Server</span>
              </div>
              <span className="text-[11px] text-yugito-muted">
                Active: <span className="text-yugito-accentLight font-semibold capitalize">{selectedProvider}</span>
              </span>
            </div>

            {/* Provider Buttons */}
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => {
                const isSelected = selectedProvider === p.id;
                const isStreambert = p.id.startsWith("streambert-");
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-yugito-accent/20 border-yugito-accent text-yugito-accentLight shadow-sm"
                        : "bg-yugito-surface border-yugito-border text-yugito-text hover:border-yugito-accent/50 hover:text-white"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-yugito-accent" : "bg-white/20"}`} />
                    <span>{p.name}</span>
                    {isStreambert && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                        Streambert
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anime Synopsis & Link to Details */}
          <div className="p-5 rounded-2xl bg-yugito-card border border-yugito-border space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">{animeTitle}</h3>
                <div className="flex items-center gap-2 text-xs text-yugito-muted mt-1">
                  <span>{anime.format}</span>
                  <span>•</span>
                  <span>{anime.episodes ? `${anime.episodes} Episodes` : "Ongoing"}</span>
                  <span>•</span>
                  <span className="text-yugito-accentLight">{anime.status}</span>
                </div>
              </div>

              <Link
                href={`/anime/${anime.id}`}
                className="px-4 py-2 rounded-xl bg-yugito-surface hover:bg-yugito-border text-xs font-semibold text-white border border-yugito-border transition-colors whitespace-nowrap"
              >
                Anime Details
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Episode Sidebar */}
        <div className="lg:col-span-1 rounded-2xl bg-yugito-card border border-yugito-border p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-yugito-border">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-yugito-accent" />
              <h3 className="text-sm font-bold text-white">Episodes</h3>
            </div>
            <span className="text-xs text-yugito-muted font-semibold">{episodes.length} Total</span>
          </div>

          {/* Episode Search */}
          <div className="relative">
            <input
              type="text"
              value={episodeSearch}
              onChange={(e) => setEpisodeSearch(e.target.value)}
              placeholder="Search episode #..."
              className="w-full bg-yugito-surface text-yugito-text placeholder-yugito-muted/60 text-xs px-3 py-2 pl-8 rounded-xl border border-yugito-border focus:border-yugito-accent focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-yugito-muted absolute left-2.5 top-2.5" />
          </div>

          {/* Episode List Scroll Container */}
          <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
            {filteredEpisodes.map((ep) => {
              const isCurrent = ep.number === episodeNumber;
              return (
                <Link
                  key={ep.id}
                  href={`/watch/${anime.id}/${ep.number}`}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? "bg-yugito-accent text-white border-yugito-accent shadow-md shadow-yugito-accent/20"
                      : "bg-yugito-surface/70 hover:bg-yugito-surface text-yugito-text hover:text-white border-yugito-border/60 hover:border-yugito-accent/40"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isCurrent ? "bg-white/20 text-white" : "bg-yugito-card text-yugito-accentLight"
                    }`}
                  >
                    {isCurrent ? <Play className="w-3.5 h-3.5 fill-white" /> : ep.number}
                  </div>

                  <div className="min-w-0 flex-grow">
                    <h4 className="text-xs font-semibold truncate leading-tight">
                      {ep.title || `Episode ${ep.number}`}
                    </h4>
                    {ep.duration && (
                      <span className={`text-[10px] ${isCurrent ? "text-white/80" : "text-yugito-muted"}`}>
                        {ep.duration} min
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
