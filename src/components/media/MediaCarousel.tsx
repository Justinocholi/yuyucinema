"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Star, Play, Download } from "lucide-react";
import { TMDBMedia, getTMDBImageUrl } from "@/lib/tmdb";

interface MediaCarouselProps {
  title: string;
  subtitle?: string;
  mediaList: TMDBMedia[];
  viewAllHref: string;
  type?: "movie" | "tv";
}

export default function MediaCarousel({
  title,
  subtitle,
  mediaList,
  viewAllHref,
  type = "movie",
}: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!mediaList || mediaList.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
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
              aria-label="Previous items"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="p-1.5 rounded-xl bg-[#0c1527]/80 hover:bg-[#152545] text-yugito-muted hover:text-white border border-sky-500/20 transition-colors"
              aria-label="Next items"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar scroll-smooth"
      >
        {mediaList.map((item) => {
          const poster = getTMDBImageUrl(item.posterPath, "w500");
          const watchHref =
            type === "tv"
              ? `/watch-tv/${item.id}/1/1`
              : `/watch-movie/${item.id}`;

          return (
            <Link
              key={item.id}
              href={watchHref}
              className="flex-shrink-0 w-36 sm:w-44 md:w-48 group flex flex-col space-y-2 rounded-2xl p-2 bg-[#0c1527]/60 hover:bg-[#101d36]/80 border border-sky-500/15 hover:border-sky-400/40 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-sky-500/15"
            >
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-black/40 border border-sky-500/10">
                <Image
                  src={poster}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-amber-400 font-bold text-[10px]">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{item.voteAverage}</span>
                </div>

                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-sky-500/90 text-white font-black text-[9px] uppercase tracking-wider">
                  {type === "tv" ? "TV Show" : "Movie"}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/40 scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 px-1">
                <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-sky-300 transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-yugito-muted">
                  <span>{item.releaseDate ? new Date(item.releaseDate).getFullYear() : (type === "tv" ? "Series" : "Cinema")}</span>
                  <span className="text-sky-400 font-semibold flex items-center gap-0.5">
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
