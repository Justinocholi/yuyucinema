import { NextRequest, NextResponse } from "next/server";
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  discoverMovies,
  getTrendingTV,
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV,
  discoverTV,
  searchTMDB,
} from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") as "movie" | "tv") || "movie";
  const category = searchParams.get("category") || "trending";
  const genreIdStr = searchParams.get("genre");
  const genreId = genreIdStr ? parseInt(genreIdStr, 10) : undefined;
  const sort = searchParams.get("sort") || "popularity.desc";
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr, 10) : undefined;
  const query = searchParams.get("query") || "";
  const pageStr = searchParams.get("page") || "1";
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  try {
    // 1. Search query takes precedence if provided
    if (query.trim()) {
      const searchRes = await searchTMDB(query, type, page);
      return NextResponse.json(searchRes);
    }

    // 2. Discover by genre/year/sort if genre is specified
    if (genreId && genreId > 0) {
      if (type === "tv") {
        const tvDiscover = await discoverTV({ genreId, sortBy: sort, year, page });
        return NextResponse.json(tvDiscover);
      } else {
        const movieDiscover = await discoverMovies({ genreId, sortBy: sort, year, page });
        return NextResponse.json(movieDiscover);
      }
    }

    // 3. Category-based listings
    if (type === "tv") {
      switch (category) {
        case "popular": {
          const res = await getPopularTV(page);
          return NextResponse.json(res);
        }
        case "top_rated": {
          const res = await getTopRatedTV(page);
          return NextResponse.json(res);
        }
        case "airing":
        case "on_the_air": {
          const res = await getOnTheAirTV(page);
          return NextResponse.json(res);
        }
        case "trending":
        default: {
          const res = await getTrendingTV(page);
          return NextResponse.json(res);
        }
      }
    } else {
      // Movie categories
      switch (category) {
        case "popular": {
          const res = await getPopularMovies(page);
          return NextResponse.json(res);
        }
        case "top_rated": {
          const res = await getTopRatedMovies(page);
          return NextResponse.json(res);
        }
        case "now_playing":
        case "theaters": {
          const res = await getNowPlayingMovies(page);
          return NextResponse.json(res);
        }
        case "trending":
        default: {
          const res = await getTrendingMovies(page);
          return NextResponse.json(res);
        }
      }
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load media catalogue", results: [], page, totalPages: 0, totalResults: 0 },
      { status: 500 }
    );
  }
}
