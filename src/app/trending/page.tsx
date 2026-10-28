import React from "react";
import { Metadata } from "next";
import { getTrendingAnime } from "@/lib/anilist";
import TrendingClient from "./TrendingClient";

export const metadata: Metadata = {
  title: "Trending Anime Top 100+ - Yugito Cinema",
  description: "Browse the top trending anime series, actively ranked by global stream counts and engagement.",
};

export const revalidate = 300;

export default async function TrendingPage() {
  const trending = await getTrendingAnime(1, 30);

  return (
    <TrendingClient
      initialTrending={trending.media}
      initialHasNext={trending.hasNextPage}
    />
  );
}
