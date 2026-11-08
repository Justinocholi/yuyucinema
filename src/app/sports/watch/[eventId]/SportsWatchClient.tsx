"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Server,
  Radio,
  Clock,
  ArrowLeft,
  Share2,
  Bookmark,
  ShieldCheck,
  ChevronRight,
  Tv,
  Play,
  Users,
} from "lucide-react";
import { SportsEvent, SportsStreamSource } from "@/lib/sports";
import SportsPlayer from "@/components/sports/SportsPlayer";

interface SportsWatchClientProps {
  event: SportsEvent;
  relatedEvents: SportsEvent[];
}

export default function SportsWatchClient({ event, relatedEvents }: SportsWatchClientProps) {
  const [activeStreamIndex, setActiveStreamIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const streams = event.streams && event.streams.length > 0 ? event.streams : [
    {
      id: "srv-1",
      name: "Server 1 (VIP Ultra HD)",
      url: "https://cbsn-us-cedexis.cbsnstream.cbsnews.com/out/v1/55a864888f334590ab223048b61cf446/master.m3u8",
      type: "hls" as const,
      quality: "1080p FHD",
      isOfficial: true,
    },
    {
      id: "srv-2",
      name: "Server 2 (Global Sports CDN)",
      url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
      type: "hls" as const,
      quality: "720p HD",
      isOfficial: true,
    },
  ];

  const activeStream = streams[activeStreamIndex] || streams[0];
  const matchTitle = `${event.homeTeam.name} vs ${event.awayTeam.name}`;
  const scoreDisplay =
    event.homeTeam.score !== undefined && event.awayTeam.score !== undefined
      ? `${event.homeTeam.score} - ${event.awayTeam.score}`
      : undefined;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-20 pb-20 space-y-6">
      {/* Breadcrumb & Back to Sports */}
      <div className="flex items-center justify-between gap-2 text-xs text-yugito-muted">
        <div className="flex items-center gap-2 overflow-hidden truncate">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/sports" className="hover:text-white transition-colors">
            Sports
          </Link>
          <span>/</span>
          <span className="text-white font-semibold truncate">{matchTitle}</span>
        </div>

        <Link
          href="/sports"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c1527] hover:bg-[#152545] border border-sky-500/20 text-sky-300 font-semibold text-xs transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sports</span>
        </Link>
      </div>

      {/* Main Grid: Player + Match Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 3 Cols: Video Player & Controls */}
        <div className="lg:col-span-3 space-y-4">
          {/* Sports Player Container */}
          <SportsPlayer
            eventTitle={matchTitle}
            competition={event.competition}
            status={event.status}
            statusText={event.statusText}
            scoreText={scoreDisplay}
            streams={streams}
            activeStreamIndex={activeStreamIndex}
            onSelectStream={(idx) => setActiveStreamIndex(idx)}
          />

          {/* Match Score & Information Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {event.status === "LIVE" ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>LIVE • {event.statusText}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                    {event.statusText || event.status}
                  </span>
                )}
                <span className="text-xs text-sky-200/80 font-bold uppercase tracking-wider">
                  {event.competition}
                </span>
                {event.venue && (
                  <>
                    <span className="text-yugito-muted">•</span>
                    <span className="text-xs text-yugito-muted truncate max-w-xs">{event.venue}</span>
                  </>
                )}
              </div>

              {/* Title & Live Score */}
              <div className="flex items-center gap-3">
                <h1 className="text-lg sm:text-2xl font-black text-white">
                  {matchTitle}
                </h1>
                {scoreDisplay && (
                  <span className="px-3 py-1 rounded-xl bg-black/60 border border-sky-500/30 text-white font-black text-sm sm:text-lg">
                    {scoreDisplay}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isBookmarked
                    ? "bg-sky-500 text-white border-sky-400"
                    : "bg-[#101d36]/70 hover:bg-[#152545] text-yugito-muted hover:text-white border-sky-500/20"
                }`}
                title="Save Match to Favorites"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Streaming Server Gateway */}
          <div className="p-4 rounded-2xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-sky-500/15">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Server className="w-4 h-4 text-sky-400" />
                <span>Streaming Mirror Server</span>
              </div>
              <span className="text-[11px] text-sky-300 font-semibold">
                Active: {activeStream.name}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {streams.map((s, idx) => {
                const isSelected = activeStreamIndex === idx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveStreamIndex(idx)}
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
                      <span>{s.name}</span>
                      <span className="text-[9px] text-yugito-subtle">{s.quality || "High Definition"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Match Lineup & Related Fixtures */}
        <div className="lg:col-span-1 rounded-3xl bg-[#0c1527]/85 backdrop-blur-xl border border-sky-500/20 p-5 space-y-5 shadow-xl">
          {/* Match Crests Showcase */}
          <div className="space-y-3 pb-4 border-b border-sky-500/15">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-sky-400" />
              <span>Competitors</span>
            </h3>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-black/40 p-1 flex items-center justify-center flex-shrink-0">
                  {event.homeTeam.logo ? (
                    <Image src={event.homeTeam.logo} alt={event.homeTeam.name} width={28} height={28} className="object-contain" />
                  ) : (
                    <Trophy className="w-4 h-4 text-sky-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{event.homeTeam.name}</div>
                  <div className="text-[10px] text-yugito-muted">Home Team</div>
                </div>
                {event.homeTeam.score !== undefined && (
                  <span className="text-sm font-black text-white">{event.homeTeam.score}</span>
                )}
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-black/40 p-1 flex items-center justify-center flex-shrink-0">
                  {event.awayTeam.logo ? (
                    <Image src={event.awayTeam.logo} alt={event.awayTeam.name} width={28} height={28} className="object-contain" />
                  ) : (
                    <Trophy className="w-4 h-4 text-sky-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{event.awayTeam.name}</div>
                  <div className="text-[10px] text-yugito-muted">Away Team</div>
                </div>
                {event.awayTeam.score !== undefined && (
                  <span className="text-sm font-black text-white">{event.awayTeam.score}</span>
                )}
              </div>
            </div>
          </div>

          {/* Related / Other Live Events */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-sky-400" />
              <span>Other Live Fixtures</span>
            </h3>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {relatedEvents.map((rel) => {
                const relScore =
                  rel.homeTeam.score !== undefined && rel.awayTeam.score !== undefined
                    ? `${rel.homeTeam.score} - ${rel.awayTeam.score}`
                    : undefined;

                return (
                  <Link
                    key={rel.id}
                    href={`/sports/watch/${rel.id}`}
                    className="group block p-3 rounded-xl bg-white/5 hover:bg-sky-500/10 border border-white/5 hover:border-sky-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px] text-yugito-muted mb-1">
                      <span className="truncate max-w-[140px] uppercase font-semibold">{rel.competition}</span>
                      {rel.status === "LIVE" ? (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span>{rel.statusText}</span>
                        </span>
                      ) : (
                        <span>{rel.statusText}</span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                      {rel.homeTeam.name} vs {rel.awayTeam.name}
                    </div>
                    {relScore && (
                      <div className="text-[11px] font-black text-sky-400 mt-0.5">{relScore}</div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
