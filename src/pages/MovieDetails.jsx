import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMovieDetails } from "../services/api";
import { useMovieContext } from "../contexts/MovieContext";
import "../css/MovieDetails.css";

const IMG_BASE = "https://image.tmdb.org/t/p/";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMovieDetails(id);
        setMovie(data);

        // Find official trailer
        const trailer = data.videos?.results?.find(
          (v) => v.type === "Trailer" && v.site === "YouTube"
        );
        if (trailer) setTrailerKey(trailer.key);
      } catch (err) {
        console.error(err);
        setError("Could not load movie details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="details-loading">
        <div className="spinner" />
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="details-error">
        <p>⚠️ {error}</p>
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Go Back
        </button>
      </div>
    );
  }

  if (!movie) return null;

  const favorite = isFavorite(movie.id);
  const cast = movie.credits?.cast?.slice(0, 8) || [];
  const releaseYear = movie.release_date?.split("-")[0];
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;
  const rating = movie.vote_average?.toFixed(1);

  const toggleFavorite = () => {
    if (favorite) removeFromFavorites(movie.id);
    else addToFavorites(movie);
  };

  return (
    <div className="movie-details">
      {/* Hero backdrop */}
      {movie.backdrop_path && (
        <div
          className="details-backdrop"
          style={{
            backgroundImage: `url(${IMG_BASE}w1280${movie.backdrop_path})`,
          }}
        >
          <div className="backdrop-overlay" />
        </div>
      )}

      <div className="details-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="details-main">
          {/* Poster */}
          <div className="details-poster">
            <img
              src={
                movie.poster_path
                  ? `${IMG_BASE}w500${movie.poster_path}`
                  : "https://via.placeholder.com/500x750?text=No+Image"
              }
              alt={movie.title}
            />
          </div>

          {/* Info */}
          <div className="details-info">
            <h1 className="details-title">{movie.title}</h1>

            {movie.tagline && (
              <p className="details-tagline">"{movie.tagline}"</p>
            )}

            <div className="details-meta">
              {releaseYear && <span className="meta-chip">{releaseYear}</span>}
              {runtime && <span className="meta-chip">{runtime}</span>}
              {rating && (
                <span className="meta-chip rating-chip">
                  ⭐ {rating} / 10
                </span>
              )}
              <span className="meta-chip">
                {movie.vote_count?.toLocaleString()} votes
              </span>
            </div>

            {/* Genres */}
            {movie.genres?.length > 0 && (
              <div className="details-genres">
                {movie.genres.map((g) => (
                  <span key={g.id} className="genre-tag">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div className="details-overview">
              <h3>Overview</h3>
              <p>{movie.overview || "No overview available."}</p>
            </div>

            {/* Actions */}
            <div className="details-actions">
              <button
                className={`fav-toggle-btn ${favorite ? "active" : ""}`}
                onClick={toggleFavorite}
              >
                {favorite ? "♥ In Favorites" : "♡ Add to Favorites"}
              </button>

              {trailerKey && (
                <button
                  className="trailer-btn"
                  onClick={() => setShowTrailer(true)}
                >
                  ▶ Watch Trailer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="details-cast">
            <h3>Top Cast</h3>
            <div className="cast-grid">
              {cast.map((member) => (
                <div key={member.id} className="cast-card">
                  <img
                    src={
                      member.profile_path
                        ? `${IMG_BASE}w185${member.profile_path}`
                        : "https://via.placeholder.com/185x278?text=N/A"
                    }
                    alt={member.name}
                  />
                  <p className="cast-name">{member.name}</p>
                  <p className="cast-character">{member.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <div className="trailer-modal" onClick={() => setShowTrailer(false)}>
          <div
            className="trailer-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowTrailer(false)}
            >
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Movie Trailer"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetails;
