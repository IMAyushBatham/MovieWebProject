import { useState, useEffect, useRef } from "react";
import { getGenres } from "../services/api";
import "../css/GenreFilter.css";

function GenreFilter({ selectedGenre, onGenreSelect }) {
  const [genres, setGenres] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    getGenres().then(setGenres).catch(console.error);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = genres.find((g) => g.id === selectedGenre);
  const label = selected ? selected.name : "All Genres";

  const handleSelect = (id) => {
    onGenreSelect(id);
    setOpen(false);
  };

  return (
    <div className="genre-dropdown-wrapper" ref={ref}>
      <button
        className={`genre-dropdown-btn ${selectedGenre ? "active" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="genre-icon">🎬</span>
        <span>{label}</span>
        <span className={`genre-arrow ${open ? "open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="genre-menu">
          <button
            className={`genre-option ${!selectedGenre ? "selected" : ""}`}
            onClick={() => handleSelect(null)}
          >
            All Genres
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              className={`genre-option ${selectedGenre === genre.id ? "selected" : ""}`}
              onClick={() => handleSelect(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default GenreFilter;
