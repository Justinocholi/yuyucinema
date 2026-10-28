"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, ChevronLeft, ChevronRight, Star, Bookmark, Check } from "lucide-react";
import { Anime } from "@/types/anime";
import { formatScore, cleanHtmlDescription } from "@/lib/utils";
import { getWatchlistItem, setWatchlistStatus, removeWatchlistItem } from "@/lib/storage";

interface FeaturedHeroProps {
  animeList: Anime[];
}

export default function FeaturedHero({ animeList }: FeaturedHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  // Auto rotate carousel every 7 seconds when not paused
  useEffect(() => {
    if (animeList.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animeList.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [animeList.length, isPaused]);

  const current = animeList[currentIndex] || animeList[0];

  useEffect(() => {
    if (!current) return;
    const item = getWatchlistItem(current.id);
    setInWatchlist(!!item);

    const handleUpdate = () => {
      const updated = getWatchlistItem(current.id);
      setInWatchlist(!!updated);
    };

    window.addEventListener("yugito_watchlist_updated", handleUpdate);
    return () => window.removeEventListener("yugito_watchlist_updated", handleUpdate);
  }, [current]);

  if (!current) return null;

  const title =
    current.title.english ||
    current.title.romaji ||
    current.title.userPreferred ||
    "Featured Title";

  const altTitle =
    current.title.romaji && current.title.english && current.title.romaji !== current.title.english
      ? current.title.romaji
      : current.title.native || null;

  const backdrop = current.bannerImage || current.coverImage?.extraLarge || current.coverImage?.large;
  const poster = current.coverImage?.extraLarge || current.coverImage?.large;
  const synopsis = cleanHtmlDescription(current.description);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeWatchlistItem(current.id);
      setInWatchlist(false);
    } else {
      setWatchlistStatus(
        {
          id: current.id,
          title,
          cover: current.coverImage?.large || "",
          banner: current.bannerImage,
          format: current.format,
          episodes: current.episodes,
        },
        "planning"
      );
      setInWatchlist(true);
    }
  };

  return (
    <div
      className="relative w-full min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Banner Artwork */}
      {backdrop && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backdrop}
            alt={title}
            fill
            priority
            className="object-cover object-top opacity-55 transition-all duration-700 scale-100"
          />
          {/* Gradients to blend seamlessly into #0B0B10 */}
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0 hero-side-gradient hidden md:block" />
          <div className="absolute inset-0 bg-yugito-bg/30" />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 pb-16">
        <div className="max-w-2xl space-y-4 animate-fadeIn">
          {/* Badges / Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {current.averageScore && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-yugito-card/90 border border-yugito-border text-yugito-text">
                <Star className="w-3.5 h-3.5 text-yugito-gold fill-yugito-gold" />
                <span>{formatScore(current.averageScore)}</span>
              </span>
            )}
            {current.format && (
              <span className="px-2.5 py-1 rounded-md bg-yugito-card/90 border border-yugito-border text-yugito-text uppercase tracking-wider text-[11px]">
                {current.format}
              </span>
            )}
            {current.status && (
              <span className="px-2.5 py-1 rounded-md bg-yugito-card/90 border border-yugito-border text-yugito-accentLight text-[11px]">
                {current.status === "RELEASING" ? "Airing Now" : current.status}
              </span>
            )}
            {current.episodes && (
              <span className="px-2.5 py-1 rounded-md bg-yugito-card/90 border border-yugito-border text-yugito-muted text-[11px]">
                {current.episodes} Episodes
              </span>
            )}
            {/* Audio Indicator Tags */}
            <span className="px-2 py-0.5 rounded bg-yugito-accent/20 border border-yugito-accent/40 text-yugito-accentLight text-[10px] font-bold">
              SUB / DUB
            </span>
          </div>

          {/* Titles */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white line-clamp-2 drop-shadow-md">
              {title}
            </h1>
            {altTitle && (
              <p className="text-sm sm:text-base text-yugito-muted font-medium mt-1 italic line-clamp-1">
                {altTitle}
              </p>
            )}
          </div>

          {/* Genres */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {current.genres.slice(0, 4).map((g) => (
                <Link
                  key={g}
                  href={`/explore?genre=${encodeURIComponent(g)}`}
                  className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-yugito-accent/40 backdrop-blur-sm text-[11px] font-medium text-yugito-text transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {synopsis && (
            <p className="text-sm sm:text-base text-yugito-muted line-clamp-3 leading-relaxed drop-shadow-sm max-w-xl">
              {synopsis}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/watch/${current.id}/1`}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-sm shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 border border-sky-400/30"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={`/anime/${current.id}`}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0c1527]/80 hover:bg-[#152545] text-white font-semibold text-sm border border-sky-500/20 backdrop-blur-xl transition-all shadow-md"
            >
              <Info className="w-4 h-4 text-sky-400" />
              <span>View Details</span>
            </Link>

            <button
              type="button"
              onClick={toggleWatchlist}
              className={`p-3 rounded-2xl border transition-all ${
                inWatchlist
                  ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30"
                  : "bg-[#0c1527]/80 text-yugito-muted hover:text-white border-sky-500/20 hover:border-sky-400 backdrop-blur-xl"
              }`}
              title={inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            >
              {inWatchlist ? <Check className="w-5 h-5 text-white" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Controls (Arrows & Indicators) */}
      {animeList.length > 1 && (
        <>
          <div className="absolute right-4 bottom-6 z-20 hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) => (prev === 0 ? animeList.length - 1 : prev - 1))
              }
              className="p-2.5 rounded-full bg-yugito-card/80 hover:bg-yugito-accent text-white border border-yugito-border backdrop-blur-sm transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % animeList.length)}
              className="p-2.5 rounded-full bg-yugito-card/80 hover:bg-yugito-accent text-white border border-yugito-border backdrop-blur-sm transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {animeList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "w-6 bg-yugito-accent" : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
