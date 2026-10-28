"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Star, Play } from "lucide-react";
import { ScheduleDay } from "@/types/anime";
import { getWeeklySchedule } from "@/lib/anilist";
import { formatScore } from "@/lib/utils";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true);
      try {
        const data = await getWeeklySchedule();
        setSchedule(data);
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedule();
  }, []);

  const activeDay = schedule[activeDayIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yugito-accent/20 text-yugito-accent flex items-center justify-center">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Release Schedule
          </h1>
          <p className="text-xs sm:text-sm text-yugito-muted">
            Weekly simulcast broadcast schedule with live countdowns
          </p>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8 border-b border-yugito-border">
        {schedule.map((day, idx) => {
          const isActive = idx === activeDayIndex;
          return (
            <button
              key={day.dayName + day.dateStr}
              type="button"
              onClick={() => setActiveDayIndex(idx)}
              className={`flex flex-col items-center flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-yugito-accent text-white shadow-lg shadow-yugito-accent/30"
                  : "bg-yugito-card/80 text-yugito-muted hover:text-white hover:bg-yugito-surface border border-yugito-border/50"
              }`}
            >
              <span className="font-bold">{day.dayName}</span>
              <span className={`text-[10px] mt-0.5 ${isActive ? "text-white/80" : "text-yugito-subtle"}`}>
                {day.dateStr}
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-yugito-card/60 rounded-xl border border-yugito-border animate-pulse"
            />
          ))}
        </div>
      ) : !activeDay || activeDay.items.length === 0 ? (
        <div className="py-16 text-center bg-yugito-card/50 rounded-2xl border border-yugito-border p-8">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-base font-semibold text-white mb-1">No scheduled releases</h3>
          <p className="text-xs text-yugito-muted">
            There are no simulcast episodes slated to broadcast on this day.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeDay.items.map((item) => {
            const anime = item.media;
            const title =
              anime.title.userPreferred || anime.title.english || anime.title.romaji || "Untitled";
            const cover =
              anime.coverImage?.large || anime.coverImage?.medium || "/placeholder-poster.png";

            // Format airing time
            const airDate = new Date(item.airingAt * 1000);
            const timeStr = airDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            // Countdown helper
            const hoursUntil = Math.floor(item.timeUntilAiring / 3600);
            const minsUntil = Math.floor((item.timeUntilAiring % 3600) / 60);
            const isAired = item.timeUntilAiring <= 0;

            return (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-4 p-3.5 rounded-xl bg-yugito-card border border-yugito-border hover:border-yugito-accent/60 transition-all hover:shadow-yugito"
              >
                {/* Poster & Title */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-yugito-surface">
                    <Image src={cover} alt={title} fill className="object-cover" />
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/anime/${anime.id}`}
                      className="text-xs sm:text-sm font-bold text-white hover:text-yugito-accentLight transition-colors truncate block"
                    >
                      {title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-yugito-muted mt-1">
                      <span className="font-semibold text-yugito-accentLight">
                        Episode {item.episode}
                      </span>
                      {anime.format && (
                        <>
                          <span>•</span>
                          <span className="uppercase text-[10px]">{anime.format}</span>
                        </>
                      )}
                      {anime.averageScore && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-yugito-gold">
                            <Star className="w-3 h-3 fill-yugito-gold" />
                            {formatScore(anime.averageScore)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Airing Time / Countdown & Action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5 text-yugito-accent" />
                      <span>{timeStr}</span>
                    </div>
                    <div className="text-[11px] text-yugito-muted">
                      {isAired ? "Aired" : `in ${hoursUntil}h ${minsUntil}m`}
                    </div>
                  </div>

                  <Link
                    href={`/anime/${anime.id}`}
                    className="p-2.5 rounded-xl bg-yugito-surface hover:bg-yugito-accent text-yugito-text hover:text-white border border-yugito-border transition-all"
                    title="View anime"
                  >
                    <Play className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
