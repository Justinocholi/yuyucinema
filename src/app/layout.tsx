import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Yugito — Anime, Movies & TV Shows Streaming",
  description:
    "Discover, track, and stream anime, movies, and TV series in 1080p FHD with live channels, multi-audio dub/sub, and direct download.",
  keywords: ["anime", "movies", "tv series", "streaming", "yugito", "watch anime", "streambert"],
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-yugito-bg text-yugito-text flex flex-col">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
