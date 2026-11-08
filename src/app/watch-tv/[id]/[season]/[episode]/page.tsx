import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTVDetails, getTVRecommendations } from "@/lib/tmdb";
import WatchTVClient from "./WatchTVClient";

export const revalidate = 300;

interface WatchTVPageProps {
  params: {
    id: string;
    season: string;
    episode: string;
  };
}

export async function generateMetadata({ params }: WatchTVPageProps): Promise<Metadata> {
  const showId = parseInt(params.id, 10);
  if (isNaN(showId)) return { title: "TV Show - Yugito Cinema" };
  const show = await getTVDetails(showId);
  if (!show) return { title: "TV Show - Yugito Cinema" };
  return {
    title: `Watch ${show.title} S${params.season}E${params.episode} - Yugito Cinema`,
    description: show.overview,
  };
}

export default async function WatchTVPage({ params }: WatchTVPageProps) {
  const showId = parseInt(params.id, 10);
  const seasonNumber = parseInt(params.season, 10) || 1;
  const episodeNumber = parseInt(params.episode, 10) || 1;

  if (isNaN(showId)) notFound();

  const show = await getTVDetails(showId);
  if (!show) notFound();

  let recommendations = show.recommendations || [];
  if (recommendations.length === 0) {
    const genreIds = show.genres?.map((g) => g.id);
    recommendations = await getTVRecommendations(showId, genreIds, 12);
  }

  return (
    <WatchTVClient
      show={show}
      seasonNumber={seasonNumber}
      episodeNumber={episodeNumber}
      initialRecommendations={recommendations}
    />
  );
}
