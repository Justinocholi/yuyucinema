import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getMovieDetails, getMovieRecommendations } from "@/lib/tmdb";
import WatchMovieClient from "./WatchMovieClient";

export const revalidate = 300;

interface WatchMoviePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: WatchMoviePageProps): Promise<Metadata> {
  const movieId = parseInt(params.id, 10);
  if (isNaN(movieId)) return { title: "Movie - Yugito Cinema" };
  const movie = await getMovieDetails(movieId);
  if (!movie) return { title: "Movie - Yugito Cinema" };
  return {
    title: `Watch ${movie.title} - Yugito Cinema`,
    description: movie.overview,
  };
}

export default async function WatchMoviePage({ params }: WatchMoviePageProps) {
  const movieId = parseInt(params.id, 10);
  if (isNaN(movieId)) notFound();

  const movie = await getMovieDetails(movieId);
  if (!movie) notFound();

  let recommendations = movie.recommendations || [];
  if (recommendations.length === 0) {
    const genreIds = movie.genres?.map((g) => g.id);
    recommendations = await getMovieRecommendations(movieId, genreIds, 12);
  }

  return <WatchMovieClient movie={movie} initialRecommendations={recommendations} />;
}
