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
  seasons?: Array<{
    id: number;
    name: string;
    overview: string;
    posterPath: string | null;
    seasonNumber: number;
    episodeCount: number;
  }>;
}

const TMDB_API_KEY = process.env.TMDB_API_KEY || "844dba0bfd8f3a4f3799f6130ef9e335";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function getTMDBImageUrl(path: string | null, size: "w500" | "original" = "w500"): string {
  if (!path) return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

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

// 1. Fetch Trending Movies
export async function getTrendingMovies(page = 1): Promise<{ results: TMDBMedia[]; totalPages: number }> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("TMDB trending error");
    const data = await res.json();
    return {
      results: (data.results || []).map((m: any) => mapTMDBItem(m, "movie")),
      totalPages: data.total_pages || 1,
    };
  } catch (err) {
    return { results: FALLBACK_MOVIES, totalPages: 1 };
  }
}

// 2. Fetch Popular Movies
export async function getPopularMovies(page = 1): Promise<{ results: TMDBMedia[]; totalPages: number }> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("TMDB popular error");
    const data = await res.json();
    return {
      results: (data.results || []).map((m: any) => mapTMDBItem(m, "movie")),
      totalPages: data.total_pages || 1,
    };
  } catch (err) {
    return { results: FALLBACK_MOVIES, totalPages: 1 };
  }
}

// 3. Fetch Movie Details
export async function getMovieDetails(id: number): Promise<TMDBMedia | null> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,recommendations`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return FALLBACK_MOVIES.find((m) => m.id === id) || null;
    const data = await res.json();
    return mapTMDBItem(data, "movie");
  } catch {
    return FALLBACK_MOVIES.find((m) => m.id === id) || null;
  }
}

// 4. Fetch Trending TV Series
export async function getTrendingTV(page = 1): Promise<{ results: TMDBMedia[]; totalPages: number }> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&page=${page}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("TMDB TV error");
    const data = await res.json();
    return {
      results: (data.results || []).map((t: any) => mapTMDBItem(t, "tv")),
      totalPages: data.total_pages || 1,
    };
  } catch (err) {
    return { results: FALLBACK_TV, totalPages: 1 };
  }
}

// 5. Fetch Popular TV Series
export async function getPopularTV(page = 1): Promise<{ results: TMDBMedia[]; totalPages: number }> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=${page}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("TMDB TV popular error");
    const data = await res.json();
    return {
      results: (data.results || []).map((t: any) => mapTMDBItem(t, "tv")),
      totalPages: data.total_pages || 1,
    };
  } catch (err) {
    return { results: FALLBACK_TV, totalPages: 1 };
  }
}

// 6. Fetch TV Series Details (with seasons)
export async function getTVDetails(id: number): Promise<TMDBMedia | null> {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,recommendations`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return FALLBACK_TV.find((t) => t.id === id) || null;
    const data = await res.json();
    return mapTMDBItem(data, "tv");
  } catch {
    return FALLBACK_TV.find((t) => t.id === id) || null;
  }
}

// 7. Search Movies and TV Shows
export async function searchTMDB(
  query: string,
  type: "movie" | "tv" | "multi" = "multi",
  page = 1
): Promise<{ results: TMDBMedia[]; totalPages: number }> {
  if (!query.trim()) {
    if (type === "tv") return getTrendingTV(page);
    return getTrendingMovies(page);
  }

  try {
    const endpoint = type === "multi" ? "search/multi" : type === "movie" ? "search/movie" : "search/tv";
    const res = await fetch(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error("TMDB search error");
    const data = await res.json();
    const filtered = (data.results || []).filter(
      (item: any) => (item.media_type === "movie" || item.media_type === "tv" || type !== "multi") && (item.poster_path || item.backdrop_path)
    );
    return {
      results: filtered.map((item: any) => mapTMDBItem(item, item.media_type || type)),
      totalPages: data.total_pages || 1,
    };
  } catch {
    return { results: [], totalPages: 0 };
  }
}

// ── Built-in Curated Fallback Blockbusters ────────────────────────────────────
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
