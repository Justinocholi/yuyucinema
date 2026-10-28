"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Play, Bookmark, Check } from "lucide-react";
import { Anime } from "@/types/anime";
import { formatScore } from "@/lib/utils";
import { getWatchlistItem, setWatchlistStatus, removeWatchlistItem } from "@/lib/storage";

interface AnimeCardProps {
  anime: Anime;
  rank?: number;
  priority?: boolean;
}

export default function AnimeCard({ anime, rank, priority = false }: AnimeCardProps) {
  const [imgError, setImgError] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  const title =
    anime.title.userPreferred ||
    anime.title.english ||
    anime.title.romaji ||
    anime.title.native ||
    "Untitled Anime";

  const poster =
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    anime.coverImage?.medium ||
    "/placeholder-poster.png";

  useEffect(() => {
    const item = getWatchlistItem(anime.id);
    setInWatchlist(!!item);

    const handleUpdate = () => {
      const updated = getWatchlistItem(anime.id);
      setInWatchlist(!!updated);
    };

    window.addEventListener("yugito_watchlist_updated", handleUpdate);
    return () => window.removeEventListener("yugito_watchlist_updated", handleUpdate);
  }, [anime.id]);

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inWatchlist) {
      removeWatchlistItem(anime.id);
      setInWatchlist(false);
    } else {
      setWatchlistStatus(
        {
          id: anime.id,
          title,
          cover: poster,
          banner: anime.bannerImage,
          format: anime.format,
          episodes: anime.episodes,
        },
        "planning"
      );
      setInWatchlist(true);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#0c1527]/70 border border-sky-500/20 hover:border-sky-400/50 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/20 hover:-translate-y-1">
      <Link href={`/anime/${anime.id}`} className="relative aspect-[2/3] w-full overflow-hidden bg-black/40">
        {/* Poster Image */}
        {!imgError ? (
          <Image
            src={poster}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
            onError={() => setImgError(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-yugito-surface text-yugito-subtle p-3 text-center">
            <span className="text-2xl mb-1">🎬</span>
            <span className="text-xs font-medium line-clamp-2">{title}</span>
          </div>
        )}

        {/* Dark Vignette Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b16] via-transparent to-black/30 opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Top Badges: Rank & Format */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
          {rank !== undefined ? (
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 text-white font-black text-xs px-2.5 py-0.5 rounded-lg shadow-md border border-sky-400/40">
              #{rank}
            </span>
          ) : anime.format ? (
            <span className="bg-[#0c1527]/85 backdrop-blur-md text-sky-200 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              {anime.format}
            </span>
          ) : (
            <span />
          )}

          {/* Quick Watchlist Bookmark Button */}
          <button
            type="button"
            onClick={toggleWatchlist}
            className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
              inWatchlist
                ? "bg-sky-500 text-white shadow-sm"
                : "bg-black/60 text-white/80 hover:text-white hover:bg-black/90 border border-white/10"
            }`}
            title={inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            aria-label={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Play Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-xl shadow-sky-500/40 transform scale-75 group-hover:scale-100 transition-transform duration-300 border border-white/20">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom Metadata inside Poster */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white/90 z-10 font-medium">
          {anime.averageScore ? (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10">
              <Star className="w-3 h-3 text-yugito-gold fill-yugito-gold" />
              <span>{formatScore(anime.averageScore)}</span>
            </div>
          ) : (
            <span />
          )}

          {anime.nextAiringEpisode ? (
            <span className="bg-yugito-accent/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold">
              Ep {anime.nextAiringEpisode.episode} Soon
            </span>
          ) : anime.episodes ? (
            <span className="bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px]">
              {anime.episodes} Ep{anime.episodes > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
      </Link>

      {/* Card Info Below Poster */}
      <div className="p-3 flex flex-col justify-between flex-grow">
        <Link href={`/anime/${anime.id}`} className="block">
          <h3
            className="text-xs sm:text-sm font-semibold text-yugito-text group-hover:text-yugito-accentLight transition-colors line-clamp-2 leading-snug"
            title={title}
          >
            {title}
          </h3>
        </Link>

        {/* Genres line */}
        {anime.genres && anime.genres.length > 0 && (
          <div className="mt-1 text-[11px] text-yugito-muted/80 truncate">
            {anime.genres.slice(0, 2).join(" • ")}
          </div>
        )}
      </div>
    </div>
  );
}
