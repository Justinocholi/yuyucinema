import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Shield, Heart, Film, Clapperboard, Tv } from "lucide-react";

export default function Footer() {
  const genres = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Fantasy",
    "Romance",
    "Sci-Fi",
    "Supernatural",
    "Mystery",
    "Sports",
  ];

  return (
    <footer className="border-t border-sky-500/20 bg-[#070b16]/80 backdrop-blur-xl mt-20 pt-12 pb-16 text-sm text-yugito-muted shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-sky-400/50 shadow-md shadow-sky-500/20">
                <Image src="/logo.jpg" alt="Yugito" fill className="object-cover" />
              </div>
              <span className="text-lg font-black tracking-wider text-white">YUGITO</span>
            </Link>
            <p className="text-xs text-yugito-muted leading-relaxed">
              Ultra-modern anime, movies, and TV series streaming platform powered by Streambert & AniList. Ad-free 1080p FHD, multi-audio Dub & Sub, and instant downloads.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-300">
              <Sparkles className="w-3 h-3 text-sky-400" /> Streambert & AniList Engine
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">Anime Catalog</Link>
              </li>
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">Movies (Cinema & Anime)</Link>
              </li>
              <li>
                <Link href="/tv" className="hover:text-white transition-colors">TV Series</Link>
              </li>
              <li>
                <Link href="/channels" className="hover:text-white transition-colors">24/7 Live TV Channels</Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-white transition-colors">Trending Top 100+</Link>
              </li>
              <li>
                <Link href="/watchlist" className="hover:text-white transition-colors">Watchlist & Downloads</Link>
              </li>
            </ul>
          </div>

          {/* Genres */}
          <div className="md:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Popular Genres</h4>
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <Link
                  key={g}
                  href={`/explore?genre=${encodeURIComponent(g)}`}
                  className="px-2 py-1 rounded-md bg-[#101d36]/70 text-[11px] hover:text-white hover:bg-sky-500/20 transition-colors border border-sky-500/20"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal / Disclaimer */}
          <div className="space-y-2 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-400" /> Legal Notice
            </h4>
            <p className="text-[11px] text-yugito-subtle leading-relaxed">
              Yugito does not store or host any video media files on its servers. All anime and media metadata is retrieved through AniList & TMDB; streaming channels are resolved via community provider gateways.
            </p>
            <p className="text-[11px] text-yugito-subtle leading-relaxed">
              All trademarks and copyrights belong to their respective production committees and licensors.
            </p>
          </div>
        </div>

        <div className="border-t border-sky-500/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-yugito-subtle">
          <div>© {new Date().getFullYear()} Yugito Cinema. Crafted with dark blue glassmorphism.</div>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-500/30 text-sky-200 font-mono">/</kbd>
            <span>anywhere to search</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
