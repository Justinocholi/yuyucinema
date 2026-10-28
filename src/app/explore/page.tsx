"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, X, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Anime } from "@/types/anime";
import { searchAnime } from "@/lib/anilist";
import AnimeGrid from "@/components/anime/AnimeGrid";

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

const FORMATS = ["All", "TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA"];
const STATUSES = ["All", "RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED"];
const SORTS = [
  { label: "Trending", value: "TRENDING_DESC" },
  { label: "Most Popular", value: "POPULARITY_DESC" },
  { label: "Highest Rated", value: "SCORE_DESC" },
  { label: "Newest Added", value: "UPDATED_AT_DESC" },
  { label: "Release Date", value: "START_DATE_DESC" },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialGenre = searchParams.get("genre") || "All";
  const initialFormat = searchParams.get("format") || "All";
  const initialStatus = searchParams.get("status") || "All";
  const initialSort = searchParams.get("sort") || "TRENDING_DESC";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [genre, setGenre] = useState(initialGenre);
  const [format, setFormat] = useState(initialFormat);
  const [status, setStatus] = useState(initialStatus);
  const [sort, setSort] = useState(initialSort);

  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search query changes by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search when filters or debounced query change
  useEffect(() => {
    let isCancelled = false;

    const doSearch = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const data = await searchAnime({
          query: debouncedQuery,
          genre,
          format,
          status,
          sort,
          perPage: 24,
        });

        if (!isCancelled) {
          setResults(data.media);
          setTotalCount(data.total);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    doSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, genre, format, status, sort]);

  const clearAllFilters = () => {
    setQuery("");
    setGenre("All");
    setFormat("All");
    setStatus("All");
    setSort("TRENDING_DESC");
  };

  const hasActiveFilters =
    query.trim() !== "" ||
    genre !== "All" ||
    format !== "All" ||
    status !== "All" ||
    sort !== "TRENDING_DESC";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Explore Anime
          </h1>
          <p className="text-xs sm:text-sm text-yugito-muted mt-1">
            Browse through titles, filter by format, genres, and release status
          </p>
        </div>

        {totalCount > 0 && !isLoading && (
          <div className="text-xs text-yugito-muted">
            Found <span className="text-white font-bold">{totalCount}</span> titles
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-yugito-card/90 border border-yugito-border rounded-2xl p-4 mb-8 space-y-4 shadow-yugito">
        {/* Search Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, character, or alternate name..."
            className="w-full bg-yugito-surface text-yugito-text placeholder-yugito-muted/60 text-sm px-4 py-3 pl-11 rounded-xl border border-yugito-border focus:border-yugito-accent focus:outline-none transition-all"
          />
          <Search className="w-5 h-5 text-yugito-muted absolute left-3.5" />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3.5 text-yugito-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Genre */}
          <div>
            <label className="block text-yugito-muted font-medium mb-1">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-yugito-surface text-yugito-text px-3 py-2 rounded-lg border border-yugito-border focus:border-yugito-accent focus:outline-none cursor-pointer"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-yugito-muted font-medium mb-1">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-yugito-surface text-yugito-text px-3 py-2 rounded-lg border border-yugito-border focus:border-yugito-accent focus:outline-none cursor-pointer"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f === "All" ? "All Formats" : f}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-yugito-muted font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-yugito-surface text-yugito-text px-3 py-2 rounded-lg border border-yugito-border focus:border-yugito-accent focus:outline-none cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Statuses" : s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-yugito-muted font-medium mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-yugito-surface text-yugito-text px-3 py-2 rounded-lg border border-yugito-border focus:border-yugito-accent focus:outline-none cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-yugito-border/50 text-xs">
            <span className="text-yugito-muted">Filters active</span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-yugito-accentLight hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {hasError ? (
        <div className="py-16 text-center bg-yugito-card/50 rounded-2xl border border-yugito-border p-8">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-base font-semibold text-white mb-1">Failed to load anime</h3>
          <p className="text-xs text-yugito-muted mb-4">
            Could not reach the catalog provider. Please try again.
          </p>
          <button
            type="button"
            onClick={() => setDebouncedQuery(query + " ")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yugito-accent text-white text-xs font-bold hover:bg-yugito-accentHover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        /* Results Grid with Skeletons and Empty State */
        <AnimeGrid
          animeList={results}
          isLoading={isLoading}
          skeletonCount={18}
          emptyMessage="No anime matched your search parameters. Try adjusting your query or filters."
        />
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="h-8 bg-yugito-card rounded w-48 mb-6 animate-pulse" />
          <div className="h-28 bg-yugito-card rounded-2xl mb-8 animate-pulse" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
