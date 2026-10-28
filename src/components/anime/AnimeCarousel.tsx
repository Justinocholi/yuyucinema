"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Anime } from "@/types/anime";
import AnimeCard from "./AnimeCard";

interface AnimeCarouselProps {
  title: string;
  subtitle?: string;
  animeList: Anime[];
  viewAllHref?: string;
  showRank?: boolean;
}

export default function AnimeCarousel({
  title,
  subtitle,
  animeList,
  viewAllHref,
  showRank = false,
}: AnimeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!animeList || animeList.length === 0) return null;

  return (
    <section className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-xs text-yugito-muted mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs font-bold text-sky-400 hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-xl hover:bg-sky-500/10 border border-sky-500/20"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <div className="hidden sm:flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="p-1.5 rounded-xl bg-[#0c1527]/80 hover:bg-[#152545] text-yugito-muted hover:text-white border border-sky-500/20 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="p-1.5 rounded-xl bg-[#0c1527]/80 hover:bg-[#152545] text-yugito-muted hover:text-white border border-sky-500/20 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {animeList.map((anime, idx) => (
          <div
            key={anime.id}
            className="flex-shrink-0 w-[140px] sm:w-[170px] md:w-[190px] lg:w-[205px]"
          >
            <AnimeCard anime={anime} rank={showRank ? idx + 1 : undefined} />
          </div>
        ))}
      </div>
    </section>
  );
}
