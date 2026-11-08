import React from "react";
import { Metadata } from "next";
import SportsClient from "./SportsClient";
import { fetchLiveSportsEvents, SPORTS_LIVE_CHANNELS } from "@/lib/sports";

export const metadata: Metadata = {
  title: "Live Sports Streaming | Yuyu Cinema",
  description:
    "Stream live football, basketball, tennis, Formula 1, and 24/7 sports broadcasting channels in 1080p FHD.",
};

export const revalidate = 60; // Refresh live sports scores every 60 seconds

export default async function SportsPage() {
  const initialEvents = await fetchLiveSportsEvents();

  return <SportsClient initialEvents={initialEvents} channels={SPORTS_LIVE_CHANNELS} />;
}
