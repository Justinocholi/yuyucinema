import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Star,
  Calendar,
  Clock,
  Tv,
  Film,
  Building,
  ChevronRight,
  Info,
} from "lucide-react";
import { getAnimeDetails } from "@/lib/anilist";
import { fetchEpisodesFromAPI } from "@/lib/streaming";
import { formatScore, cleanHtmlDescription } from "@/lib/utils";
import EpisodeListClient from "./EpisodeListClient";
import DetailWatchlistButton from "./DetailWatchlistButton";

export const revalidate = 300;

interface AnimeDetailPageProps {
  params: { id: string };
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const animeId = parseInt(params.id, 10);
  if (isNaN(animeId)) notFound();

  // Fetch anime details from AniList
  const anime = await getAnimeDetails(animeId);
  if (!anime) notFound();

  // Fetch episodes from streaming API backend
  const episodesResult = await fetchEpisodesFromAPI(animeId);

  // If backend returned fewer episodes than total, synthesize fallback list so all episodes are navigable
  let episodes = episodesResult.episodes;
  if (episodes.length === 0 && (anime.format === "MOVIE" || (anime.episodes && anime.episodes > 0))) {
    const totalEp = anime.episodes && anime.episodes > 0 ? anime.episodes : 1;
    episodes = Array.from({ length: totalEp }, (_, i) => ({
      id: `${i + 1}`,
      number: i + 1,
      title: anime.format === "MOVIE" ? "Full Feature Film" : `Episode ${i + 1}`,
      audio: "sub",
      description: "",
    }));
  }

  const title =
    anime.title.english ||
    anime.title.romaji ||
    anime.title.userPreferred ||
    "Untitled Anime";

  const altTitle =
    anime.title.romaji && anime.title.english && anime.title.romaji !== anime.title.english
      ? anime.title.romaji
      : anime.title.native || null;

  const backdrop = anime.bannerImage || anime.coverImage?.extraLarge;
  const poster = anime.coverImage?.extraLarge || anime.coverImage?.large || "/placeholder-poster.png";
  const synopsis = cleanHtmlDescription(anime.description);
  const studioName = anime.studios?.nodes?.[0]?.name;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Banner Backdrop */}
      <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[480px] overflow-hidden">
        {backdrop && (
          <Image
            src={backdrop}
            alt={title}
            fill
            priority
            className="object-cover object-top opacity-40 scale-105"
          />
        )}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-yugito-bg/50" />
      </div>

      {/* Main Details Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 sm:-mt-52 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Column: Poster & Quick Actions */}
          <div className="w-48 sm:w-60 md:w-64 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-yugito-border bg-yugito-card">
              <Image src={poster} alt={title} fill priority className="object-cover" />
            </div>

            {/* Actions: Watch Now & Watchlist */}
            <div className="mt-4 space-y-2.5">
              <Link
                href={`/watch/${anime.id}/1`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yugito-accent hover:bg-yugito-accentHover text-white font-bold text-sm shadow-lg shadow-yugito-accent/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{anime.format === "MOVIE" ? "Watch Movie" : "Watch Episode 1"}</span>
              </Link>

              {/* Client Watchlist Status Button */}
              <DetailWatchlistButton anime={anime} />
            </div>
          </div>

          {/* Right Column: Title, Metadata, Synopsis */}
          <div className="flex-grow space-y-5">
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {anime.averageScore && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-yugito-card border border-yugito-border text-yugito-text">
                  <Star className="w-3.5 h-3.5 text-yugito-gold fill-yugito-gold" />
                  <span>{formatScore(anime.averageScore)}</span>
                </span>
              )}
              {anime.format && (
                <span className="px-2.5 py-1 rounded-md bg-yugito-card border border-yugito-border text-yugito-text uppercase tracking-wider text-[11px]">
                  {anime.format}
                </span>
              )}
              {anime.status && (
                <span className="px-2.5 py-1 rounded-md bg-yugito-card border border-yugito-border text-yugito-accentLight text-[11px]">
                  {anime.status === "RELEASING" ? "Airing Now" : anime.status}
                </span>
              )}
              {anime.seasonYear && (
                <span className="px-2.5 py-1 rounded-md bg-yugito-card border border-yugito-border text-yugito-muted text-[11px]">
                  {anime.season} {anime.seasonYear}
                </span>
              )}
              {anime.episodes && (
                <span className="px-2.5 py-1 rounded-md bg-yugito-card border border-yugito-border text-yugito-muted text-[11px]">
                  {anime.episodes} Episodes
                </span>
              )}
              {anime.duration && (
                <span className="px-2.5 py-1 rounded-md bg-yugito-card border border-yugito-border text-yugito-muted text-[11px]">
                  {anime.duration}m / ep
                </span>
              )}
              {studioName && (
                <span className="px-2.5 py-1 rounded-md bg-yugito-card border border-yugito-border text-yugito-muted text-[11px] flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  <span>{studioName}</span>
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-yugito-accent/20 border border-yugito-accent/40 text-yugito-accentLight text-[10px] font-bold">
                SUB / DUB
              </span>
            </div>

            {/* Titles */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {title}
              </h1>
              {altTitle && (
                <p className="text-sm sm:text-base text-yugito-muted font-medium mt-1 italic">
                  {altTitle}
                </p>
              )}
            </div>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/explore?genre=${encodeURIComponent(g)}`}
                    className="px-3 py-1 rounded-full bg-yugito-card hover:bg-yugito-surface border border-yugito-border text-xs font-semibold text-yugito-text transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {synopsis && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-yugito-text">
                  Synopsis
                </h3>
                <p className="text-sm text-yugito-muted leading-relaxed whitespace-pre-line max-w-3xl">
                  {synopsis}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Episode Browser Section */}
        <div className="mt-14">
          <EpisodeListClient animeId={anime.id} episodes={episodes} />
        </div>

        {/* Relations & Recommendations */}
        {anime.relations?.edges && anime.relations.edges.length > 0 && (
          <div className="mt-14">
            <h3 className="text-lg font-bold text-white mb-4">Related Content</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {anime.relations.edges.slice(0, 6).map((edge) => {
                const rel = edge.node;
                const relTitle =
                  rel.title.english || rel.title.romaji || rel.title.userPreferred || "Untitled";
                const relCover = rel.coverImage?.large || rel.coverImage?.medium;
                return (
                  <Link
                    key={rel.id}
                    href={`/anime/${rel.id}`}
                    className="group flex flex-col rounded-xl overflow-hidden bg-yugito-card border border-yugito-border hover:border-yugito-accent/60 transition-all p-2"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-yugito-surface">
                      {relCover && (
                        <Image
                          src={relCover}
                          alt={relTitle}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-[10px] font-bold text-yugito-accentLight uppercase">
                        {edge.relationType.replace(/_/g, " ")}
                      </span>
                      <h4 className="text-xs font-semibold text-yugito-text group-hover:text-white truncate">
                        {relTitle}
                      </h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
