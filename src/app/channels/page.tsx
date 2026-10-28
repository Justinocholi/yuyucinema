import React from "react";
import { Metadata } from "next";
import ChannelsClient from "./ChannelsClient";

export const metadata: Metadata = {
  title: "Live Anime Channels | Yugito",
  description:
    "Stream 24/7 continuous live anime TV channels, classic anime marathons, and broadcasts powered by Streambert.",
};

export default function ChannelsPage() {
  return <ChannelsClient />;
}
