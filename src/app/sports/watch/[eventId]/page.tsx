import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import SportsWatchClient from "./SportsWatchClient";
import {
  fetchLiveSportsEvents,
  getSportsEventById,
  SPORTS_LIVE_CHANNELS,
  SportsEvent,
} from "@/lib/sports";

interface SportsWatchPageProps {
  params: { eventId: string };
}

export async function generateMetadata({ params }: SportsWatchPageProps): Promise<Metadata> {
  const { eventId } = params;

  if (eventId.startsWith("channel-")) {
    const channelId = eventId.replace("channel-", "");
    const channel = SPORTS_LIVE_CHANNELS.find((c) => c.id === channelId);
    return {
      title: channel ? `${channel.name} Live Broadcast | Yuyu Cinema` : "Live Sports Channel",
      description: channel?.description || "Watch 24/7 live sports television.",
    };
  }

  const event = await getSportsEventById(eventId);
  if (!event) {
    return { title: "Sports Live Stream | Yuyu Cinema" };
  }

  return {
    title: `${event.homeTeam.name} vs ${event.awayTeam.name} Live Stream | ${event.competition}`,
    description: `Stream ${event.homeTeam.name} vs ${event.awayTeam.name} live in 1080p FHD with real-time score tracking.`,
  };
}

export default async function SportsWatchPage({ params }: SportsWatchPageProps) {
  const { eventId } = params;
  const allEvents = await fetchLiveSportsEvents();

  // If this is a 24/7 TV channel stream
  if (eventId.startsWith("channel-")) {
    const channelId = eventId.replace("channel-", "");
    const channel = SPORTS_LIVE_CHANNELS.find((c) => c.id === channelId) || SPORTS_LIVE_CHANNELS[0];

    const channelEvent: SportsEvent = {
      id: `channel-${channel.id}`,
      sport: (channel.sport as any) || "other",
      competition: "24/7 Sports Television",
      homeTeam: { name: channel.name, logo: channel.logo },
      awayTeam: { name: channel.callsign },
      status: "LIVE",
      statusText: "ON AIR",
      startTime: new Date().toISOString(),
      streams: [
        {
          id: "channel-primary",
          name: "Server 1 (Live Satellite Feed)",
          url: channel.streamUrl,
          type: channel.type,
          quality: "1080p FHD Live",
          isOfficial: true,
        },
        {
          id: "channel-backup",
          name: "Server 2 (Fox Sports News Live)",
          url: "https://skynewsau-live-premium.akamaized.net/hls/live/2105307/foxsportsnews/live_1080p.m3u8",
          type: "hls",
          quality: "1080p FHD Feed",
          isOfficial: true,
        },
      ],
    };

    return <SportsWatchClient event={channelEvent} relatedEvents={allEvents.slice(0, 6)} />;
  }

  const event = await getSportsEventById(eventId);
  if (!event) {
    notFound();
  }

  const related = allEvents.filter((e) => e.id !== event.id).slice(0, 6);

  return <SportsWatchClient event={event} relatedEvents={related} />;
}
