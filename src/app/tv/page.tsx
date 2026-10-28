import React from "react";
import { Metadata } from "next";
import { getTrendingTV } from "@/lib/tmdb";
import TVClient from "./TVClient";

export const metadata: Metadata = {
  title: "TV Series & Dramas - Yugito Cinema",
  description: "Stream full seasons and episodes of top television shows in 1080p FHD.",
};

export const revalidate = 300;

export default async function TVPage() {
  const trending = await getTrendingTV(1);
  return <TVClient initialSeries={trending.results} />;
}
