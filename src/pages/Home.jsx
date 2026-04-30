import { useState, useEffect, useCallback, useRef } from "react";
import MovieCard from "../components/MovieCard";
import LoadingSpinner from "../components/LoadingSpinner";
import GenreFilter from "../components/GenreFilter";
import { useBrowse } from "../contexts/BrowseContext";
import { REGIONS } from "../components/BrowseDropdown";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { searchMovies } from "../services/api";
import "../css/Home.css";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// ── Smart Search keyword map ───────────────────────────────────────────────────
const SMART_KEYWORDS = {
  anime: { type: "language", value: "ja" },
  bollywood: { type: "language", value: "hi" },
  hollywood: { type: "language", value: "en" },
  korean: { type: "language", value: "ko" },
  "k-drama": { type: "language", value: "ko" },
  kdrama: { type: "language", value: "ko" },
  hindi: { type: "language", value: "hi" },
  japanese: { type: "language", value: "ja" },
  action: { type: "genre", value: 28 },
  adventure: { type: "genre", value: 12 },
  animation: { type: "genre", value: 16 },
  comedy: { type: "genre", value: 35 },
  crime: { type: "genre", value: 80 },
  documentary: { type: "genre", value: 99 },
  drama: { type: "genre", value: 18 },
  fantasy: { type: "genre", value: 14 },
  horror: { type: "genre", value: 27 },
  mystery: { type: "genre", value: 9648 },
  romance: { type: "genre", value: 10749 },
  "sci-fi": { type: "genre", value: 878 },
  scifi: { type: "genre", value: 878 },
  thriller: { type: "genre", value: 53 },
  western: { type: "genre", value: 37 },
};

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchPopular = (page, sort = "popularity.desc") =>
  fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=${sort}&page=${page}`,
  ).then((r) => r.json());

const fetchByGenre = (genreId, page, sort = "popularity.desc") =>
  fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_genres=${genreId}&sort_by=${sort}&page=${page}`,
  ).then((r) => r.json());

const fetchByLanguage = (lang, page, sort = "popularity.desc") =>
  fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=${lang}&sort_by=${sort}&page=${page}`,
  ).then((r) => r.json());

const fetchGenres = () =>
  fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`).then(
    (r) => r.json(),
  );

// ── component ─────────────────────────────────────────────────────────────────
const Home = () => {
  // Browse state comes from context (controlled by NavBar)
  const { activeFilter, activeSort, applyBrowse, clearBrowse } = useBrowse();

  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [smartHint, setSmartHint] = useState("");
  const fetchingRef = useRef(false);

  useEffect(() => {
    fetchGenres()
      .then((data) => setGenres(data.genres ?? []))
      .catch(() => {});
  }, []);

  // Reset movies when any filter changes
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    fetchingRef.current = false;
  }, [selectedGenre, activeFilter, activeSort]);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      let data;
      if (activeFilter?.type === "language")
        data = await fetchByLanguage(activeFilter.value, page, activeSort);
      else if (activeFilter?.type === "genre")
        data = await fetchByGenre(activeFilter.value, page, activeSort);
      else if (selectedGenre)
        data = await fetchByGenre(selectedGenre, page, activeSort);
      else data = await fetchPopular(page, activeSort);

      setMovies((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...(data.results ?? []).filter((m) => !ids.has(m.id))];
      });
      setHasMore(page < (data.total_pages ?? 1));
      setPage((p) => p + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [page, hasMore, selectedGenre, activeFilter, activeSort]);

  useEffect(() => {
    if (movies.length === 0 && hasMore && !isSearching) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies]);

  const handleSentinel = useCallback(() => {
    if (!isSearching) loadMore();
  }, [isSearching, loadMore]);

  const sentinelRef = useInfiniteScroll(
    handleSentinel,
    !isSearching && hasMore && !loading,
  );

  const runSearch = async (q) => {
    setIsSearching(true);
    setSearchLoading(true);
    try {
      const { results } = await searchMovies(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Smart keyword detection + debounced search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      if (isSearching) handleClearSearch();
      return;
    }

    const match = SMART_KEYWORDS[q.toLowerCase()];
    if (match) {
      const regionLabel = REGIONS.find((r) => r.value === match.value)?.label;
      const genreLabel = genres.find((g) => g.id === match.value)?.name;
      setSmartHint(`Showing ${regionLabel ?? genreLabel ?? q} movies`);
      setIsSearching(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedGenre(null);
      applyBrowse(
        match.type === "language"
          ? { region: match.value, genre: null, sort: activeSort }
          : { genre: match.value, region: null, sort: activeSort },
      );
      return;
    }

    setSmartHint("");
    setIsSearching(true);
    setSearchLoading(true);
    const timer = setTimeout(() => runSearch(q), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (!smartHint) return;
    const t = setTimeout(() => setSmartHint(""), 3000);
    return () => clearTimeout(t);
  }, [smartHint]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      handleClearSearch();
      return;
    }
    if (!SMART_KEYWORDS[q.toLowerCase()]) runSearch(q);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setSmartHint("");
  };

  const handleGenreSelect = (genreId) => {
    if (isSearching) handleClearSearch();
    clearBrowse(); // clear navbar browse filter when using genre pills
    setSelectedGenre(genreId);
  };

  const displayMovies = isSearching ? searchResults : movies;
  const showEmpty = isSearching && !searchLoading && searchResults.length === 0;

  const heading = isSearching
    ? `Results for "${searchQuery}"`
    : activeFilter?.type === "language"
      ? `${REGIONS.find((r) => r.value === activeFilter.value)?.label ?? ""} Movies`
      : activeFilter?.type === "genre"
        ? `${genres.find((g) => g.id === activeFilter.value)?.name ?? ""} Movies`
        : selectedGenre
          ? `${genres.find((g) => g.id === selectedGenre)?.name ?? ""} Movies`
          : "Popular Movies";

  return (
    <div className="home-page">
      {/* Search bar */}
      <section className="home-search">
        <form onSubmit={handleSearch} className="home-search__form">
          <input
            type="text"
            placeholder='Search movies or type "Anime", "Bollywood"…'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="home-search__input"
          />
          <button type="submit" className="home-search__btn">
            Search
          </button>
          {isSearching && (
            <button
              type="button"
              className="home-search__clear"
              onClick={handleClearSearch}
            >
              ✕ Clear
            </button>
          )}
        </form>
        {smartHint && <p className="home-smart-hint">✦ {smartHint}</p>}
      </section>

      {!isSearching && (
        <GenreFilter
          genres={genres}
          selectedGenre={activeFilter ? null : selectedGenre}
          onSelect={handleGenreSelect}
        />
      )}

      <h2 className="home-heading">{heading}</h2>
      {error && <p className="home-error">Failed to load: {error}</p>}
      {showEmpty && (
        <p className="home-empty">No results for "{searchQuery}"</p>
      )}

      {displayMovies.length > 0 && (
        <div className="home-grid">
          {displayMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      {!isSearching && (
        <LoadingSpinner
          sentinelRef={sentinelRef}
          loading={loading}
          hasMore={hasMore}
        />
      )}
      {isSearching && searchLoading && (
        <LoadingSpinner sentinelRef={null} loading={true} hasMore={true} />
      )}
    </div>
  );
};

export default Home;
