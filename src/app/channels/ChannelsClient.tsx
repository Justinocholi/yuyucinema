"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Tv,
  Radio,
  Users,
  Play,
  Volume2,
  Maximize,
  Minimize,
  Sparkles,
  Flame,
  Clock,
  Compass,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Filter,
  CheckCircle,
  ShieldCheck,
  Server,
  SkipForward,
  RotateCcw,
  RefreshCw,
  ListVideo,
  Layers,
  AlertCircle,
} from "lucide-react";
import {
  ANIME_CHANNELS,
  CHANNEL_MIRRORS,
  CINEMA_PLAYLIST,
  AnimeLiveChannel,
  getChannelLiveState,
  ChannelScheduleItem,
} from "@/lib/channels";

export default function ChannelsClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeChannelId, setActiveChannelId] = useState<string>("toonami-aftermath");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mirrorIndex, setMirrorIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScheduleDrawer, setShowScheduleDrawer] = useState(false);

  // Dynamic episode override state (allows manual next/prev, or default to time-based slot)
  const [customEpisodeOffset, setCustomEpisodeOffset] = useState<number | null>(null);

  // Time ticker to update on-air progress every 15 seconds
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ticker for live broadcast clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
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

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      const activeFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
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

  const currentChannel =
    ANIME_CHANNELS.find((c) => c.id === activeChannelId) || ANIME_CHANNELS[0];

  // Calculate live state based on clock & schedule
  const liveState = getChannelLiveState(currentChannel, currentTime);

  // Active episode: custom offset if user stepped forward/back, otherwise on-air calculated
  const activeEpisodeNumber =
    customEpisodeOffset !== null ? customEpisodeOffset : liveState.currentEpisodeNumber;

  // Reset custom episode override and mirror when changing channel
  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    setCustomEpisodeOffset(null);
    setMirrorIndex(0);
    setIsConnecting(true);
  };

  // Determine stream URL for the current active episode and mirror
  const activeMirror = CHANNEL_MIRRORS[mirrorIndex] || CHANNEL_MIRRORS[0];

  let currentStreamUrl = currentChannel.streamUrl;
  if (currentChannel.category !== "music") {
    if (currentChannel.id === "anime-cinema-247") {
      const movieIdx = (activeEpisodeNumber - 1) % CINEMA_PLAYLIST.length;
      const movie = CINEMA_PLAYLIST[movieIdx] || CINEMA_PLAYLIST[0];
      currentStreamUrl = activeMirror.getUrl(movie.anilistId, 1, "sub");
    } else if (currentChannel.anilistId) {
      currentStreamUrl = activeMirror.getUrl(
        currentChannel.anilistId,
        activeEpisodeNumber,
        currentChannel.audio || "sub"
      );
    }
  }

  // Handle switching to Next Episode in the live broadcast marathon
  const handleNextEpisode = useCallback(() => {
    const total = currentChannel.totalEpisodes || 100;
    const nextEp = (activeEpisodeNumber % total) + 1;
    setCustomEpisodeOffset(nextEp);
    setIsConnecting(true);
    setToastMessage(`Tuned to Episode ${nextEp}`);
    setTimeout(() => setToastMessage(null), 3000);
  }, [activeEpisodeNumber, currentChannel.totalEpisodes]);

  // Handle switching to Previous Episode
  const handlePrevEpisode = useCallback(() => {
    const total = currentChannel.totalEpisodes || 100;
    const prevEp = activeEpisodeNumber > 1 ? activeEpisodeNumber - 1 : total;
    setCustomEpisodeOffset(prevEp);
    setIsConnecting(true);
    setToastMessage(`Tuned to Episode ${prevEp}`);
    setTimeout(() => setToastMessage(null), 3000);
  }, [activeEpisodeNumber, currentChannel.totalEpisodes]);

  // Continuous Auto-Advance:
  // When an episode slot expires (or if the user keeps auto-advance on),
  // automatically advance to the next episode so the broadcast NEVER stops!
  const prevSlotRef = useRef(liveState.currentEpisodeNumber);
  useEffect(() => {
    if (!autoAdvance) return;
    if (customEpisodeOffset === null) {
      if (prevSlotRef.current !== liveState.currentEpisodeNumber) {
        prevSlotRef.current = liveState.currentEpisodeNumber;
        setIsConnecting(true);
        setToastMessage(`Broadcasting Next Episode on Air: Episode ${liveState.currentEpisodeNumber}`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    }
  }, [liveState.currentEpisodeNumber, autoAdvance, customEpisodeOffset]);

  // Next / Previous Channel (Channel Surfing)
  const filteredChannels = ANIME_CHANNELS.filter((ch) => {
    if (selectedCategory === "all") return true;
    return ch.category === selectedCategory;
  });

  const handleNextChannel = useCallback(() => {
    const curIdx = filteredChannels.findIndex((c) => c.id === activeChannelId);
    const nextIdx = (curIdx + 1) % filteredChannels.length;
    handleSelectChannel(filteredChannels[nextIdx].id);
  }, [filteredChannels, activeChannelId]);

  const handlePrevChannel = useCallback(() => {
    const curIdx = filteredChannels.findIndex((c) => c.id === activeChannelId);
    const prevIdx = (curIdx - 1 + filteredChannels.length) % filteredChannels.length;
    handleSelectChannel(filteredChannels[prevIdx].id);
  }, [filteredChannels, activeChannelId]);

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

  // Keyboard navigation:
  // ArrowUp / ArrowDown: Channel Surf
  // N: Next Episode on this channel
  // P: Prev Episode on this channel
  // F: Fullscreen
  // S: Switch mirror
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === "ArrowUp") {
        e.preventDefault();
        handlePrevChannel();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        handleNextChannel();
      } else if (e.code === "KeyN") {
        e.preventDefault();
        handleNextEpisode();
      } else if (e.code === "KeyP") {
        e.preventDefault();
        handlePrevEpisode();
      } else if (e.code === "KeyF") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === "KeyS") {
        e.preventDefault();
        setMirrorIndex((prev) => (prev + 1) % CHANNEL_MIRRORS.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextChannel, handlePrevChannel, handleNextEpisode, handlePrevEpisode]);

  const categories = [
    { id: "all", label: "All Channels", count: ANIME_CHANNELS.length },
    { id: "movies", label: "Anime Movies & Cinema", count: ANIME_CHANNELS.filter((c) => c.category === "movies").length },
    { id: "shonen", label: "Shonen & Action", count: ANIME_CHANNELS.filter((c) => c.category === "shonen").length },
    { id: "marathon", label: "24/7 Marathons", count: ANIME_CHANNELS.filter((c) => c.category === "marathon").length },
    { id: "retro", label: "Classic & Retro", count: ANIME_CHANNELS.filter((c) => c.category === "retro").length },
    { id: "music", label: "Music & Chill", count: ANIME_CHANNELS.filter((c) => c.category === "music").length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-[#0c1527]/80 backdrop-blur-xl border border-sky-500/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>24/7 Continuous Live TV</span>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Auto-Advance Enabled</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Live Anime Broadcast Channels
          </h1>
          <p className="text-xs sm:text-sm text-yugito-muted max-w-xl leading-relaxed">
            Non-stop 24/7 anime marathon blocks, movie broadcasts, and classic retro channels that continuously progress episode after episode with zero stops.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 self-start sm:self-auto">
          {/* Auto-Advance Toggle Pill */}
          <button
            type="button"
            onClick={() => setAutoAdvance(!autoAdvance)}
            className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
              autoAdvance
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 border-white/10 text-yugito-muted hover:text-white"
            }`}
            title="When active, the channel continuously advances to the next episode"
          >
            <span className={`w-2 h-2 rounded-full ${autoAdvance ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
            <span>Auto-Advance: {autoAdvance ? "ON" : "OFF"}</span>
          </button>

          <div className="text-right bg-sky-500/10 border border-sky-500/20 px-3.5 py-2 rounded-2xl backdrop-blur-md hidden sm:block">
            <div className="text-[10px] text-sky-300 font-semibold uppercase">Global Viewers</div>
            <div className="text-base font-black text-white flex items-center justify-end gap-1">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>218,590</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Live Player & Channel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Live Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-sky-500/25 group select-none"
          >
            {/* The Live Stream Frame: Key includes channel, episode, and mirror to guarantee dynamic progression */}
            <iframe
              key={`${currentChannel.id}-${activeEpisodeNumber}-${mirrorIndex}`}
              src={currentStreamUrl}
              onLoad={() => {
                setTimeout(() => setIsConnecting(false), 800);
              }}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture; cross-origin-isolated"
              allowFullScreen
              referrerPolicy="origin"
              title={`${currentChannel.name} - Episode ${activeEpisodeNumber}`}
            />

            {/* Connecting Spinner Overlay */}
            {isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none z-20 transition-opacity">
                <div className="w-12 h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mb-3" />
                <p className="text-xs font-bold text-white tracking-wide">
                  Tuning into {currentChannel.name}...
                </p>
                <span className="text-[10px] text-sky-400 mt-1">
                  Broadcasting Episode {activeEpisodeNumber} ({activeMirror.name})
                </span>
              </div>
            )}

            {/* Floating Top Header Bar (Auto-Hides) */}
            <div
              className={`absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
                controlsVisible || isConnecting ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="uppercase tracking-wider">{currentChannel.callsign}</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-sky-500/80 backdrop-blur-md text-white text-[10px] font-black">
                  {currentChannel.category === "movies"
                    ? `Film ${activeEpisodeNumber} / ${CINEMA_PLAYLIST.length}`
                    : `Ep ${activeEpisodeNumber}`}
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ad-Shield Active</span>
                </div>
              </div>

              {/* Player Top Floating Actions */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {currentChannel.category !== "music" && (
                  <button
                    type="button"
                    onClick={handleNextEpisode}
                    className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black/95 text-white/90 hover:text-white border border-white/15 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                    title="Advance to next episode on air (Key: N)"
                  >
                    <span>Next on Air</span>
                    <SkipForward className="w-3.5 h-3.5 text-sky-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl bg-black/80 hover:bg-black/95 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-lg active:scale-95"
                  title={isFullscreen ? "Exit Fullscreen (Key: F)" : "Enter Fullscreen (Key: F)"}
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {toastMessage && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-black/90 border border-sky-400/40 px-4 py-2 rounded-xl text-xs text-sky-200 font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fadeIn pointer-events-auto">
                <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>{toastMessage}</span>
              </div>
            )}
          </div>

          {/* Channel Control & Live Navigation Bar */}
          <div className="p-5 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-500/15">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-sky-500 text-white shadow-sm">
                    {currentChannel.callsign}
                  </span>
                  <span className="text-xs text-yugito-muted uppercase tracking-wider font-semibold">
                    {currentChannel.categoryLabel}
                  </span>
                  {currentChannel.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {currentChannel.badge}
                    </span>
                  )}
                  {customEpisodeOffset !== null && (
                    <button
                      type="button"
                      onClick={() => setCustomEpisodeOffset(null)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors"
                      title="Return to the live scheduled slot"
                    >
                      Return to Live
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {currentChannel.name}
                </h2>
              </div>

              {/* Navigation Controls: Channel Surfing & Episode Advance */}
              <div className="flex items-center gap-2">
                {currentChannel.category !== "music" && (
                  <>
                    <button
                      type="button"
                      disabled={activeEpisodeNumber <= 1}
                      onClick={handlePrevEpisode}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#101d36] hover:bg-[#152545] border border-sky-500/20 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Previous Episode (Key: P)"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Prev Ep</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextEpisode}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white text-xs font-bold border border-sky-400/40 shadow-md shadow-sky-500/25 transition-all active:scale-95"
                      title="Next Episode on this channel (Key: N)"
                    >
                      <span>Next Ep</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {/* Channel Surf Up/Down */}
                <div className="flex items-center rounded-xl bg-[#101d36] border border-sky-500/20 overflow-hidden">
                  <button
                    type="button"
                    onClick={handlePrevChannel}
                    className="p-1.5 hover:bg-white/10 text-yugito-muted hover:text-white transition-colors border-r border-sky-500/15"
                    title="Previous Channel (Key: ▲)"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextChannel}
                    className="p-1.5 hover:bg-white/10 text-yugito-muted hover:text-white transition-colors"
                    title="Next Channel (Key: ▼)"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Now Playing & Next Up Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Now Playing */}
              <div className="p-3.5 rounded-xl bg-[#101d36]/70 border border-sky-500/15 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-300 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Now Playing on Air
                  </span>
                  <span className="text-yugito-muted text-[11px]">
                    {liveState.startsAt} - {liveState.endsAt}
                  </span>
                </div>
                <div className="font-bold text-white text-sm truncate">
                  {liveState.currentTitle}
                </div>
                <div className="text-xs text-sky-200/80 font-medium truncate">
                  {currentChannel.category === "movies"
                    ? `Film ${activeEpisodeNumber}: ${liveState.currentTitle}`
                    : `Episode ${activeEpisodeNumber}`}
                </div>
                <div className="text-[11px] text-yugito-muted line-clamp-1">
                  {liveState.currentDesc}
                </div>
                {/* Real-time Progress Bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-1000"
                    style={{ width: `${liveState.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Up Next in Broadcast */}
              <div className="p-3.5 rounded-xl bg-[#101d36]/70 border border-sky-500/15 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-yugito-muted font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    Up Next in Schedule
                  </span>
                  <span className="text-sky-300 font-semibold text-[11px]">
                    {liveState.nextStartsAt}
                  </span>
                </div>
                <div className="font-bold text-white text-sm truncate">
                  {liveState.nextTitle}
                </div>
                <div className="text-xs text-yugito-muted truncate">
                  {liveState.nextEpisode}
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-yugito-subtle">
                    {autoAdvance ? "Will auto-transition when slot finishes" : "Manual playback mode"}
                  </span>
                  {currentChannel.category !== "music" && (
                    <button
                      type="button"
                      onClick={handleNextEpisode}
                      className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <span>Play Now</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mirror Switcher Strip */}
            {currentChannel.category !== "music" && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-sky-500/10">
                <div className="flex items-center gap-2 text-xs text-yugito-muted">
                  <Server className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-semibold text-white">Broadcast Mirror:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNEL_MIRRORS.map((m, idx) => {
                    const isSelected = mirrorIndex === idx;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMirrorIndex(idx);
                          setIsConnecting(true);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          isSelected
                            ? "bg-sky-500/25 border-sky-400 text-sky-200"
                            : "bg-[#101d36]/70 border-sky-500/15 text-yugito-muted hover:text-white"
                        }`}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Channel Guide & Schedule */}
        <div className="lg:col-span-1 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-sky-500/15">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Live Channel Guide</h3>
            </div>
            <span className="text-xs font-semibold text-sky-300">
              {filteredChannels.length} Channels
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white border-sky-400 shadow-sm"
                      : "bg-[#101d36]/70 text-yugito-muted hover:text-white border-sky-500/15"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Channels List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredChannels.map((ch) => {
              const isActive = ch.id === activeChannelId;
              const chState = getChannelLiveState(ch, currentTime);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectChannel(ch.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 group ${
                    isActive
                      ? "bg-[#101d36] border-sky-400 shadow-md shadow-sky-500/20 ring-1 ring-sky-400/30"
                      : "bg-[#101d36]/50 border-sky-500/15 hover:border-sky-400/40 hover:bg-[#101d36]/80"
                  }`}
                >
                  {/* Thumbnail / Callsign */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black/60 border border-white/10 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white/90 uppercase tracking-tighter">
                      {ch.callsign}
                    </span>
                    {isActive && (
                      <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      </div>
                    )}
                  </div>

                  {/* Channel Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                        {ch.name}
                      </div>
                      {isActive && (
                        <span className="text-[10px] text-sky-400 font-extrabold uppercase animate-pulse">
                          ON AIR
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-sky-200/90 font-semibold truncate mt-0.5">
                      {chState.currentTitle}
                    </div>
                    <div className="text-[10px] text-yugito-muted truncate mt-0.5 flex items-center justify-between">
                      <span>{chState.currentEpisode}</span>
                      <span className="text-sky-400 font-medium">
                        {ch.viewers.toLocaleString()} watching
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
