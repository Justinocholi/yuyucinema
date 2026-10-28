"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Tv,
  Radio,
  Users,
  Play,
  Volume2,
  Maximize2,
  Sparkles,
  Flame,
  Clock,
  Compass,
  ChevronRight,
  Filter,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { ANIME_CHANNELS, AnimeLiveChannel } from "@/lib/channels";

export default function ChannelsClient() {
  const [activeChannelId, setActiveChannelId] = useState<string>("toonami-aftermath");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  const currentChannel =
    ANIME_CHANNELS.find((c) => c.id === activeChannelId) || ANIME_CHANNELS[0];

  const filteredChannels = ANIME_CHANNELS.filter((ch) => {
    if (selectedCategory === "all") return true;
    return ch.category === selectedCategory;
  });

  const categories = [
    { id: "all", label: "All Channels", count: ANIME_CHANNELS.length },
    { id: "movies", label: "Anime Movies & Cinema", count: ANIME_CHANNELS.filter((c) => c.category === "movies").length },
    { id: "shonen", label: "Shonen & Action", count: ANIME_CHANNELS.filter((c) => c.category === "shonen").length },
    { id: "marathon", label: "24/7 Marathons", count: ANIME_CHANNELS.filter((c) => c.category === "marathon").length },
    { id: "retro", label: "Classic & Retro", count: ANIME_CHANNELS.filter((c) => c.category === "retro").length },
    { id: "music", label: "Music & Chill", count: ANIME_CHANNELS.filter((c) => c.category === "music").length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-[#0c1527]/80 backdrop-blur-xl border border-sky-500/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Live Broadcast</span>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Streambert Powered</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Live Anime TV Channels
          </h1>
          <p className="text-xs sm:text-sm text-yugito-muted max-w-xl">
            Tune into 24/7 non-stop anime broadcasts, movie marathons, retro blocks, and music streams with zero commercial delays.
          </p>
        </div>

        <div className="flex items-center gap-4 z-10 self-start sm:self-auto">
          <div className="text-right bg-sky-500/10 border border-sky-500/20 px-4 py-2.5 rounded-2xl backdrop-blur-md">
            <div className="text-xs text-sky-300 font-semibold">Total Viewers</div>
            <div className="text-lg font-black text-white flex items-center justify-end gap-1.5">
              <Users className="w-4 h-4 text-sky-400" />
              <span>218,590</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Live Player & Now Playing Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Live Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-sky-500/25">
            <iframe
              key={currentChannel.id}
              src={currentChannel.streamUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="origin"
              title={currentChannel.name}
            />

            {/* Live Indicator & Ad-Shield Watermark */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="uppercase tracking-wider">{currentChannel.callsign}</span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-bold">
                {currentChannel.quality}
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Ad-Shield Active</span>
              </div>
            </div>
          </div>

          {/* Current Channel Info Bar */}
          <div className="p-5 rounded-2xl bg-yugito-card border border-yugito-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-yugito-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-yugito-accent text-white">
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
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {currentChannel.name}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yugito-surface border border-yugito-border text-xs text-white font-semibold">
                  <Users className="w-3.5 h-3.5 text-yugito-accent" />
                  <span>{currentChannel.viewers.toLocaleString()} watching</span>
                </div>
              </div>
            </div>

            {/* Now Playing & Next Up Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Now Playing */}
              <div className="p-3.5 rounded-xl bg-yugito-surface/70 border border-yugito-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-yugito-accentLight font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Now Playing
                  </span>
                  <span className="text-yugito-muted text-[11px]">
                    {currentChannel.nowPlaying.startsAt} - {currentChannel.nowPlaying.endsAt}
                  </span>
                </div>
                <div className="font-bold text-white text-sm truncate">
                  {currentChannel.nowPlaying.title}
                </div>
                <div className="text-xs text-yugito-muted line-clamp-1">
                  {currentChannel.nowPlaying.episode}
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-yugito-accent to-yugito-accentLight rounded-full transition-all"
                    style={{ width: `${currentChannel.nowPlaying.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Next Up */}
              <div className="p-3.5 rounded-xl bg-yugito-surface/70 border border-yugito-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-yugito-muted font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                    <Clock className="w-3 h-3 text-yugito-subtle" />
                    Up Next
                  </span>
                  <span className="text-yugito-accentLight font-semibold text-[11px]">
                    {currentChannel.nextUp.startsAt}
                  </span>
                </div>
                <div className="font-bold text-white text-sm truncate">
                  {currentChannel.nextUp.title}
                </div>
                <div className="text-xs text-yugito-muted line-clamp-1">
                  {currentChannel.nextUp.episode}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Channel Switcher List */}
        <div className="lg:col-span-1 rounded-2xl bg-yugito-card border border-yugito-border p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-yugito-border">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-yugito-accent" />
              <h3 className="text-sm font-bold text-white">Channel Guide</h3>
            </div>
            <span className="text-xs font-semibold text-yugito-muted">
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
                      ? "bg-yugito-accent text-white border-yugito-accent shadow-sm"
                      : "bg-yugito-surface text-yugito-muted hover:text-white border-yugito-border"
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
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 group ${
                    isActive
                      ? "bg-yugito-surface border-yugito-accent shadow-md shadow-yugito-accent/10"
                      : "bg-yugito-surface/50 border-yugito-border hover:border-yugito-accent/50 hover:bg-yugito-surface"
                  }`}
                >
                  {/* Thumbnail / Callsign */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/60 border border-white/10 flex items-center justify-center">
                    <span className="text-[11px] font-black text-white/90 uppercase tracking-tighter">
                      {ch.callsign}
                    </span>
                    {isActive && (
                      <div className="absolute inset-0 bg-yugito-accent/20 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      </div>
                    )}
                  </div>

                  {/* Channel Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-bold text-white truncate group-hover:text-yugito-accentLight transition-colors">
                        {ch.name}
                      </div>
                      {isActive && (
                        <span className="text-[10px] text-yugito-accent font-extrabold uppercase">
                          ON AIR
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-yugito-accentLight font-semibold truncate mt-0.5">
                      {ch.nowPlaying.title}
                    </div>
                    <div className="text-[10px] text-yugito-muted truncate mt-0.5 flex items-center justify-between">
                      <span>{ch.nowPlaying.episode}</span>
                      <span className="text-yugito-subtle">{ch.viewers.toLocaleString()}</span>
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
