import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Yugito Cinema — Anime, Movies & TV Series Streaming",
  description:
    "Discover, track, and stream anime, movies, and TV series in 1080p FHD with 24/7 channels, multi-audio dub/sub, and direct download.",
  keywords: ["anime", "movies", "tv series", "streaming", "yugito", "watch anime", "streambert"],
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#070b16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-yugito-bg text-yugito-text flex flex-col overflow-x-hidden">
        <Navbar />
        <main className="flex-grow pb-16 md:pb-0">{children}</main>
        <MobileBottomNav />
        <Footer />
      </body>
    </html>
  );
}
