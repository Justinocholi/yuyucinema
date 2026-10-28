import React from "react";
import {
  getFeaturedAnime,
  getTrendingAnime,
  getPopularAnime,
  getRecentlyUpdatedAnime,
  getTopAnimeMovies,
} from "@/lib/anilist";
import { getTrendingMovies, getTrendingTV } from "@/lib/tmdb";
import FeaturedHero from "@/components/home/FeaturedHero";
import ContinueWatching from "@/components/home/ContinueWatching";
import AnimeCarousel from "@/components/anime/AnimeCarousel";
import MediaCarousel from "@/components/media/MediaCarousel";
import GenreChips from "@/components/home/GenreChips";

export const revalidate = 300; // Server-side revalidation every 5 minutes

export default async function HomePage() {
  // Fetch real catalog data in parallel
  const [
    featured,
    trendingData,
    popularData,
    recentlyUpdated,
    animeMoviesData,
    cinemaMoviesData,
    tvSeriesData,
  ] = await Promise.all([
    getFeaturedAnime(),
    getTrendingAnime(1, 16),
    getPopularAnime(1, 16),
    getRecentlyUpdatedAnime(1, 16),
    getTopAnimeMovies(1, 16),
    getTrendingMovies(1),
    getTrendingTV(1),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Featured Anime Hero Carousel */}
      <FeaturedHero animeList={featured} />

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-6 sm:-mt-10 relative z-20 space-y-4">
        {/* Continue Watching Section (Reads from LocalStorage, hidden if empty) */}
        <ContinueWatching />

        {/* Trending Anime Carousel */}
        <AnimeCarousel
          title="Trending Anime"
          subtitle="Top viewed and engaged series this season"
          animeList={trendingData.media}
          viewAllHref="/trending"
          showRank={true}
        />

        {/* Hollywood & Cinema Blockbusters */}
        <MediaCarousel
          title="Cinema & Hollywood Movies"
          subtitle="Blockbuster releases, box-office hits, and top-rated feature films"
          mediaList={cinemaMoviesData.results}
          viewAllHref="/movies"
          type="movie"
        />

        {/* Popular TV Series */}
        <MediaCarousel
          title="Binge-Worthy TV Series"
          subtitle="Multi-season dramas, thrilling adventures, and acclaimed television shows"
          mediaList={tvSeriesData.results}
          viewAllHref="/tv"
          type="tv"
        />

        {/* Featured Anime Movies Section */}
        <AnimeCarousel
          title="Anime Feature Films"
          subtitle="Cinematic theatrical masterpieces, blockbuster releases, and award-winning anime films"
          animeList={animeMoviesData.media}
          viewAllHref="/movies"
        />

        {/* Recently Updated / Airing Now */}
        <AnimeCarousel
          title="Recently Updated Anime"
          subtitle="Latest episode drops and actively airing simulcasts"
          animeList={recentlyUpdated}
          viewAllHref="/explore?status=RELEASING"
        />

        {/* Browse By Genre Chips */}
        <GenreChips />

        {/* All-Time Popular Anime */}
        <AnimeCarousel
          title="Popular All Time Anime"
          subtitle="Critically acclaimed anime masterpieces beloved across the globe"
          animeList={popularData.media}
          viewAllHref="/explore?sort=POPULARITY_DESC"
        />
      </div>
    </div>
  );
}
