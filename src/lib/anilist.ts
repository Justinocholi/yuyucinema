import { Anime, ScheduleDay } from "@/types/anime";

const ANILIST_URL = "https://graphql.anilist.co";

async function anilistFetch<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 }, // Cache on server for 5 minutes
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`AniList GraphQL error (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || "AniList query error");
  }

  return json.data;
}

const ANIME_CARD_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
    userPreferred
  }
  description
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  format
  status
  episodes
  duration
  season
  seasonYear
  averageScore
  popularity
  genres
  nextAiringEpisode {
    episode
    airingAt
    timeUntilAiring
  }
`;

// 1. Get Featured Hero Anime (High quality trending / seasonal with banner)
export async function getFeaturedAnime(): Promise<Anime[]> {
  const query = `
    query {
      Page(page: 1, perPage: 8) {
        media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) {
          ${ANIME_CARD_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await anilistFetch<{ Page: { media: Anime[] } }>(query);
    // Filter to ones with bannerImage for cinematic hero display
    const withBanners = data.Page.media.filter((item) => !!item.bannerImage);
    return withBanners.length > 0 ? withBanners : data.Page.media;
  } catch (err) {
    console.error("Error fetching featured anime:", err);
    return [];
  }
}

// 2. Get Trending Anime
export async function getTrendingAnime(page = 1, perPage = 20): Promise<{ media: Anime[]; hasNextPage: boolean }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          total
        }
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${ANIME_CARD_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await anilistFetch<{ Page: { media: Anime[]; pageInfo: { hasNextPage: boolean } } }>(query, {
      page,
      perPage,
    });
    return {
      media: data.Page.media,
      hasNextPage: data.Page.pageInfo.hasNextPage,
    };
  } catch (err) {
    console.error("Error fetching trending anime:", err);
    return { media: [], hasNextPage: false };
  }
}

// 3. Get Popular Anime of All Time
export async function getPopularAnime(page = 1, perPage = 20): Promise<{ media: Anime[]; hasNextPage: boolean }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${ANIME_CARD_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await anilistFetch<{ Page: { media: Anime[]; pageInfo: { hasNextPage: boolean } } }>(query, {
      page,
      perPage,
    });
    return {
      media: data.Page.media,
      hasNextPage: data.Page.pageInfo.hasNextPage,
    };
  } catch (err) {
    console.error("Error fetching popular anime:", err);
    return { media: [], hasNextPage: false };
  }
}

// 3.5 Get Top Anime Movies
export async function getTopAnimeMovies(page = 1, perPage = 20): Promise<{ media: Anime[]; hasNextPage: boolean }> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, format: MOVIE, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) {
          ${ANIME_CARD_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await anilistFetch<{ Page: { media: Anime[]; pageInfo: { hasNextPage: boolean } } }>(query, {
      page,
      perPage,
    });
    return {
      media: data.Page.media,
      hasNextPage: data.Page.pageInfo.hasNextPage,
    };
  } catch (err) {
    console.error("Error fetching top anime movies:", err);
    return { media: [], hasNextPage: false };
  }
}

// 4. Get Recently Updated / Top Airing Anime
export async function getRecentlyUpdatedAnime(page = 1, perPage = 20): Promise<Anime[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: UPDATED_AT_DESC, isAdult: false) {
          ${ANIME_CARD_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await anilistFetch<{ Page: { media: Anime[] } }>(query, { page, perPage });
    return data.Page.media;
  } catch (err) {
    console.error("Error fetching recently updated anime:", err);
    return [];
  }
}

// 5. Get Anime Details by ID (with relations and recommendations)
export async function getAnimeDetails(id: number): Promise<Anime | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${ANIME_CARD_FIELDS}
        studios(isMain: true) {
          nodes {
            name
            isAnimationStudio
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
                userPreferred
              }
              coverImage {
                large
                medium
              }
              format
              type
              status
            }
          }
        }
        recommendations(perPage: 10, sort: RATING_DESC) {
          nodes {
            id
            mediaRecommendation {
              id
              title {
                romaji
                english
                userPreferred
              }
              coverImage {
                large
                medium
              }
              bannerImage
              format
              averageScore
              episodes
            }
          }
        }
      }
    }
  `;
  try {
    const data = await anilistFetch<{ Media: Anime }>(query, { id });
    return data.Media;
  } catch (err) {
    console.error(`Error fetching anime details for id ${id}:`, err);
    return null;
  }
}

// 6. Search Anime with Filters
export interface SearchFilters {
  query?: string;
  genre?: string;
  season?: string;
  seasonYear?: number;
  format?: string;
  status?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}

export async function searchAnime(filters: SearchFilters): Promise<{ media: Anime[]; hasNextPage: boolean; total: number }> {
  const {
    query,
    genre,
    season,
    seasonYear,
    format,
    status,
    sort = "TRENDING_DESC",
    page = 1,
    perPage = 24,
  } = filters;

  const variables: Record<string, any> = {
    page,
    perPage,
    sort: sort ? [sort] : ["TRENDING_DESC"],
    isAdult: false,
  };

  if (query && query.trim()) variables.search = query.trim();
  if (genre && genre !== "All") variables.genre = genre;
  if (season && season !== "All") variables.season = season;
  if (seasonYear) variables.seasonYear = seasonYear;
  if (format && format !== "All") variables.format = format;
  if (status && status !== "All") variables.status = status;

  const gql = `
    query (
      $page: Int,
      $perPage: Int,
      $search: String,
      $genre: String,
      $season: MediaSeason,
      $seasonYear: Int,
      $format: MediaFormat,
      $status: MediaStatus,
      $sort: [MediaSort]
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          hasNextPage
          currentPage
        }
        media(
          type: ANIME,
          search: $search,
          genre: $genre,
          season: $season,
          seasonYear: $seasonYear,
          format: $format,
          status: $status,
          sort: $sort,
          isAdult: false
        ) {
          ${ANIME_CARD_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await anilistFetch<{
      Page: { media: Anime[]; pageInfo: { total: number; hasNextPage: boolean } };
    }>(gql, variables);
    return {
      media: data.Page.media,
      hasNextPage: data.Page.pageInfo.hasNextPage,
      total: data.Page.pageInfo.total,
    };
  } catch (err) {
    console.error("Error searching anime:", err);
    return { media: [], hasNextPage: false, total: 0 };
  }
}

// 7. Get Airing Schedule (Grouped by days of the week)
export async function getWeeklySchedule(): Promise<ScheduleDay[]> {
  const now = Math.floor(Date.now() / 1000);
  // Start of current day (midnight UTC)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startTimestamp = Math.floor(today.getTime() / 1000);
  const endTimestamp = startTimestamp + 7 * 24 * 60 * 60; // 7 days

  const query = `
    query ($airingAt_greater: Int, $airingAt_lesser: Int) {
      Page(page: 1, perPage: 50) {
        airingSchedules(
          airingAt_greater: $airingAt_greater,
          airingAt_lesser: $airingAt_lesser,
          sort: TIME
        ) {
          id
          episode
          airingAt
          timeUntilAiring
          media {
            ${ANIME_CARD_FIELDS}
          }
        }
      }
    }
  `;

  try {
    const data = await anilistFetch<{
      Page: {
        airingSchedules: Array<{
          id: number;
          episode: number;
          airingAt: number;
          timeUntilAiring: number;
          media: Anime;
        }>;
      };
    }>(query, {
      airingAt_greater: startTimestamp,
      airingAt_lesser: endTimestamp,
    });

    const days: ScheduleDay[] = [];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dayStart = Math.floor(d.getTime() / 1000);
      const dayEnd = dayStart + 24 * 60 * 60;

      const itemsForDay = data.Page.airingSchedules.filter(
        (item) => item.airingAt >= dayStart && item.airingAt < dayEnd
      );

      days.push({
        dayName: i === 0 ? "Today" : dayNames[d.getDay()],
        dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        timestamp: dayStart,
        items: itemsForDay,
      });
    }

    return days;
  } catch (err) {
    console.error("Error fetching weekly schedule:", err);
    return [];
  }
}
