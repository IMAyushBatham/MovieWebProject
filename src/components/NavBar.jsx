import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../css/Navbar.css";

function NavBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        CINE<span>VERSE</span>
      </NavLink>

      <div className="navbar-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-link ${isActive ? "active-link" : ""}`
          }
        >
          Home
        </NavLink>

        {currentUser && (
          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active-link" : ""}`
            }
          >
            Favorites
          </NavLink>
        )}

        {currentUser ? (
          <div className="nav-user" ref={menuRef}>
            <button
              className="nav-avatar"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="User menu"
            >
              {currentUser.username.charAt(0).toUpperCase()}
            </button>

            {menuOpen && (
              <div className="nav-dropdown">
                <div className="nav-dropdown__info">
                  <span className="nav-dropdown__name">
                    {currentUser.username}
                  </span>
                  <span className="nav-dropdown__email">
                    {currentUser.email}
                  </span>
                </div>
                <div className="nav-dropdown__divider" />
                <button className="nav-dropdown__logout" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/login" className="nav-link nav-link--cta">
            Sign In
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
