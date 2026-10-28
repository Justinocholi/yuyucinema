export interface AnimeTitle {
  romaji?: string;
  english?: string;
  native?: string;
  userPreferred?: string;
}

export interface AnimeCoverImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
  color?: string;
}

export interface NextAiringEpisode {
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

export interface Studio {
  name: string;
  isAnimationStudio: boolean;
}

export interface AnimeRelation {
  id: number;
  relationType?: string;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  format: string;
  type: string;
  status: string;
}

export interface AnimeRecommendation {
  id: number;
  mediaRecommendation?: {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCoverImage;
    bannerImage?: string;
    format?: string;
    averageScore?: number;
    episodes?: number;
  };
}

export interface Anime {
  id: number;
  idMal?: number;
  title: AnimeTitle;
  description?: string;
  coverImage: AnimeCoverImage;
  bannerImage?: string;
  format?: string;
  status?: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
  episodes?: number;
  duration?: number;
  season?: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  seasonYear?: number;
  averageScore?: number;
  popularity?: number;
  genres: string[];
  studios?: {
    nodes: Studio[];
  };
  nextAiringEpisode?: NextAiringEpisode;
  relations?: {
    edges: Array<{
      relationType: string;
      node: AnimeRelation;
    }>;
  };
  recommendations?: {
    nodes: AnimeRecommendation[];
  };
  synonyms?: string[];
}

export interface EpisodeInfo {
  id: string; // e.g. "watch/anizone/16498/sub/anizone-1" or "1"
  number: number;
  sourceNumber?: number;
  title?: string;
  description?: string;
  image?: string;
  airDate?: string;
  duration?: number;
  filler?: boolean;
  audio?: "sub" | "dub";
}

export interface SubtitleTrack {
  url: string;
  label: string;
  srclang?: string;
  format?: string;
  default?: boolean;
}

export interface StreamSource {
  url: string;
  rawUrl?: string;
  type: "hls" | "mp4" | "embed";
  server: string;
  quality?: string;
  subtitles?: SubtitleTrack[];
  storyboard?: string;
  chapters?: string;
  priority?: number;
  isActive?: boolean;
  audio?: "sub" | "dub";
  headers?: Record<string, string>;
  skip?: {
    intro?: { startTime: number; endTime: number };
    outro?: { startTime: number; endTime: number };
  };
}

export interface WatchHistoryItem {
  animeId: number;
  animeTitle: string;
  animeCover: string;
  animeBanner?: string;
  episodeNumber: number;
  episodeTitle?: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  updatedAt: number;
}

export type WatchlistStatus = "watching" | "planning" | "completed" | "dropped";

export interface WatchlistItem {
  animeId: number;
  animeTitle: string;
  animeCover: string;
  animeBanner?: string;
  format?: string;
  totalEpisodes?: number;
  currentEpisode?: number;
  status: WatchlistStatus;
  score?: number;
  updatedAt: number;
}

export interface ScheduleDay {
  dayName: string;
  dateStr: string;
  timestamp: number;
  items: Array<{
    id: number;
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
    media: Anime;
  }>;
}
