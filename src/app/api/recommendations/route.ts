import { NextRequest, NextResponse } from "next/server";
import {
  getMovieRecommendations,
  getTVRecommendations,
  discoverMovies,
  discoverTV,
  MOVIE_GENRES,
  TV_GENRES,
} from "@/lib/tmdb";
import { getAnimeRecommendationsByGenre } from "@/lib/anilist";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "movie"; // 'movie' | 'tv' | 'anime'
    const id = parseInt(searchParams.get("id") || "0", 10);
    const genre = searchParams.get("genre") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 24);

    if (type === "anime") {
      const results = await getAnimeRecommendationsByGenre(
        genre || "All",
        id || undefined,
        limit
      );
      return NextResponse.json({ results });
    }

    if (type === "movie") {
      if (genre && genre !== "All") {
        const found = MOVIE_GENRES.find(
          (g) => g.name.toLowerCase() === genre.toLowerCase()
        );
        if (found && found.id > 0) {
          const disc = await discoverMovies({
            genreId: found.id,
            sortBy: "popularity.desc",
            page: 1,
          });
          const filtered = (disc.results || []).filter((m) => m.id !== id).slice(0, limit);
          return NextResponse.json({ results: filtered });
        }
      }

      // Default curated recommendations
      const results = await getMovieRecommendations(id, undefined, limit);
      return NextResponse.json({ results });
    }

    if (type === "tv") {
      if (genre && genre !== "All") {
        const found = TV_GENRES.find(
          (g) => g.name.toLowerCase() === genre.toLowerCase() ||
                 g.name.toLowerCase().includes(genre.toLowerCase())
        );
        if (found && found.id > 0) {
          const disc = await discoverTV({
            genreId: found.id,
            sortBy: "popularity.desc",
            page: 1,
          });
          const filtered = (disc.results || []).filter((t) => t.id !== id).slice(0, limit);
          return NextResponse.json({ results: filtered });
        }
      }

      const results = await getTVRecommendations(id, undefined, limit);
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  } catch (err: any) {
    console.error("Recommendations API Error:", err);
    return NextResponse.json({ error: "Failed to fetch recommendations", results: [] }, { status: 500 });
  }
}
