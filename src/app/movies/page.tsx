import React from "react";
import { Metadata } from "next";
import { getTopAnimeMovies } from "@/lib/anilist";
import { getTrendingMovies } from "@/lib/tmdb";
import MoviesClient from "./MoviesClient";

export const metadata: Metadata = {
  title: "Movies & Cinema (Hollywood & Anime) - Yugito",
  description: "Stream the best cinema blockbusters, Hollywood movies, and anime feature films in 1080p FHD with Sub & Dub and direct downloads.",
};

export const revalidate = 300;

export default async function MoviesPage() {
  const [animeData, cinemaData] = await Promise.all([
    getTopAnimeMovies(1, 28),
    getTrendingMovies(1),
  ]);

  return (
    <MoviesClient
      initialAnimeMovies={animeData.media}
      initialCinemaMovies={cinemaData.results}
    />
  );
}
