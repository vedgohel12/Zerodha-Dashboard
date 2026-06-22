import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./Menu.css";

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/holdings", label: "Holdings" },
  { to: "/positions", label: "Positions" },
  { to: "/funds", label: "Funds" },
  { to: "/apps", label: "Apps" },
];

const MOB_ICONS = {
  "/": <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />,
  "/orders": <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  "/holdings": <path d="M3 7h18v12H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />,
  "/positions": <path d="M3 17 9 11l4 4 8-8M16 9h5v5" />,
  "/funds": <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  "/apps": <path d="M4 4h16v16H4z" />,
};

const LANDING_LOGIN_URL = "http://localhost:3000/login";

const Menu = ({ user, indices = [], onOpenWatchlist, watchlistOpen }) => {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = LANDING_LOGIN_URL;
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  // NavLink needs exact match for "/" so it doesn't stay active on all pages
  const getNavClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <>
      {/* ── TOP BAR ── */}
      <header id="topbar">
        <NavLink to="/" className="brand">Zerodha</NavLink>

        <div className={`search${searchFocused ? " search--focused" : ""}`}>
          <span className="search__icon">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search stocks, ETFs, indices…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <span className="search__kbd">⌘K</span>
        </div>

        <div className="topbar-right">
          {indices.map((idx) => (
            <div className="tb-badge" key={idx.name}>
              <span className={idx.up ? "up" : "down"}>{idx.name}</span>{" "}
              <span className={idx.up ? "up" : "down"}>
                {idx.price} {idx.up ? "▲" : "▼"}{idx.pct}
              </span>
            </div>
          ))}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button className="avatar" onClick={() => setProfileOpen((p) => !p)}>
              {initials}
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="avatar">{initials}</div>
                  <div>
                    <p className="profile-dropdown-name">{user?.fullName || "User"}</p>
                    <p className="profile-dropdown-email">{user?.email || ""}</p>
                  </div>
                </div>
                <NavLink to="/profile"  className="menu-row" onClick={() => setProfileOpen(false)}>Profile</NavLink>
                <NavLink to="/settings" className="menu-row" onClick={() => setProfileOpen(false)}>Settings</NavLink>
                <div className="menu-row menu-row--danger" onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── DESKTOP HORIZONTAL NAV ── */}
      <nav id="desktop-nav">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}        /* exact match only for Dashboard */
            className={getNavClass}
          >
            {link.label}
          </NavLink>
        ))}
        <div className="nav-right">
          <button
            className={`watch-toggle${watchlistOpen ? " active" : ""}`}
            onClick={onOpenWatchlist}
          >
            ☰ Watchlist
          </button>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav id="mobile-nav">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `mob-nav-item${isActive ? " active" : ""}`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {MOB_ICONS[link.to]}
            </svg>
            {link.label}
          </NavLink>
        ))}

        <button
          className={`mob-nav-item mob-nav-watchlist${watchlistOpen ? " active" : ""}`}
          onClick={onOpenWatchlist}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          Watchlist
        </button>
      </nav>
    </>
  );
};

export default Menu;