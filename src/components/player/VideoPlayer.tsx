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
  SkipForward,
  RotateCcw,
  Settings,
  Subtitles,
  AlertCircle,
  RefreshCw,
  FastForward,
  Headphones,
  Check,
  Sparkles,
  ShieldCheck,
  Type,
} from "lucide-react";
import { StreamSource, SubtitleTrack } from "@/types/anime";
import {
  saveWatchProgress,
  getPlayerSettings,
  savePlayerSettings,
  getWatchHistoryItem,
} from "@/lib/storage";

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

function parseVttCues(vttText: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = vttText.split(/\r?\n/);
  let i = 0;

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.trim().split(":");
    if (parts.length === 3) {
      const [h, m, sWithMs] = parts;
      const [s, ms] = (sWithMs || "00.00").split(".");
      return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms || "0", 10) / 1000;
    } else if (parts.length === 2) {
      const [m, sWithMs] = parts;
      const [s, ms] = (sWithMs || "00.00").split(".");
      return parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms || "0", 10) / 1000;
    }
    return 0;
  };

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes("-->")) {
      const parts = line.split("-->").map((s) => s.trim());
      const start = parseTime(parts[0]);
      const end = parseTime(parts[1].split(" ")[0]);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i].trim());
        i++;
      }
      if (textLines.length > 0) {
        cues.push({ start, end, text: textLines.join("\n") });
      }
    } else {
      i++;
    }
  }

  return cues;
}

interface VideoPlayerProps {
  animeId: number;
  animeTitle: string;
  animeCover: string;
  episodeNumber: number;
  episodeTitle?: string;
  streamSource?: StreamSource | null;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPrevEpisode?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  currentAudio?: "sub" | "dub";
  onAudioChange?: (audio: "sub" | "dub") => void;
}

export default function VideoPlayer({
  animeId,
  animeTitle,
  animeCover,
  episodeNumber,
  episodeTitle,
  streamSource,
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode = false,
  hasPrevEpisode = false,
  onRetry,
  errorMessage,
  currentAudio = "sub",
  onAudioChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Subtitle Customization State (Phase 4)
  const [subtitleSize, setSubtitleSize] = useState<"small" | "medium" | "large">("medium");
  const [subtitleBg, setSubtitleBg] = useState<"solid" | "translucent" | "none">("solid");
  const [subtitleColor, setSubtitleColor] = useState<"white" | "yellow">("white");
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);

  // Menus
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  // Qualities & Subtitles state
  const [availableQualities, setAvailableQualities] = useState<Array<{ height: number; level: number }>>([]);
  const [currentQualityLevel, setCurrentQualityLevel] = useState<number>(-1); // -1 = Auto
  const [activeLevelHeight, setActiveLevelHeight] = useState<number | null>(null);

  // Subtitle control: Subtitles ON by default for Japanese, OFF for English Dub
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(currentAudio === "sub");
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(0);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [activeCueText, setActiveCueText] = useState<string | null>(null);

  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedResumeTime, setSavedResumeTime] = useState(0);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect whether the current stream is an embedded third-party player
  const isEmbed = streamSource?.type === "embed";

  // Initialize saved player preferences
  useEffect(() => {
    const prefs = getPlayerSettings();
    setVolume(prefs.volume);
    setIsMuted(prefs.muted);
    if (prefs.subtitleSize) setSubtitleSize(prefs.subtitleSize);
    if (prefs.subtitleBg) setSubtitleBg(prefs.subtitleBg);
    if (prefs.subtitleColor) setSubtitleColor(prefs.subtitleColor);
  }, []);

  // Sync fullscreen state with browser events (Desktop & Mobile, Esc key exits)
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
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
    };
  }, []);

  // Ad-Shield & Anti-Popup Interceptor:
  // Neutralize rogue window.open calls from third-party embed scripts
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

  // When audio switches, update default subtitle state and HLS audio track
  useEffect(() => {
    if (currentAudio === "sub") {
      setSubtitlesEnabled(true);
    } else {
      setSubtitlesEnabled(false);
    }

    if (hlsRef.current && hlsRef.current.audioTracks && hlsRef.current.audioTracks.length > 1) {
      const tracks = hlsRef.current.audioTracks;
      const targetTrack =
        currentAudio === "dub"
          ? tracks.find(
              (t) =>
                t.lang?.toLowerCase().startsWith("en") ||
                t.name.toLowerCase().includes("eng") ||
                t.name.toLowerCase().includes("dub")
            )
          : tracks.find(
              (t) =>
                t.lang?.toLowerCase().startsWith("ja") ||
                t.name.toLowerCase().includes("jap") ||
                t.name.toLowerCase().includes("sub")
            );
      if (targetTrack && hlsRef.current.audioTrack !== targetTrack.id) {
        hlsRef.current.audioTrack = targetTrack.id;
      }
    }
  }, [currentAudio]);

  // Load and parse active subtitle track (Custom Subtitle Engine - No native track duplicates)
  useEffect(() => {
    if (isEmbed) {
      setSubtitleCues([]);
      setActiveCueText(null);
      return;
    }

    const subs = streamSource?.subtitles;
    if (!subs || subs.length === 0 || !subtitlesEnabled) {
      setSubtitleCues([]);
      setActiveCueText(null);
      return;
    }

    const activeTrack = subs[activeSubtitleIndex] || subs[0];
    if (!activeTrack || !activeTrack.url) return;

    let isCancelled = false;
    const fetchSubtitles = async () => {
      try {
        const res = await fetch(activeTrack.url);
        if (!res.ok) return;
        const text = await res.text();
        if (!isCancelled) {
          const parsed = parseVttCues(text);
          setSubtitleCues(parsed);
        }
      } catch (err) {
        console.error("Failed to load subtitle track:", err);
      }
    };

    fetchSubtitles();

    return () => {
      isCancelled = true;
    };
  }, [streamSource?.subtitles, activeSubtitleIndex, subtitlesEnabled, isEmbed]);

  // Sync active on-screen cue text with currentTime
  useEffect(() => {
    if (isEmbed || !subtitlesEnabled || subtitleCues.length === 0) {
      setActiveCueText(null);
      return;
    }

    const match = subtitleCues.find((c) => currentTime >= c.start && currentTime <= c.end);
    setActiveCueText(match ? match.text : null);
  }, [currentTime, subtitlesEnabled, subtitleCues, isEmbed]);

  // Check saved progress for resume prompt
  useEffect(() => {
    if (isEmbed) return;
    const historyItem = getWatchHistoryItem(animeId);
    if (historyItem && historyItem.episodeNumber === episodeNumber && historyItem.currentTime > 15) {
      if (historyItem.currentTime < (historyItem.duration || 1200) - 60) {
        setSavedResumeTime(historyItem.currentTime);
        setShowResumePrompt(true);
      }
    }
  }, [animeId, episodeNumber, isEmbed]);

  // Hide controls after inactivity
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying || isEmbed) {
        setControlsVisible(false);
        setShowSpeedMenu(false);
        setShowSubtitleMenu(false);
        setShowQualityMenu(false);
        setShowAudioMenu(false);
        setShowSubtitleSettings(false);
      }
    }, 3500);
  };

  // Video and HLS initialization for Native HLS streams
  useEffect(() => {
    const video = videoRef.current;

    setHasError(false);
    setErrorDetails(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!streamSource || !streamSource.url) {
      setIsLoading(false);
      setHasError(true);
      setErrorDetails(errorMessage || "No active stream source found for this episode.");
      return;
    }

    if (isEmbed) {
      setIsLoading(false);
      setIsPlaying(true);
      return;
    }

    if (!video) return;
    setIsLoading(true);

    const rawStreamUrl = streamSource.url;
    const streamUrl =
      rawStreamUrl.startsWith("http://") || rawStreamUrl.startsWith("https://")
        ? `/api/stream/proxy?url=${encodeURIComponent(rawStreamUrl)}`
        : rawStreamUrl;

    if (streamSource.type === "hls" || rawStreamUrl.includes(".m3u8") || streamUrl.includes("proxy")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 60,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          startLevel: -1,
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

          // Multi-audio track matching
          if (hls.audioTracks && hls.audioTracks.length > 1) {
            const tracks = hls.audioTracks;
            const targetTrack =
              currentAudio === "dub"
                ? tracks.find(
                    (t) =>
                      t.lang?.toLowerCase().startsWith("en") ||
                      t.name.toLowerCase().includes("eng") ||
                      t.name.toLowerCase().includes("dub")
                  )
                : tracks.find(
                    (t) =>
                      t.lang?.toLowerCase().startsWith("ja") ||
                      t.name.toLowerCase().includes("jap") ||
                      t.name.toLowerCase().includes("sub")
                  );
            if (targetTrack) {
              hls.audioTrack = targetTrack.id;
            }
          }

          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              setIsPlaying(false);
            });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const lvl = hls.levels[data.level];
          if (lvl && lvl.height) {
            setActiveLevelHeight(lvl.height);
          }
        });

        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
          if (data.audioTracks && data.audioTracks.length > 1) {
            const tracks = data.audioTracks;
            const targetTrack =
              currentAudio === "dub"
                ? tracks.find(
                    (t) =>
                      t.lang?.toLowerCase().startsWith("en") ||
                      t.name.toLowerCase().includes("eng") ||
                      t.name.toLowerCase().includes("dub")
                  )
                : tracks.find(
                    (t) =>
                      t.lang?.toLowerCase().startsWith("ja") ||
                      t.name.toLowerCase().includes("jap") ||
                      t.name.toLowerCase().includes("sub")
                  );
            if (targetTrack) {
              hls.audioTrack = targetTrack.id;
            }
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error("HLS Fatal Error:", data);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setHasError(true);
                setErrorDetails("Stream link expired or unreachable. Please try another server.");
                setIsLoading(false);
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      } else {
        setHasError(true);
        setErrorDetails("HLS streaming is not supported by your browser.");
        setIsLoading(false);
      }
    } else {
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamSource, errorMessage, isEmbed, currentAudio]);

  // Periodic watch progress saver for native player
  useEffect(() => {
    if (isEmbed || !isPlaying || currentTime <= 0) return;
    const interval = setInterval(() => {
      saveWatchProgress({
        animeId,
        animeTitle,
        animeCover,
        episodeNumber,
        episodeTitle,
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, animeId, animeTitle, animeCover, episodeNumber, episodeTitle, isEmbed]);

  const togglePlay = useCallback(() => {
    if (isEmbed) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch((e) => console.log(e));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isEmbed]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setIsLoading(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const target = parseFloat(e.target.value);
    video.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    savePlayerSettings({ muted: newMuted });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    const muted = val === 0;
    video.muted = muted;
    setIsMuted(muted);
    savePlayerSettings({ volume: val, muted });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    const isCurrentlyFs = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isCurrentlyFs) {
      const el = containerRef.current as any;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  const handleSpeedSelect = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const handleQualitySelect = (level: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = level;
    setCurrentQualityLevel(level);
    setShowQualityMenu(false);
  };

  const toggleSubtitles = () => {
    setSubtitlesEnabled((prev) => !prev);
  };

  const handleSubtitleTrackSelect = (index: number) => {
    if (index === -1) {
      setSubtitlesEnabled(false);
    } else {
      setSubtitlesEnabled(true);
      setActiveSubtitleIndex(index);
    }
    setShowSubtitleMenu(false);
  };

  const handleAudioSelect = (newAudio: "sub" | "dub") => {
    if (onAudioChange) onAudioChange(newAudio);
    setShowAudioMenu(false);
  };

  const aniSkipIntro = streamSource?.skip?.intro;
  const aniSkipOutro = streamSource?.skip?.outro;

  const handleSkipIntro = () => {
    const video = videoRef.current;
    if (!video) return;
    if (aniSkipIntro) {
      video.currentTime = aniSkipIntro.endTime;
    } else {
      video.currentTime = Math.min(video.duration, video.currentTime + 85);
    }
  };

  const handleSkipOutro = () => {
    const video = videoRef.current;
    if (!video || !aniSkipOutro) return;
    video.currentTime = aniSkipOutro.endTime;
  };

  const handleSeekOffset = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const handleResume = () => {
    const video = videoRef.current;
    if (video && savedResumeTime > 0) {
      video.currentTime = savedResumeTime;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    setShowResumePrompt(false);
  };

  // Keyboard controls (Space=Play, K=Play, M=Mute, F=Fullscreen, C=Toggle CC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.code) {
        case "Space":
        case "KeyK":
          if (!isEmbed) {
            e.preventDefault();
            togglePlay();
          }
          break;
        case "ArrowRight":
          if (!isEmbed) {
            e.preventDefault();
            handleSeekOffset(10);
          }
          break;
        case "ArrowLeft":
          if (!isEmbed) {
            e.preventDefault();
            handleSeekOffset(-10);
          }
          break;
        case "KeyM":
          if (!isEmbed) {
            e.preventDefault();
            toggleMute();
          }
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyC":
          if (!isEmbed) {
            e.preventDefault();
            toggleSubtitles();
          }
          break;
        case "KeyN":
          if (hasNextEpisode && onNextEpisode) {
            e.preventDefault();
            onNextEpisode();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, hasNextEpisode, onNextEpisode, isEmbed]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const subtitlesList = streamSource?.subtitles || [];

  // Subtitle styling dynamic classes based on user settings
  const subtitleSizeClass =
    subtitleSize === "small"
      ? "text-xs sm:text-sm"
      : subtitleSize === "large"
      ? "text-base sm:text-xl md:text-2xl"
      : "text-xs sm:text-base md:text-lg";

  const subtitleBgClass =
    subtitleBg === "none"
      ? "bg-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,1)] border-none"
      : subtitleBg === "translucent"
      ? "bg-black/55 backdrop-blur-[2px] border border-white/10"
      : "bg-black/90 backdrop-blur-[3px] border border-white/15";

  const subtitleColorClass = subtitleColor === "yellow" ? "text-yellow-300" : "text-white";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-yugito-border select-none group"
    >
      {/* 
        STREAM ENGINE: Embed Provider vs Native HLS Video
        When isEmbed: The provider handles its own playback controls, progress bar, duration,
        and subtitles. We intentionally suppress outer controls so there is NO duplicate timeline,
        NO duplicate playback duration, and NO overlapping controls.
      */}
      {isEmbed ? (
        <div className="relative w-full h-full bg-black">
          <iframe
            key={streamSource.url}
            src={streamSource.url}
            className="w-full h-full border-0 rounded-2xl"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; cross-origin-isolated"
            allowFullScreen
            referrerPolicy="origin"
            title={`${animeTitle} Episode ${episodeNumber}`}
          />

          {/* Minimalist Header Pill for Embeds — Auto-fades during playback */}
          <div
            className={`absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
              controlsVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
                {streamSource.server || "Streambert Mirror"}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Ad-Shield Active</span>
              </span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-black/80 hover:bg-black/95 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-lg active:scale-95"
                title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Native HLS / MP4 Video Surface */
        <video
          ref={videoRef}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (hasNextEpisode && onNextEpisode) onNextEpisode();
          }}
          playsInline
          className="w-full h-full object-contain cursor-pointer"
        />
      )}

      {/* 
        CINEMATIC SUBTITLE RENDERING (Native Mode Only)
        Custom React cues render without native browser track duplicates, guaranteeing
        single subtitle track display and customizable appearance.
      */}
      {!isEmbed && subtitlesEnabled && activeCueText && (
        <div className="absolute bottom-14 sm:bottom-18 md:bottom-20 left-4 right-4 flex justify-center pointer-events-none z-30 transition-all">
          <span
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-extrabold text-center leading-snug drop-shadow-lg max-w-2xl whitespace-pre-line animate-fadeIn ${subtitleSizeClass} ${subtitleBgClass} ${subtitleColorClass}`}
          >
            {activeCueText}
          </span>
        </div>
      )}

      {/* Buffering Spinner (Native Mode) */}
      {!isEmbed && isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] pointer-events-none z-20">
          <div className="w-12 h-12 rounded-full border-4 border-yugito-accent border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-semibold text-yugito-text">Buffering stream...</p>
        </div>
      )}

      {/* Error Overlay with Retry */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-yugito-bg/95 p-6 text-center z-30">
          <AlertCircle className="w-12 h-12 text-yugito-red mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Playback Error</h3>
          <p className="text-xs text-yugito-muted max-w-md mb-5 leading-relaxed">
            {errorDetails || "Unable to load stream. Please switch audio or server."}
          </p>
          <div className="flex items-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yugito-accent hover:bg-yugito-accentHover text-white text-xs font-bold transition-all shadow-md shadow-yugito-accent/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Stream</span>
              </button>
            )}
            {hasNextEpisode && onNextEpisode && (
              <button
                type="button"
                onClick={onNextEpisode}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yugito-card hover:bg-yugito-surface text-yugito-text text-xs font-semibold border border-yugito-border transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                <span>Next Episode</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resume Playback Prompt (Native Mode) */}
      {!isEmbed && showResumePrompt && !hasError && (
        <div className="absolute top-4 left-4 z-30 bg-yugito-card/95 border border-yugito-accent/50 rounded-xl p-3 shadow-yugito backdrop-blur-md animate-fadeIn flex items-center gap-3">
          <div>
            <div className="text-xs font-bold text-white">Resume from last time?</div>
            <div className="text-[11px] text-yugito-muted">Jump to {formatTime(savedResumeTime)}</div>
          </div>
          <button
            type="button"
            onClick={handleResume}
            className="px-3 py-1.5 rounded-lg bg-yugito-accent text-white text-xs font-bold hover:bg-yugito-accentHover transition-colors"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={() => setShowResumePrompt(false)}
            className="text-xs text-yugito-subtle hover:text-white px-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* AniSkip Opening Button (Native Mode) */}
      {!isEmbed && isPlaying && aniSkipIntro && currentTime >= aniSkipIntro.startTime && currentTime < aniSkipIntro.endTime && (
        <button
          type="button"
          onClick={handleSkipIntro}
          className="absolute bottom-20 left-4 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-yugito-accent hover:bg-yugito-accentHover text-white text-xs font-bold border border-white/20 backdrop-blur-md shadow-lg shadow-yugito-accent/40 transition-all animate-bounce"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Skip Opening (AniSkip)</span>
        </button>
      )}

      {/* AniSkip Ending Button (Native Mode) */}
      {!isEmbed && isPlaying && aniSkipOutro && currentTime >= aniSkipOutro.startTime && currentTime < aniSkipOutro.endTime && (
        <button
          type="button"
          onClick={handleSkipOutro}
          className="absolute bottom-20 right-4 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-yugito-accent hover:bg-yugito-accentHover text-white text-xs font-bold border border-white/20 backdrop-blur-md shadow-lg shadow-yugito-accent/40 transition-all animate-bounce"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Skip Ending (AniSkip)</span>
        </button>
      )}

      {/* Fallback Intro Button when AniSkip is not available (Native Mode) */}
      {!isEmbed && isPlaying && !aniSkipIntro && currentTime > 5 && currentTime < 100 && (
        <button
          type="button"
          onClick={handleSkipIntro}
          className="absolute bottom-20 right-4 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-yugito-card/90 hover:bg-yugito-accent text-white text-xs font-bold border border-yugito-border backdrop-blur-md shadow-lg transition-all animate-fadeIn"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Skip Intro (+85s)</span>
        </button>
      )}

      {/* 
        NATIVE CONTROLS OVERLAY:
        Rendered EXCLUSIVELY for native HLS/MP4 streams.
        For embeds, this is completely excluded to eliminate duplicate timelines,
        duplicate durations, and overlapping controls.
      */}
      {!isEmbed && (
        <div
          className={`absolute inset-0 flex flex-col justify-between p-4 z-20 bg-gradient-to-t from-black/85 via-transparent to-black/60 transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Top Info Bar: Title & Indicators */}
          <div className="flex items-center justify-between text-xs text-white drop-shadow">
            <div className="truncate max-w-md flex items-center gap-2">
              <span className="font-bold text-yugito-accentLight">Ep {episodeNumber}</span>
              <span className="text-white/40">•</span>
              <span className="font-semibold truncate">{animeTitle}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Streambert Engine Badge */}
              {streamSource?.server?.toLowerCase().includes("streambert") && (
                <span className="px-2 py-0.5 rounded bg-violet-600/30 border border-violet-500/50 text-[10px] font-bold text-violet-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span>STREAMBERT</span>
                </span>
              )}

              {/* Audio Indicator */}
              <span className="px-2 py-0.5 rounded bg-yugito-accent/30 border border-yugito-accent/50 text-[10px] font-bold text-yugito-accentLight flex items-center gap-1">
                <Headphones className="w-3 h-3" />
                <span>{currentAudio === "dub" ? "ENGLISH DUB" : "JAPANESE (SUB)"}</span>
              </span>

              {/* Subtitle Indicator */}
              <span
                className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-colors ${
                  subtitlesEnabled
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                    : "bg-white/10 border-white/20 text-yugito-muted"
                }`}
              >
                CC: {subtitlesEnabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          {/* Center Play Button if paused */}
          {!isPlaying && !isLoading && !hasError && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-yugito-accent/90 hover:bg-yugito-accent text-white flex items-center justify-center shadow-yugitoGlow transform hover:scale-110 transition-all"
                aria-label="Play"
              >
                <Play className="w-7 h-7 fill-white ml-1" />
              </button>
            </div>
          )}
          <div />

          {/* Single Unified Bottom Control Bar */}
          <div className="space-y-2">
            {/* Playback Timeline Slider */}
            <div className="relative group/scrubber flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yugito-accent group-hover/scrubber:h-2.5 transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white pt-1">
              {/* Left Controls: Play, Prev, Next, Volume, Single Duration Indicator */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1 hover:text-yugito-accentLight transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                {hasPrevEpisode && onPrevEpisode && (
                  <button
                    type="button"
                    onClick={onPrevEpisode}
                    className="p-1 hover:text-yugito-accentLight transition-colors"
                    title="Previous Episode"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                {hasNextEpisode && onNextEpisode && (
                  <button
                    type="button"
                    onClick={onNextEpisode}
                    className="p-1 hover:text-yugito-accentLight transition-colors"
                    title="Next Episode (N)"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}

                {/* Volume Slider */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1 hover:text-yugito-accentLight transition-colors"
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
                    className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yugito-accent opacity-70 group-hover/vol:opacity-100 transition-opacity"
                  />
                </div>

                {/* Single Timestamp */}
                <div className="text-[11px] text-yugito-muted font-medium ml-1">
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Controls: Audio, Subtitles, Speed, Quality, Fullscreen */}
              <div className="flex items-center gap-2.5">
                {/* Audio Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAudioMenu(!showAudioMenu)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yugito-card/90 border border-white/10 hover:border-yugito-accent text-[11px] font-bold text-white transition-all"
                    title="Switch Audio"
                  >
                    <Headphones className="w-3.5 h-3.5 text-yugito-accent" />
                    <span>{currentAudio === "dub" ? "Dub" : "Japanese"}</span>
                  </button>
                  {showAudioMenu && (
                    <div className="absolute bottom-9 right-0 bg-yugito-card border border-yugito-border rounded-xl shadow-yugito py-1.5 w-48 z-40 text-xs">
                      <div className="px-3 py-1 text-[10px] uppercase font-bold text-yugito-subtle tracking-wider">
                        Audio Track
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAudioSelect("sub")}
                        className={`w-full text-left px-3 py-2 hover:bg-yugito-surface flex items-center justify-between ${
                          currentAudio === "sub" ? "text-yugito-accent font-bold" : "text-yugito-text"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>Japanese (Original)</span>
                          <span className="text-[10px] text-yugito-muted font-normal">Subtitles Recommended</span>
                        </div>
                        {currentAudio === "sub" && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAudioSelect("dub")}
                        className={`w-full text-left px-3 py-2 hover:bg-yugito-surface flex items-center justify-between ${
                          currentAudio === "dub" ? "text-yugito-accent font-bold" : "text-yugito-text"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>English Dub</span>
                          <span className="text-[10px] text-yugito-muted font-normal">English Voiceover</span>
                        </div>
                        {currentAudio === "dub" && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtitles (CC) Menu with Language & Appearance Options */}
                <div className="relative">
                  <div className="inline-flex rounded-lg border border-white/10 bg-yugito-card/90 overflow-hidden">
                    <button
                      type="button"
                      onClick={toggleSubtitles}
                      className={`flex items-center gap-1 px-2 py-1 text-xs font-bold transition-all ${
                        subtitlesEnabled
                          ? "bg-yugito-accent text-white"
                          : "text-yugito-muted hover:text-white"
                      }`}
                      title="Toggle Subtitles (C)"
                    >
                      <Subtitles className="w-3.5 h-3.5" />
                      <span>CC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                      className="px-1.5 text-yugito-muted hover:text-white text-[10px] bg-white/5 hover:bg-white/10"
                      title="Subtitle Options"
                    >
                      ▾
                    </button>
                  </div>

                  {showSubtitleMenu && (
                    <div className="absolute bottom-9 right-0 bg-yugito-card border border-yugito-border rounded-xl shadow-yugito py-2 w-64 max-h-80 overflow-y-auto z-40 text-xs space-y-2">
                      <div className="px-3 py-1 text-[10px] uppercase font-bold text-yugito-subtle tracking-wider flex items-center justify-between">
                        <span>Subtitles</span>
                        <button
                          type="button"
                          onClick={() => setShowSubtitleSettings(!showSubtitleSettings)}
                          className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          <span>{showSubtitleSettings ? "Tracks" : "Style"}</span>
                        </button>
                      </div>

                      {showSubtitleSettings ? (
                        /* Subtitle Styling / Appearance Customizer */
                        <div className="px-3 py-1 space-y-3">
                          {/* Font Size */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-yugito-muted">Font Size</label>
                            <div className="grid grid-cols-3 gap-1">
                              {(["small", "medium", "large"] as const).map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => {
                                    setSubtitleSize(sz);
                                    savePlayerSettings({ subtitleSize: sz });
                                  }}
                                  className={`py-1 rounded text-[11px] font-semibold capitalize border ${
                                    subtitleSize === sz
                                      ? "bg-sky-500 text-white border-sky-400 font-bold"
                                      : "bg-yugito-surface border-yugito-border text-yugito-muted hover:text-white"
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Background Opacity */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-yugito-muted">Background</label>
                            <div className="grid grid-cols-3 gap-1">
                              {(["solid", "translucent", "none"] as const).map((bg) => (
                                <button
                                  key={bg}
                                  type="button"
                                  onClick={() => {
                                    setSubtitleBg(bg);
                                    savePlayerSettings({ subtitleBg: bg });
                                  }}
                                  className={`py-1 rounded text-[11px] font-semibold capitalize border ${
                                    subtitleBg === bg
                                      ? "bg-sky-500 text-white border-sky-400 font-bold"
                                      : "bg-yugito-surface border-yugito-border text-yugito-muted hover:text-white"
                                  }`}
                                >
                                  {bg}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Subtitle Color */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-yugito-muted">Text Color</label>
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSubtitleColor("white");
                                  savePlayerSettings({ subtitleColor: "white" });
                                }}
                                className={`py-1 rounded text-[11px] font-semibold border ${
                                  subtitleColor === "white"
                                    ? "bg-sky-500 text-white border-sky-400 font-bold"
                                    : "bg-yugito-surface border-yugito-border text-yugito-muted hover:text-white"
                                }`}
                              >
                                Crisp White
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSubtitleColor("yellow");
                                  savePlayerSettings({ subtitleColor: "yellow" });
                                }}
                                className={`py-1 rounded text-[11px] font-semibold border ${
                                  subtitleColor === "yellow"
                                    ? "bg-yellow-400 text-black border-yellow-300 font-bold"
                                    : "bg-yugito-surface border-yugito-border text-yugito-muted hover:text-white"
                                }`}
                              >
                                Cinema Yellow
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Subtitle Track Selection */
                        <>
                          <button
                            type="button"
                            onClick={() => handleSubtitleTrackSelect(-1)}
                            className={`w-full text-left px-3 py-1.5 hover:bg-yugito-surface flex items-center justify-between ${
                              !subtitlesEnabled ? "text-yugito-accent font-bold bg-yugito-surface/50" : "text-yugito-text"
                            }`}
                          >
                            <span>Off (No Subtitles)</span>
                            {!subtitlesEnabled && <Check className="w-3.5 h-3.5" />}
                          </button>

                          <div className="h-px bg-yugito-border my-1" />

                          {subtitlesList.length > 0 ? (
                            subtitlesList.map((sub, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSubtitleTrackSelect(i)}
                                className={`w-full text-left px-3 py-1.5 hover:bg-yugito-surface flex items-center justify-between truncate ${
                                  subtitlesEnabled && activeSubtitleIndex === i
                                    ? "text-yugito-accent font-bold bg-yugito-surface/50"
                                    : "text-yugito-text"
                                }`}
                              >
                                <span className="truncate">{sub.label || `Track ${i + 1}`}</span>
                                {subtitlesEnabled && activeSubtitleIndex === i && (
                                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-[11px] text-yugito-subtle">
                              English subtitles automatically active
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Speed Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2 py-0.5 rounded text-[11px] font-bold hover:bg-white/10 transition-colors"
                  >
                    {playbackSpeed}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-8 right-0 bg-yugito-card border border-yugito-border rounded-xl shadow-yugito py-1 w-24 z-30 text-xs">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSpeedSelect(s)}
                          className={`w-full text-left px-3 py-1.5 hover:bg-yugito-surface ${
                            playbackSpeed === s ? "text-yugito-accent font-bold" : "text-yugito-muted"
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quality Menu */}
                {availableQualities.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowQualityMenu(!showQualityMenu)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yugito-card/90 border border-white/10 hover:border-yugito-accent text-[11px] font-bold text-white transition-all"
                      title="Stream Quality"
                    >
                      <Settings className="w-3.5 h-3.5 text-yugito-accent" />
                      <span>
                        {currentQualityLevel === -1
                          ? activeLevelHeight
                            ? `${activeLevelHeight}p`
                            : "Auto"
                          : `${availableQualities.find((q) => q.level === currentQualityLevel)?.height || "HD"}p`}
                      </span>
                    </button>
                    {showQualityMenu && (
                      <div className="absolute bottom-9 right-0 bg-yugito-card border border-yugito-border rounded-xl shadow-yugito py-1.5 w-36 z-40 text-xs">
                        <div className="px-3 py-1 text-[10px] uppercase font-bold text-yugito-subtle tracking-wider">
                          Resolution
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQualitySelect(-1)}
                          className={`w-full text-left px-3 py-1.5 hover:bg-yugito-surface flex items-center justify-between ${
                            currentQualityLevel === -1
                              ? "text-yugito-accent font-bold bg-yugito-surface/50"
                              : "text-yugito-text"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span>Auto</span>
                            {activeLevelHeight && (
                              <span className="text-[9px] text-yugito-muted">Playing {activeLevelHeight}p</span>
                            )}
                          </div>
                          {currentQualityLevel === -1 && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="h-px bg-yugito-border my-1" />
                        {availableQualities.map((q) => (
                          <button
                            key={q.level}
                            type="button"
                            onClick={() => handleQualitySelect(q.level)}
                            className={`w-full text-left px-3 py-1.5 hover:bg-yugito-surface flex items-center justify-between ${
                              currentQualityLevel === q.level
                                ? "text-yugito-accent font-bold bg-yugito-surface/50"
                                : "text-yugito-text"
                            }`}
                          >
                            <span className="font-semibold">
                              {q.height}p {q.height >= 1080 ? "FHD" : q.height >= 720 ? "HD" : ""}
                            </span>
                            {currentQualityLevel === q.level && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Single Fullscreen Toggle Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1 hover:text-yugito-accentLight transition-colors"
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen (F)"}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
