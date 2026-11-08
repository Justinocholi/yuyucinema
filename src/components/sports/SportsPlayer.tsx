"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Server,
  Radio,
  Check,
} from "lucide-react";
import { SportsStreamSource } from "@/lib/sports";

interface SportsPlayerProps {
  eventTitle: string;
  competition: string;
  status: "LIVE" | "UPCOMING" | "FINISHED";
  statusText?: string;
  scoreText?: string;
  streams: SportsStreamSource[];
  activeStreamIndex: number;
  onSelectStream: (index: number) => void;
}

export default function SportsPlayer({
  eventTitle,
  competition,
  status,
  statusText,
  scoreText,
  streams,
  activeStreamIndex,
  onSelectStream,
}: SportsPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Quality levels for native HLS streams
  const [availableQualities, setAvailableQualities] = useState<Array<{ height: number; level: number }>>([]);
  const [currentQualityLevel, setCurrentQualityLevel] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeStream = streams[activeStreamIndex] || streams[0];
  const isEmbed = activeStream?.type === "embed";

  // Anti-Popup Interceptor: neutralize rogue popup windows from embed players
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string) {
      console.warn("[Yuyu Sports Ad-Shield] Neutralized popup attempt:", url);
      return null;
    };
    return () => {
      window.open = originalOpen;
    };
  }, []);

  // Sync fullscreen state
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

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
      setShowQualityMenu(false);
    }, 3500);
  };

  // Video and HLS initialization (for direct HLS streams)
  useEffect(() => {
    setHasError(false);
    setErrorDetails(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!activeStream || !activeStream.url) {
      setIsLoading(false);
      setHasError(true);
      setErrorDetails("No active stream URL configured for this server.");
      return;
    }

    if (isEmbed) {
      setIsLoading(false);
      setIsPlaying(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    const streamUrl = activeStream.url;

    // Helper for robust playback attempt (fallback to muted autoplay if browser blocks audio)
    const attemptPlay = () => {
      if (!video) return;
      video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((playErr) => {
          console.warn("[Yuyu Sports] Unmuted play blocked by browser, falling back to muted autoplay:", playErr);
          video.muted = true;
          setIsMuted(true);
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch((mutedErr) => {
              console.warn("[Yuyu Sports] Autoplay blocked, waiting for user interaction:", mutedErr);
              setIsPlaying(false);
            });
        });
    };

    if (Hls.isSupported() && (streamUrl.includes(".m3u8") || streamUrl.includes("master") || streamUrl.includes("playlist"))) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 6,
        maxMaxBufferLength: 12,
        maxBufferSize: 25 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 1,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        manifestLoadingTimeOut: 3500,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 3500,
        fragLoadingTimeOut: 5000,
        startLevel: 0, // Instant start with the fastest initial segment, automatically upscaling to 1080p
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const qualities = data.levels
          .map((lvl, index) => ({
            height: lvl.height,
            level: index,
          }))
          .sort((a, b) => b.height - a.height);
        setAvailableQualities(qualities);
        attemptPlay();
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error("HLS Sports Fatal Error:", data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              if (activeStreamIndex + 1 < streams.length) {
                console.warn(`[Yuyu Sports] Server ${activeStreamIndex + 1} failed. Auto-switching to Server ${activeStreamIndex + 2}`);
                onSelectStream(activeStreamIndex + 1);
              } else {
                setHasError(true);
                setErrorDetails("Live stream connection interrupted. Try switching to another server below.");
                setIsLoading(false);
              }
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      const onLoaded = () => {
        setIsLoading(false);
        attemptPlay();
      };
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
    } else {
      video.src = streamUrl;
      const onLoaded = () => {
        setIsLoading(false);
        attemptPlay();
      };
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
    }

    const onNativeError = () => {
      console.warn("[Yuyu Sports] Native video error on stream:", streamUrl);
      if (activeStreamIndex + 1 < streams.length) {
        onSelectStream(activeStreamIndex + 1);
      } else {
        setIsLoading(false);
        setHasError(true);
        setErrorDetails("Could not play the live sports stream on this server. Please choose another server.");
      }
    };
    video.addEventListener("error", onNativeError);

    // Watchdog: If buffering/connecting exceeds 6 seconds, automatically attempt next fast server
    const connectWatchdog = setTimeout(() => {
      if (video && video.paused && !isPlaying && activeStreamIndex + 1 < streams.length) {
        console.warn(`[Yuyu Football] Stream connection taking longer than 6s on Server ${activeStreamIndex + 1}. Auto-switching to Server ${activeStreamIndex + 2}`);
        onSelectStream(activeStreamIndex + 1);
      }
    }, 6000);

    return () => {
      clearTimeout(connectWatchdog);
      video.removeEventListener("error", onNativeError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStream, isEmbed, activeStreamIndex, onSelectStream, streams.length]);

  const togglePlay = useCallback(() => {
    if (isEmbed) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isEmbed]);

  const toggleMute = () => {
    if (isEmbed) return;
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEmbed) return;
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    const muted = val === 0;
    video.muted = muted;
    setIsMuted(muted);
  };

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

  const handleQualitySelect = (level: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = level;
    setCurrentQualityLevel(level);
    setShowQualityMenu(false);
  };

  // Keyboard controls (F=Fullscreen, M=Mute, Space=Play)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === "KeyF") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === "KeyM" && !isEmbed) {
        e.preventDefault();
        toggleMute();
      } else if ((e.code === "Space" || e.code === "KeyK") && !isEmbed) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, isEmbed]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-sky-500/25 group select-none"
    >
      {/* Video Surface: Embed vs Native HLS */}
      {isEmbed ? (
        <div className="relative w-full h-full bg-black">
          <iframe
            key={activeStream.url}
            src={activeStream.url}
            className="w-full h-full border-0 rounded-3xl"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; cross-origin-isolated"
            allowFullScreen
            referrerPolicy="origin"
            title={eventTitle}
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          onClick={togglePlay}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
          }}
          preload="auto"
          autoPlay
          playsInline
          className="w-full h-full object-contain cursor-pointer"
        />
      )}

      {/* Buffering Spinner */}
      {isLoading && !hasError && !isEmbed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none z-20">
          <div className="w-12 h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-bold text-white tracking-wide">Connecting to Live Sports Feed...</p>
          <span className="text-[10px] text-sky-400 mt-1">{activeStream.name}</span>
        </div>
      )}

      {/* Center Play Button Overlay when Paused */}
      {!isPlaying && !isLoading && !hasError && !isEmbed && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer z-10 transition-all hover:bg-black/30 group/playbtn"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 p-0.5 shadow-2xl shadow-sky-500/40 group-hover/playbtn:scale-110 active:scale-95 transition-transform flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#0a1224]/85 backdrop-blur-md flex items-center justify-center pl-1">
              <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-white" />
            </div>
          </div>
          <span className="mt-3 px-3.5 py-1.5 rounded-full bg-black/75 border border-white/10 text-xs font-bold text-white drop-shadow shadow-lg">
            Click to Watch Live Stream
          </span>
        </div>
      )}

      {/* Tap to Unmute Overlay Button */}
      {isMuted && isPlaying && !isEmbed && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (videoRef.current) {
              videoRef.current.muted = false;
              setIsMuted(false);
              videoRef.current.volume = volume > 0 ? volume : 1;
            }
          }}
          className="absolute bottom-16 left-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-sky-500/90 hover:bg-sky-400 text-white text-xs font-bold shadow-xl backdrop-blur-md transition-all active:scale-95 animate-pulse"
        >
          <VolumeX className="w-4 h-4 text-white" />
          <span>Tap to Unmute 🔊</span>
        </button>
      )}

      {/* Playback Error Overlay with Quick Server Retry */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070b16]/95 p-6 text-center z-30">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Live Feed Unavailable</h3>
          <p className="text-xs text-yugito-muted max-w-md mb-4 leading-relaxed">
            {errorDetails || "Unable to connect to the current streaming source."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {streams.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectStream(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeStreamIndex === idx
                    ? "bg-sky-500 text-white border-sky-400"
                    : "bg-[#101d36] text-yugito-text hover:text-white border-sky-500/20"
                }`}
              >
                Switch to {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Top Header Bar (Auto-Hides) */}
      <div
        className={`absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Indicator */}
          {status === "LIVE" ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/90 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg shadow-red-600/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>LIVE • {statusText || "ON AIR"}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1.5 rounded-xl bg-black/80 text-sky-300 border border-white/10 text-xs font-bold backdrop-blur-md">
              {statusText || status}
            </span>
          )}

          {/* Active Server Badge */}
          <span className="px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
            {activeStream.name}
          </span>

          {/* Ad-Shield Badge */}
          <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ad-Shield Active</span>
          </span>
        </div>

        {/* Clean Container Fullscreen Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
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

      {/* Native Bottom Controls Overlay (Exclusively for Direct HLS Streams) */}
      {!isEmbed && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-white">
            {/* Left Controls: Play, Volume */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1 hover:text-sky-300 transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1 hover:text-sky-300 transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute (M)"}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sky-400 opacity-70 group-hover/vol:opacity-100 transition-opacity"
                />
              </div>

              {/* Live Status indicator */}
              <div className="flex items-center gap-1.5 ml-2 text-[11px] font-bold text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>LIVE BROADCAST</span>
              </div>
            </div>

            {/* Right Controls: Quality, Fullscreen */}
            <div className="flex items-center gap-2.5">
              {/* Quality Menu */}
              {availableQualities.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 hover:border-sky-400 text-[11px] font-bold text-white transition-all"
                  >
                    <Settings className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      {currentQualityLevel === -1
                        ? "Auto"
                        : `${availableQualities.find((q) => q.level === currentQualityLevel)?.height || "HD"}p`}
                    </span>
                  </button>

                  {showQualityMenu && (
                    <div className="absolute bottom-9 right-0 bg-[#0c1527] border border-sky-500/20 rounded-xl shadow-2xl py-1.5 w-36 z-40 text-xs">
                      <div className="px-3 py-1 text-[10px] uppercase font-bold text-yugito-subtle tracking-wider">
                        Resolution
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQualitySelect(-1)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-sky-500/10 flex items-center justify-between ${
                          currentQualityLevel === -1 ? "text-sky-300 font-bold" : "text-white"
                        }`}
                      >
                        <span>Auto (Adaptive)</span>
                        {currentQualityLevel === -1 && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      {availableQualities.map((q) => (
                        <button
                          key={q.level}
                          type="button"
                          onClick={() => handleQualitySelect(q.level)}
                          className={`w-full text-left px-3 py-1.5 hover:bg-sky-500/10 flex items-center justify-between ${
                            currentQualityLevel === q.level ? "text-sky-300 font-bold" : "text-white"
                          }`}
                        >
                          <span>{q.height}p FHD</span>
                          {currentQualityLevel === q.level && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1 hover:text-sky-300 transition-colors"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen (F)"}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
