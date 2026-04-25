import MovieCard from "../components/MovieCard";
import GenreFilter from "../components/GenreFilter";
import Pagination from "../components/Pagination";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  searchMovies,
  getPopularMovies,
  getMoviesByGenre,
} from "../services/api";
import "../css/Home.css";

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const modeRef = useRef("popular");
  const debounceRef = useRef(null);

  const fetchMovies = useCallback(async (mode, query, genreId, page) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (mode === "search") {
        result = await searchMovies(query, page);
      } else if (mode === "genre") {
        result = await getMoviesByGenre(genreId, page);
      } else {
        result = await getPopularMovies(page);
      }
      setMovies(result.results);
      setTotalPages(Math.min(result.totalPages, 500));
    } catch (err) {
      console.error(err);
      setError("Failed to load movies. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies("popular", "", null, 1);
  }, [fetchMovies]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim()) {
      modeRef.current = "search";
      setSelectedGenre(null);
      debounceRef.current = setTimeout(() => {
        setCurrentPage(1);
        fetchMovies("search", searchQuery.trim(), null, 1);
      }, 500);
    } else if (modeRef.current === "search") {
      modeRef.current = "popular";
      setCurrentPage(1);
      fetchMovies("popular", "", null, 1);
    }
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, fetchMovies]);

  const handleGenreSelect = (genreId) => {
    if (genreId === null) {
      modeRef.current = "popular";
      setSelectedGenre(null);
      setSearchQuery("");
      setCurrentPage(1);
      fetchMovies("popular", "", null, 1);
    } else {
      modeRef.current = "genre";
      setSelectedGenre(genreId);
      setSearchQuery("");
      setCurrentPage(1);
      fetchMovies("genre", "", genreId, 1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchMovies(modeRef.current, searchQuery.trim(), selectedGenre, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="home">
      {/* Search + Genre row */}
      <div className="search-wrapper">
        <div className="search-form">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search movies, actors, genres..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery("")}>✕</button>
          )}
        </div>
        <GenreFilter selectedGenre={selectedGenre} onGenreSelect={handleGenreSelect} />
      </div>

      {/* Section Header */}
      <div className="section-header">
        <h2 className="section-title">
          {searchQuery
            ? `Results for "${searchQuery}"`
            : selectedGenre
            ? "Genre Results"
            : "Popular Movies"}
        </h2>
        {!loading && <span className="movie-count">{movies.length} movies</span>}
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {loading ? (
        <div className="movies-grid">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-poster" />
              <div className="skeleton-info">
                <div className="skeleton-line long" />
                <div className="skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="no-results">
          <span className="no-results-icon">🎬</span>
          <p>No movies found. Try a different search or genre.</p>
        </div>
      ) : (
        <div className="movies-grid">
          {movies.map((movie) => (
            <MovieCard movie={movie} key={movie.id} />
          ))}
          {/* Ghost cards to fill last row */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`ghost-${i}`} className="ghost-card" />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default Home;
