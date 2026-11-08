export interface TMDBMedia {
  id: number;
  title: string;
  originalTitle?: string;
  name?: string; // TV shows use name instead of title
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  mediaType: "movie" | "tv";
  voteAverage: number;
  voteCount: number;
  releaseDate?: string;
  firstAirDate?: string;
  genreIds?: number[];
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  recommendations?: TMDBMedia[];
  seasons?: Array<{
    id: number;
    name: string;
    overview: string;
    posterPath: string | null;
    seasonNumber: number;
    episodeCount: number;
  }>;
}

export interface TMDBPaginatedResult {
  results: TMDBMedia[];
  page: number;
  totalPages: number;
  totalResults: number;
}

const TMDB_API_KEY = process.env.TMDB_API_KEY || "844dba0bfd8f3a4f3799f6130ef9e335";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// In-memory cache for ultra-fast response and avoiding duplicate API calls
const tmdbCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function getTMDBImageUrl(path: string | null, size: "w500" | "original" = "w500"): string {
  if (!path) return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export const MOVIE_GENRES = [
  { id: 0, name: "All Genres" },
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
];

export const TV_GENRES = [
  { id: 0, name: "All Genres" },
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

function mapTMDBItem(item: any, type: "movie" | "tv" = "movie"): TMDBMedia {
  const isMovie = type === "movie" || item.media_type === "movie";
  return {
    id: item.id,
    title: item.title || item.name || "Untitled",
    originalTitle: item.original_title || item.original_name,
    name: item.name,
    overview: item.overview || "No synopsis available.",
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    mediaType: isMovie ? "movie" : "tv",
    voteAverage: typeof item.vote_average === "number" ? Math.round(item.vote_average * 10) / 10 : 8.0,
    voteCount: item.vote_count || 0,
    releaseDate: item.release_date || item.first_air_date,
    firstAirDate: item.first_air_date,
    genreIds: item.genre_ids,
    genres: item.genres,
    runtime: item.runtime,
    numberOfSeasons: item.number_of_seasons,
    numberOfEpisodes: item.number_of_episodes,
    recommendations: (item.recommendations?.results || []).map((r: any) =>
      mapTMDBItem(r, isMovie ? "movie" : "tv")
    ),
    seasons: (item.seasons || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      overview: s.overview,
      posterPath: s.poster_path,
      seasonNumber: s.season_number,
      episodeCount: s.episode_count,
    })),
  };
}

async function cachedFetch(url: string): Promise<any> {
  const cached = tmdbCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB HTTP error ${res.status}`);
  const data = await res.json();
  tmdbCache.set(url, { data, timestamp: Date.now() });
  return data;
}

// 1. Fetch Trending Movies with Pagination
export async function getTrendingMovies(page = 1): Promise<TMDBPaginatedResult> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}`
    );
    return {
      results: (data.results || []).map((m: any) => mapTMDBItem(m, "movie")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_MOVIES, page: 1, totalPages: 1, totalResults: FALLBACK_MOVIES.length };
  }
}

// 2. Fetch Popular Movies with Pagination
export async function getPopularMovies(page = 1): Promise<TMDBPaginatedResult> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
    );
    return {
      results: (data.results || []).map((m: any) => mapTMDBItem(m, "movie")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_MOVIES, page: 1, totalPages: 1, totalResults: FALLBACK_MOVIES.length };
  }
}

// 3. Fetch Top Rated Movies with Pagination
export async function getTopRatedMovies(page = 1): Promise<TMDBPaginatedResult> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}`
    );
    return {
      results: (data.results || []).map((m: any) => mapTMDBItem(m, "movie")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_MOVIES, page: 1, totalPages: 1, totalResults: FALLBACK_MOVIES.length };
  }
}

// 4. Fetch Now Playing / In Theaters Movies with Pagination
export async function getNowPlayingMovies(page = 1): Promise<TMDBPaginatedResult> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&page=${page}`
    );
    return {
      results: (data.results || []).map((m: any) => mapTMDBItem(m, "movie")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_MOVIES, page: 1, totalPages: 1, totalResults: FALLBACK_MOVIES.length };
  }
}

// 5. Discover Movies by Genre, Sort, and Year with Pagination
export async function discoverMovies({
  genreId,
  sortBy = "popularity.desc",
  year,
  page = 1,
}: {
  genreId?: number;
  sortBy?: string;
  year?: number;
  page?: number;
}): Promise<TMDBPaginatedResult> {
  try {
    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&sort_by=${sortBy}&vote_count.gte=30`;
    if (genreId && genreId > 0) url += `&with_genres=${genreId}`;
    if (year) url += `&primary_release_year=${year}`;

    const data = await cachedFetch(url);
    return {
      results: (data.results || []).map((m: any) => mapTMDBItem(m, "movie")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_MOVIES, page: 1, totalPages: 1, totalResults: FALLBACK_MOVIES.length };
  }
}

// 6. Fetch Movie Details
export async function getMovieDetails(id: number): Promise<TMDBMedia | null> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,recommendations`
    );
    return mapTMDBItem(data, "movie");
  } catch {
    return FALLBACK_MOVIES.find((m) => m.id === id) || null;
  }
}

// 6b. Fetch Movie Recommendations & Similar Titles by Genre
export async function getMovieRecommendations(
  id: number,
  genreIds?: number[],
  limit = 12
): Promise<TMDBMedia[]> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/movie/${id}/recommendations?api_key=${TMDB_API_KEY}&page=1`
    );
    let results = (data.results || []).map((m: any) => mapTMDBItem(m, "movie"));

    if (results.length < 6) {
      try {
        const simData = await cachedFetch(
          `${TMDB_BASE_URL}/movie/${id}/similar?api_key=${TMDB_API_KEY}&page=1`
        );
        const simResults = (simData.results || []).map((m: any) => mapTMDBItem(m, "movie"));
        results = [
          ...results,
          ...simResults.filter((s: TMDBMedia) => !results.some((r: TMDBMedia) => r.id === s.id)),
        ];
      } catch {}
    }

    if (results.length < 6 && genreIds && genreIds.length > 0) {
      try {
        const genreId = genreIds[0];
        const discData = await cachedFetch(
          `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=1`
        );
        const discResults = (discData.results || []).map((m: any) => mapTMDBItem(m, "movie"));
        results = [
          ...results,
          ...discResults.filter(
            (s: TMDBMedia) => s.id !== id && !results.some((r: TMDBMedia) => r.id === s.id)
          ),
        ];
      } catch {}
    }

    return results.slice(0, limit);
  } catch {
    return FALLBACK_MOVIES.filter((m) => m.id !== id).slice(0, limit);
  }
}

// 7. Fetch Trending TV Series with Pagination
export async function getTrendingTV(page = 1): Promise<TMDBPaginatedResult> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&page=${page}`
    );
    return {
      results: (data.results || []).map((t: any) => mapTMDBItem(t, "tv")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_TV, page: 1, totalPages: 1, totalResults: FALLBACK_TV.length };
  }
}

// 8. Fetch Popular TV Series with Pagination
export async function getPopularTV(page = 1): Promise<TMDBPaginatedResult> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=${page}`
    );
    return {
      results: (data.results || []).map((t: any) => mapTMDBItem(t, "tv")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_TV, page: 1, totalPages: 1, totalResults: FALLBACK_TV.length };
  }
}

// 9. Fetch Top Rated TV Series with Pagination
export async function getTopRatedTV(page = 1): Promise<TMDBPaginatedResult> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}&page=${page}`
    );
    return {
      results: (data.results || []).map((t: any) => mapTMDBItem(t, "tv")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_TV, page: 1, totalPages: 1, totalResults: FALLBACK_TV.length };
  }
}

// 10. Fetch On The Air / Airing Today TV Series with Pagination
export async function getOnTheAirTV(page = 1): Promise<TMDBPaginatedResult> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}&page=${page}`
    );
    return {
      results: (data.results || []).map((t: any) => mapTMDBItem(t, "tv")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_TV, page: 1, totalPages: 1, totalResults: FALLBACK_TV.length };
  }
}

// 11. Discover TV by Genre, Sort, and Year with Pagination
export async function discoverTV({
  genreId,
  sortBy = "popularity.desc",
  year,
  page = 1,
}: {
  genreId?: number;
  sortBy?: string;
  year?: number;
  page?: number;
}): Promise<TMDBPaginatedResult> {
  try {
    let url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&page=${page}&sort_by=${sortBy}&vote_count.gte=30`;
    if (genreId && genreId > 0) url += `&with_genres=${genreId}`;
    if (year) url += `&first_air_date_year=${year}`;

    const data = await cachedFetch(url);
    return {
      results: (data.results || []).map((t: any) => mapTMDBItem(t, "tv")),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: FALLBACK_TV, page: 1, totalPages: 1, totalResults: FALLBACK_TV.length };
  }
}

// 12. Fetch TV Series Details (with seasons)
export async function getTVDetails(id: number): Promise<TMDBMedia | null> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,recommendations`
    );
    return mapTMDBItem(data, "tv");
  } catch {
    return FALLBACK_TV.find((t) => t.id === id) || null;
  }
}

// 12b. Fetch TV Show Recommendations & Similar Titles by Genre
export async function getTVRecommendations(
  id: number,
  genreIds?: number[],
  limit = 12
): Promise<TMDBMedia[]> {
  try {
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/tv/${id}/recommendations?api_key=${TMDB_API_KEY}&page=1`
    );
    let results = (data.results || []).map((t: any) => mapTMDBItem(t, "tv"));

    if (results.length < 6) {
      try {
        const simData = await cachedFetch(
          `${TMDB_BASE_URL}/tv/${id}/similar?api_key=${TMDB_API_KEY}&page=1`
        );
        const simResults = (simData.results || []).map((t: any) => mapTMDBItem(t, "tv"));
        results = [
          ...results,
          ...simResults.filter((s: TMDBMedia) => !results.some((r: TMDBMedia) => r.id === s.id)),
        ];
      } catch {}
    }

    if (results.length < 6 && genreIds && genreIds.length > 0) {
      try {
        const genreId = genreIds[0];
        const discData = await cachedFetch(
          `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=1`
        );
        const discResults = (discData.results || []).map((t: any) => mapTMDBItem(t, "tv"));
        results = [
          ...results,
          ...discResults.filter(
            (s: TMDBMedia) => s.id !== id && !results.some((r: TMDBMedia) => r.id === s.id)
          ),
        ];
      } catch {}
    }

    return results.slice(0, limit);
  } catch {
    return FALLBACK_TV.filter((t) => t.id !== id).slice(0, limit);
  }
}

// 13. Search Movies and TV Shows with Pagination
export async function searchTMDB(
  query: string,
  type: "movie" | "tv" | "multi" = "multi",
  page = 1
): Promise<TMDBPaginatedResult> {
  if (!query.trim()) {
    if (type === "tv") return getTrendingTV(page);
    return getTrendingMovies(page);
  }

  try {
    const endpoint = type === "multi" ? "search/multi" : type === "movie" ? "search/movie" : "search/tv";
    const data = await cachedFetch(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );
    const filtered = (data.results || []).filter(
      (item: any) =>
        (item.media_type === "movie" || item.media_type === "tv" || type !== "multi") &&
        (item.poster_path || item.backdrop_path)
    );
    return {
      results: filtered.map((item: any) => mapTMDBItem(item, item.media_type || type)),
      page,
      totalPages: Math.min(data.total_pages || 1, 500),
      totalResults: data.total_results || 0,
    };
  } catch {
    return { results: [], page: 1, totalPages: 0, totalResults: 0 };
  }
}

// ── Curated Fallback Blockbusters ───────────────────────────────────────────
const FALLBACK_MOVIES: TMDBMedia[] = [
  {
    id: 693134,
    title: "Dune: Part Two",
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    posterPath: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropPath: "/xOMo8BRK7PfcJv9JCnx7s520b22.jpg",
    mediaType: "movie",
    voteAverage: 8.5,
    voteCount: 4200,
    releaseDate: "2024-03-01",
    runtime: 166,
  },
  {
    id: 533535,
    title: "Deadpool & Wolverine",
    overview: "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary behind him, until the TVA recruits him for a crisis.",
    posterPath: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdropPath: "/yDHYTjA3R0ne8e49rNZ23Gne060.jpg",
    mediaType: "movie",
    voteAverage: 7.7,
    voteCount: 3800,
    releaseDate: "2024-07-26",
    runtime: 128,
  },
  {
    id: 872585,
    title: "Oppenheimer",
    overview: "The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.",
    posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropPath: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    mediaType: "movie",
    voteAverage: 8.1,
    voteCount: 8900,
    releaseDate: "2023-07-21",
    runtime: 181,
  },
  {
    id: 157336,
    title: "Interstellar",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdropPath: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    mediaType: "movie",
    voteAverage: 8.4,
    voteCount: 34500,
    releaseDate: "2014-11-07",
    runtime: 169,
  },
  {
    id: 27205,
    title: "Inception",
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life.",
    posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdropPath: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    mediaType: "movie",
    voteAverage: 8.4,
    voteCount: 36000,
    releaseDate: "2010-07-16",
    runtime: 148,
  },
  {
    id: 155,
    title: "The Dark Knight",
    overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent against the Joker.",
    posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropPath: "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    mediaType: "movie",
    voteAverage: 8.5,
    voteCount: 32000,
    releaseDate: "2008-07-18",
    runtime: 152,
  },
];

const FALLBACK_TV: TMDBMedia[] = [
  {
    id: 1396,
    title: "Breaking Bad",
    name: "Breaking Bad",
    overview: "Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and decides to enter the dangerous world of drugs to secure his family's future.",
    posterPath: "/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    backdropPath: "/9faGSFi5jam6pDWGNd0p8J2qPtZ.jpg",
    mediaType: "tv",
    voteAverage: 8.9,
    voteCount: 14000,
    firstAirDate: "2008-01-20",
    numberOfSeasons: 5,
    numberOfEpisodes: 62,
  },
  {
    id: 66732,
    title: "Stranger Things",
    name: "Stranger Things",
    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    posterPath: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdropPath: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    mediaType: "tv",
    voteAverage: 8.6,
    voteCount: 17000,
    firstAirDate: "2016-07-15",
    numberOfSeasons: 4,
    numberOfEpisodes: 34,
  },
  {
    id: 100088,
    title: "The Last of Us",
    name: "The Last of Us",
    overview: "Twenty years after modern civilization has been destroyed, Joel is hired to smuggle Ellie out of an oppressive quarantine zone.",
    posterPath: "/uKvVjHNqB5VmOrdxqAt2V7JMrRI.jpg",
    backdropPath: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg",
    mediaType: "tv",
    voteAverage: 8.6,
    voteCount: 5200,
    firstAirDate: "2023-01-15",
    numberOfSeasons: 1,
    numberOfEpisodes: 9,
  },
  {
    id: 76479,
    title: "The Boys",
    name: "The Boys",
    overview: "A fun and irreverent take on what happens when superheroes abuse their superpowers rather than use them for good.",
    posterPath: "/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg",
    backdropPath: "/7cqKGQMnADggap2VOpR9Cu3U4jH.jpg",
    mediaType: "tv",
    voteAverage: 8.4,
    voteCount: 9800,
    firstAirDate: "2019-07-26",
    numberOfSeasons: 4,
    numberOfEpisodes: 32,
  },
  {
    id: 126308,
    title: "Shōgun",
    name: "Shōgun",
    overview: "In Japan in the year 1600, Lord Yoshii Toranaga is fighting for his life as his enemies on the Council of Regents unite against him.",
    posterPath: "/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg",
    backdropPath: "/yihNYx97m0R4xX7u9aE6xU9mYqB.jpg",
    mediaType: "tv",
    voteAverage: 8.5,
    voteCount: 1200,
    firstAirDate: "2024-02-27",
    numberOfSeasons: 1,
    numberOfEpisodes: 10,
  },
];
