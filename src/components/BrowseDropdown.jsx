import { useState, useRef, useEffect } from "react";
import "../css/BrowseDropdown.css";

export const REGIONS = [
  { label: "Hollywood", type: "language", value: "en", flag: "🎬" },
  { label: "Bollywood", type: "language", value: "hi", flag: "🇮🇳" },
  { label: "Anime", type: "language", value: "ja", flag: "🎌" },
  { label: "Korean", type: "language", value: "ko", flag: "🇰🇷" },
];

export const SORT_OPTIONS = [
  { label: "Most Popular", value: "popularity.desc" },
  { label: "Top Rated", value: "vote_average.desc" },
  { label: "Latest", value: "primary_release_date.desc" },
  { label: "Oldest", value: "primary_release_date.asc" },
];

/**
 * BrowseDropdown
 * Props:
 *  genres        - [{ id, name }] from TMDB
 *  activeFilter  - { type, value } | null  (current active filter)
 *  activeSort    - sort string (default "popularity.desc")
 *  onApply       - callback({ genre, region, sort })
 *  onClear       - callback()
 */
const BrowseDropdown = ({
  genres,
  activeFilter,
  activeSort,
  onApply,
  onClear,
}) => {
  const [open, setOpen] = useState(false);

  // local selections inside the panel (uncommitted until Apply)
  const [localGenre, setLocalGenre] = useState(null);
  const [localRegion, setLocalRegion] = useState(null);
  const [localSort, setLocalSort] = useState("popularity.desc");

  const panelRef = useRef(null);

  // sync local state when panel opens
  useEffect(() => {
    if (open) {
      setLocalGenre(activeFilter?.type === "genre" ? activeFilter.value : null);
      setLocalRegion(
        activeFilter?.type === "language" ? activeFilter.value : null,
      );
      setLocalSort(activeSort ?? "popularity.desc");
    }
  }, [open, activeFilter, activeSort]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleApply = () => {
    onApply({ genre: localGenre, region: localRegion, sort: localSort });
    setOpen(false);
  };

  const handleClear = () => {
    setLocalGenre(null);
    setLocalRegion(null);
    setLocalSort("popularity.desc");
    onClear();
    setOpen(false);
  };

  const hasActive =
    activeFilter || (activeSort && activeSort !== "popularity.desc");

  return (
    <div className="browse-dropdown" ref={panelRef}>
      {/* Trigger button */}
      <button
        className={`browse-trigger ${open ? "browse-trigger--open" : ""} ${hasActive ? "browse-trigger--active" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="browse-trigger__icon">⚙</span>
        Browse
        {hasActive && <span className="browse-trigger__dot" />}
        <span className={`browse-trigger__chevron ${open ? "up" : ""}`}>▾</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="browse-panel" role="dialog" aria-label="Browse filters">
          {/* ── Region ── */}
          <section className="browse-section">
            <h4 className="browse-section__heading">Region</h4>
            <div className="browse-pills">
              {REGIONS.map((r) => (
                <button
                  key={r.value}
                  className={`browse-pill ${localRegion === r.value ? "browse-pill--active" : ""}`}
                  onClick={() => {
                    setLocalRegion(localRegion === r.value ? null : r.value);
                    setLocalGenre(null); // region & genre are mutually exclusive
                  }}
                >
                  {r.flag} {r.label}
                </button>
              ))}
            </div>
          </section>

          <div className="browse-divider" />

          {/* ── Genre ── */}
          <section className="browse-section">
            <h4 className="browse-section__heading">Genre</h4>
            <div className="browse-pills browse-pills--genres">
              {genres.map((g) => (
                <button
                  key={g.id}
                  className={`browse-pill ${localGenre === g.id ? "browse-pill--active" : ""}`}
                  onClick={() => {
                    setLocalGenre(localGenre === g.id ? null : g.id);
                    setLocalRegion(null); // mutually exclusive
                  }}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </section>

          <div className="browse-divider" />

          {/* ── Sort By ── */}
          <section className="browse-section">
            <h4 className="browse-section__heading">Sort By</h4>
            <div className="browse-pills">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  className={`browse-pill ${localSort === s.value ? "browse-pill--active" : ""}`}
                  onClick={() => setLocalSort(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Footer ── */}
          <div className="browse-footer">
            <button className="browse-footer__clear" onClick={handleClear}>
              Clear all
            </button>
            <button className="browse-footer__apply" onClick={handleApply}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseDropdown;
