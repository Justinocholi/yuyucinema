import React from "react";
import { Metadata } from "next";
import SportsAdminClient from "./SportsAdminClient";

export const metadata: Metadata = {
  title: "Sports Stream Administration | Yuyu Cinema",
  description: "Secure sports streaming source and live event management portal.",
};

export default function SportsAdminPage() {
  return <SportsAdminClient />;
}
