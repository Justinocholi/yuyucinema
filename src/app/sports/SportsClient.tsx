"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Play,
  Flame,
  Clock,
  Calendar,
  Search,
  Filter,
  Users,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Tv,
  ArrowRight,
  Radio,
  Zap,
} from "lucide-react";
import {
  SportsEvent,
  SportsChannel,
  SPORTS_CATEGORIES,
  POPULAR_COMPETITIONS,
} from "@/lib/sports";

interface SportsClientProps {
  initialEvents: SportsEvent[];
  channels: SportsChannel[];
}

export default function SportsClient({ initialEvents, channels }: SportsClientProps) {
  const [events, setEvents] = useState<SportsEvent[]>(initialEvents);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCompetition, setSelectedCompetition] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "live" | "upcoming">("all");

  // Dynamic Featured Hero Event: prioritized by LIVE status and isFeatured flag
  const featuredEvent = useMemo(() => {
    const liveFeatured = events.find((e) => e.status === "LIVE" && e.isFeatured);
    if (liveFeatured) return liveFeatured;
    const anyLive = events.find((e) => e.status === "LIVE");
    if (anyLive) return anyLive;
    const upcomingFeatured = events.find((e) => e.status === "UPCOMING" && e.isFeatured);
    if (upcomingFeatured) return upcomingFeatured;
    return events[0] || null;
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Category filter
      if (selectedCategory !== "all" && ev.sport !== selectedCategory) return false;

      // Competition filter
      if (selectedCompetition !== "all" && ev.competitionId !== selectedCompetition) return false;

      // Status tab filter
      if (statusTab === "live" && ev.status !== "LIVE") return false;
      if (statusTab === "upcoming" && ev.status !== "UPCOMING") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = `${ev.homeTeam.name} ${ev.awayTeam.name} ${ev.competition}`.toLowerCase();
        if (!matchTitle.includes(q)) return false;
      }

      return true;
    });
  }, [events, selectedCategory, selectedCompetition, statusTab, searchQuery]);

  const liveEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.status === "LIVE");
  }, [filteredEvents]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.status === "UPCOMING");
  }, [filteredEvents]);

  const finishedEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.status === "FINISHED");
  }, [filteredEvents]);

  const formatStartTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Upcoming";
    }
  };

  const formatDateLabel = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const isToday = new Date().toDateString() === d.toDateString();
      if (isToday) return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Upcoming";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-20 pb-20 space-y-8">
      {/* 
        FEATURED HERO SECTION
        Inspired by ESPN+ & beIN SPORTS: Highlights prime ongoing or upcoming game
      */}
      {featuredEvent && (
        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c1527] via-[#091122] to-[#070b16] border border-sky-500/25 shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Column: Match Details & Teams */}
            <div className="space-y-4 max-w-2xl w-full text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-bold">
                {featuredEvent.status === "LIVE" ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/25 text-red-400 border border-red-500/40 text-xs font-black uppercase tracking-wider animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>LIVE MATCH • {featuredEvent.statusText}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>{formatDateLabel(featuredEvent.startTime)}</span>
                  </span>
                )}

                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90 uppercase tracking-wider text-[11px]">
                  {featuredEvent.competition}
                </span>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>1080p FHD Feed</span>
                </span>
              </div>

              {/* Match Header with Team Crests & Score */}
              <div className="py-2">
                <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-10">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center shadow-lg">
                      {featuredEvent.homeTeam.logo ? (
                        <Image
                          src={featuredEvent.homeTeam.logo}
                          alt={featuredEvent.homeTeam.name}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      ) : (
                        <Trophy className="w-8 h-8 text-sky-400" />
                      )}
                    </div>
                    <span className="font-bold text-white text-xs sm:text-sm text-center max-w-[100px] truncate">
                      {featuredEvent.homeTeam.name}
                    </span>
                  </div>

                  {/* Score or VS Badge */}
                  <div className="flex flex-col items-center justify-center">
                    {featuredEvent.status === "LIVE" || featuredEvent.status === "FINISHED" ? (
                      <div className="flex items-center gap-3 bg-black/60 border border-sky-500/30 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md">
                        <span className="text-2xl sm:text-4xl font-black text-white">
                          {featuredEvent.homeTeam.score ?? 0}
                        </span>
                        <span className="text-sky-400 font-bold text-lg sm:text-xl">:</span>
                        <span className="text-2xl sm:text-4xl font-black text-white">
                          {featuredEvent.awayTeam.score ?? 0}
                        </span>
                      </div>
                    ) : (
                      <div className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 font-black text-sm">
                        VS
                      </div>
                    )}
                    <span className="text-[10px] text-yugito-muted uppercase tracking-widest mt-1 font-semibold">
                      {featuredEvent.statusText}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center shadow-lg">
                      {featuredEvent.awayTeam.logo ? (
                        <Image
                          src={featuredEvent.awayTeam.logo}
                          alt={featuredEvent.awayTeam.name}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      ) : (
                        <Trophy className="w-8 h-8 text-sky-400" />
                      )}
                    </div>
                    <span className="font-bold text-white text-xs sm:text-sm text-center max-w-[100px] truncate">
                      {featuredEvent.awayTeam.name}
                    </span>
                  </div>
                </div>

                {featuredEvent.venue && (
                  <p className="text-xs text-yugito-muted mt-3">
                    📍 {featuredEvent.venue}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  href={`/sports/watch/${featuredEvent.id}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 border border-sky-400/30"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{featuredEvent.status === "LIVE" ? "Watch Live Stream" : "View Live Feed"}</span>
                </Link>

                <Link
                  href={`/sports/watch/${featuredEvent.id}`}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#101d36]/80 hover:bg-[#152545] text-white font-semibold text-xs sm:text-sm border border-sky-500/20 backdrop-blur-xl transition-all shadow-md"
                >
                  <Tv className="w-4 h-4 text-sky-400" />
                  <span>Multi-Server Streams</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Broadcast Server Highlights */}
            <div className="w-full lg:w-80 rounded-2xl bg-[#070b16]/80 border border-sky-500/20 p-4 space-y-3 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 border-b border-sky-500/15 text-xs">
                <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-sky-400" />
                  <span>Streaming Relay</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400">3 Servers Ready</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Server 1 (VIP Ultra HD)</div>
                    <div className="text-[10px] text-yugito-muted">1080p FHD 60FPS Direct Stream</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Server 2 (Global Edge CDN)</div>
                    <div className="text-[10px] text-yugito-muted">High Bitrate Low Latency</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Server 3 (CBS Golazo Live)</div>
                    <div className="text-[10px] text-yugito-muted">24/7 Live Broadcast Network</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        SEARCH, STATUS TABS & CATEGORY FILTERS
      */}
      <div className="space-y-4">
        {/* Top Controls Bar: Search & Status Tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="inline-flex rounded-2xl bg-[#0c1527] p-1 border border-sky-500/20 text-xs font-semibold self-start">
            <button
              type="button"
              onClick={() => setStatusTab("all")}
              className={`px-4 py-2 rounded-xl transition-all ${
                statusTab === "all"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold shadow-md shadow-sky-500/25"
                  : "text-yugito-muted hover:text-white"
              }`}
            >
              All Matches ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab("live")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                statusTab === "live"
                  ? "bg-red-600 text-white font-bold shadow-md shadow-red-500/30"
                  : "text-yugito-muted hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>Live Now ({events.filter((e) => e.status === "LIVE").length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusTab("upcoming")}
              className={`px-4 py-2 rounded-xl transition-all ${
                statusTab === "upcoming"
                  ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold shadow-md shadow-sky-500/25"
                  : "text-yugito-muted hover:text-white"
              }`}
            >
              Upcoming ({events.filter((e) => e.status === "UPCOMING").length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or league..."
              className="w-full bg-[#0c1527]/90 text-white placeholder-yugito-muted/60 text-xs px-4 py-2.5 pl-10 rounded-2xl border border-sky-500/25 focus:border-sky-400 focus:outline-none shadow-sm"
            />
            <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-yugito-muted hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sport Categories Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {SPORTS_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  isSelected
                    ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20"
                    : "bg-[#0c1527]/80 hover:bg-[#101d36] text-yugito-muted hover:text-white border-sky-500/15"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Popular Competitions Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
          <span className="text-yugito-muted font-bold uppercase tracking-wider pr-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-sky-400" />
            <span>Leagues:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedCompetition("all")}
            className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all border ${
              selectedCompetition === "all"
                ? "bg-sky-500/20 border-sky-400/40 text-sky-200"
                : "bg-white/5 border-transparent text-yugito-muted hover:text-white"
            }`}
          >
            All Leagues
          </button>
          {POPULAR_COMPETITIONS.map((comp) => {
            const isSelected = selectedCompetition === comp.id;
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => setSelectedCompetition(comp.id)}
                className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-sky-500/20 border-sky-400/40 text-sky-200"
                    : "bg-white/5 border-transparent text-yugito-muted hover:text-white"
                }`}
              >
                {comp.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 
        LIVE NOW SECTION
      */}
      {statusTab !== "upcoming" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                Live Now
              </h2>
            </div>
            <span className="text-xs font-bold text-red-400">
              {liveEvents.length} Active {liveEvents.length === 1 ? "Broadcast" : "Broadcasts"}
            </span>
          </div>

          {liveEvents.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#0c1527]/60 border border-sky-500/15 text-center space-y-2">
              <Clock className="w-8 h-8 text-sky-400 mx-auto opacity-60" />
              <h3 className="text-sm font-bold text-white">No Live Matches Right Now</h3>
              <p className="text-xs text-yugito-muted max-w-md mx-auto">
                No events are currently on air in this filter. Check the upcoming fixtures or tune into 24/7 sports TV channels below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/sports/watch/${ev.id}`}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#0c1527]/85 hover:bg-[#101d36] border border-sky-500/20 hover:border-sky-400/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/20 hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    {/* Competition & Live Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-yugito-muted uppercase tracking-wider text-[10px] truncate max-w-[180px]">
                        {ev.competition}
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 font-extrabold text-[10px] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>{ev.statusText || "LIVE"}</span>
                      </span>
                    </div>

                    {/* Teams & Current Score */}
                    <div className="space-y-2.5 py-1">
                      {/* Home Team */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 p-1 flex items-center justify-center flex-shrink-0">
                            {ev.homeTeam.logo ? (
                              <Image src={ev.homeTeam.logo} alt={ev.homeTeam.name} width={24} height={24} className="object-contain" />
                            ) : (
                              <Trophy className="w-3.5 h-3.5 text-sky-400" />
                            )}
                          </div>
                          <span className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-sky-300 transition-colors">
                            {ev.homeTeam.name}
                          </span>
                        </div>
                        <span className="text-base sm:text-lg font-black text-white px-2 py-0.5 rounded-lg bg-black/40">
                          {ev.homeTeam.score ?? 0}
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 p-1 flex items-center justify-center flex-shrink-0">
                            {ev.awayTeam.logo ? (
                              <Image src={ev.awayTeam.logo} alt={ev.awayTeam.name} width={24} height={24} className="object-contain" />
                            ) : (
                              <Trophy className="w-3.5 h-3.5 text-sky-400" />
                            )}
                          </div>
                          <span className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-sky-300 transition-colors">
                            {ev.awayTeam.name}
                          </span>
                        </div>
                        <span className="text-base sm:text-lg font-black text-white px-2 py-0.5 rounded-lg bg-black/40">
                          {ev.awayTeam.score ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer / Watch Now Button */}
                  <div className="pt-3 mt-2 border-t border-sky-500/15 flex items-center justify-between">
                    <span className="text-[10px] text-yugito-subtle">
                      {ev.venue ? ev.venue : "Live Broadcast Feed"}
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
                      <Play className="w-3 h-3 fill-white" />
                      <span>Watch Live</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 
        24/7 AUTHORIZED SPORTS BROADCASTING CHANNELS
      */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
              24/7 Sports TV Channels
            </h2>
          </div>
          <span className="text-xs font-bold text-sky-300">Continuous Satellite Feeds</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/sports/watch/channel-${ch.id}`}
              className="group relative flex flex-col justify-between p-4 rounded-2xl bg-[#0c1527]/80 hover:bg-[#101d36] border border-sky-500/20 hover:border-sky-400/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/20 hover:-translate-y-1"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {ch.callsign}
                  </span>
                  {ch.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {ch.badge}
                    </span>
                  )}
                </div>

                <div className="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-sky-300 transition-colors">
                  {ch.name}
                </div>

                <p className="text-[11px] text-yugito-muted line-clamp-2 leading-relaxed">
                  {ch.description}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-sky-500/10 flex items-center justify-between text-xs">
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>On Air</span>
                </span>
                <span className="text-sky-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  <span>Tune In</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 
        UPCOMING FIXTURES SECTION
      */}
      {statusTab !== "live" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                Upcoming Fixtures
              </h2>
            </div>
            <span className="text-xs font-bold text-sky-300">
              {upcomingEvents.length} Scheduled Matches
            </span>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#0c1527]/60 border border-sky-500/15 text-center text-xs text-yugito-muted">
              No upcoming fixtures matched your filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/sports/watch/${ev.id}`}
                  className="group flex flex-col justify-between p-5 rounded-2xl bg-[#0c1527]/85 hover:bg-[#101d36] border border-sky-500/20 hover:border-sky-400/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/20 hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-yugito-muted uppercase tracking-wider text-[10px] truncate max-w-[180px]">
                        {ev.competition}
                      </span>
                      <span className="flex items-center gap-1 text-sky-300 font-bold text-[10px] bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/30">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span>{formatDateLabel(ev.startTime)}</span>
                      </span>
                    </div>

                    {/* Competing Teams */}
                    <div className="py-2 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 p-1 flex items-center justify-center flex-shrink-0">
                          {ev.homeTeam.logo ? (
                            <Image src={ev.homeTeam.logo} alt={ev.homeTeam.name} width={24} height={24} className="object-contain" />
                          ) : (
                            <Trophy className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                        <span className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-sky-300 transition-colors">
                          {ev.homeTeam.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 p-1 flex items-center justify-center flex-shrink-0">
                          {ev.awayTeam.logo ? (
                            <Image src={ev.awayTeam.logo} alt={ev.awayTeam.name} width={24} height={24} className="object-contain" />
                          ) : (
                            <Trophy className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                        <span className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-sky-300 transition-colors">
                          {ev.awayTeam.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-sky-500/15 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-yugito-subtle">
                      {ev.venue || "Stadium Venue"}
                    </span>
                    <span className="text-sky-400 font-semibold text-xs flex items-center gap-1 group-hover:text-white transition-colors">
                      <span>Match Center</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
