import React from "react";
import { notFound } from "next/navigation";
import { getAnimeDetails } from "@/lib/anilist";
import { fetchEpisodesFromAPI, fetchStreamSourcesFromAPI } from "@/lib/streaming";
import WatchClient from "./WatchClient";

export const revalidate = 60;

interface WatchPageProps {
  params: {
    id: string;
    episode: string;
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const animeId = parseInt(params.id, 10);
  const episodeNumber = parseInt(params.episode, 10);

  if (isNaN(animeId) || isNaN(episodeNumber)) notFound();

  // Fetch anime details first or parallel
  const anime = await getAnimeDetails(animeId);
  if (!anime) notFound();

  const animeTitle = anime.title.english || anime.title.romaji || anime.title.userPreferred || "Anime";

  // Fetch episodes list and stream sources in PARALLEL for ultra-fast page load
  const [episodesResult, streamResult] = await Promise.all([
    fetchEpisodesFromAPI(animeId, "anizone"),
    fetchStreamSourcesFromAPI(animeId, episodeNumber, "sub", "anizone", animeTitle, anime.idMal),
  ]);

  let episodes = episodesResult.episodes;

  // Synthesize episodes if needed
  if (episodes.length === 0 && (anime.format === "MOVIE" || (anime.episodes && anime.episodes > 0))) {
    const totalEp = anime.episodes && anime.episodes > 0 ? anime.episodes : 1;
    episodes = Array.from({ length: totalEp }, (_, i) => ({
      id: `${i + 1}`,
      number: i + 1,
      title: anime.format === "MOVIE" ? "Full Feature Film" : `Episode ${i + 1}`,
      audio: "sub",
    }));
  }

  return (
    <WatchClient
      anime={anime}
      episodeNumber={episodeNumber}
      episodes={episodes}
      initialStreams={streamResult.streams || []}
      initialError={streamResult.error}
    />
  );
}
