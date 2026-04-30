import { useEffect, useCallback, useState } from "react";
import "../css/ReviewsModal.css";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const AVATAR_BASE = "https://image.tmdb.org/t/p/w45";

const ReviewsModal = ({ movieId, movieTitle, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({}); // track "read more" per review

  // ── fetch reviews ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/movie/${movieId}/reviews?api_key=${API_KEY}&language=en-US`,
        );
        const data = await res.json();
        if (!cancelled) setReviews(data.results ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  // ── keyboard close ─────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── helpers ────────────────────────────────────────────────────────────────
  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  const getAvatar = (details) => {
    const path = details?.avatar_path ?? "";
    if (!path) return null;
    // TMDB sometimes prefixes gravatar URLs with a leading slash
    if (path.startsWith("/https")) return path.slice(1);
    return `${AVATAR_BASE}${path}`;
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const PREVIEW_LENGTH = 320;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="reviews-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Movie Reviews"
    >
      <div className="reviews-modal">
        {/* Header */}
        <div className="reviews-modal__header">
          <span className="reviews-modal__label">★ Reviews</span>
          <span className="reviews-modal__title">{movieTitle}</span>
          <button
            className="reviews-modal__close"
            onClick={onClose}
            aria-label="Close reviews"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="reviews-modal__body">
          {loading && (
            <div className="reviews-state">
              <span className="reviews-spinner" />
              Loading reviews…
            </div>
          )}

          {error && (
            <div className="reviews-state reviews-state--error">
              Failed to load reviews.
            </div>
          )}

          {!loading && !error && reviews.length === 0 && (
            <div className="reviews-state reviews-state--empty">
              No reviews yet for this title.
            </div>
          )}

          {!loading && !error && reviews.length > 0 && (
            <ul className="reviews-list">
              {reviews.map((review) => {
                const avatar = getAvatar(review.author_details);
                const rating = review.author_details?.rating;
                const isExpanded = expanded[review.id];
                const isLong = review.content.length > PREVIEW_LENGTH;
                const displayText =
                  isLong && !isExpanded
                    ? review.content.slice(0, PREVIEW_LENGTH) + "…"
                    : review.content;

                return (
                  <li key={review.id} className="review-card">
                    {/* Author row */}
                    <div className="review-card__author">
                      <div className="review-card__avatar">
                        {avatar ? (
                          <img src={avatar} alt={review.author} />
                        ) : (
                          <span>{getInitial(review.author)}</span>
                        )}
                      </div>
                      <div className="review-card__meta">
                        <span className="review-card__name">
                          {review.author}
                        </span>
                        <span className="review-card__date">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {rating != null && (
                        <span className="review-card__rating">
                          ⭐ {rating}/10
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <p className="review-card__content">{displayText}</p>

                    {isLong && (
                      <button
                        className="review-card__toggle"
                        onClick={() => toggleExpand(review.id)}
                      >
                        {isExpanded ? "Show less ▲" : "Read more ▼"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
