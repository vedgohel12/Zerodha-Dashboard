import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard   from "./Dashboard";
import Menu        from "./Menu";
import Orders      from "./Orders";
import Holdings    from "./Holdings";
import Positions   from "./Positions";
import Funds       from "./Funds";
import Apps        from "./Apps";
import ProfilePage  from "./ProfilePage";
import SettingsPage from "./SettingsPage";

const LANDING_LOGIN_URL = "https://zerodha-frontend-583d-njis4k077-vedgohel12s-projects.vercel.app/login";
const API_BASE_URL      = "https://zerodha-backend-1-cbr6.onrender.com/api/auth";

const INDICES = [
  { name: "NIFTY 50",   price: "24,123.15", pct: "0.42%", up: true  },
  { name: "SENSEX",     price: "79,432.65", pct: "0.38%", up: true  },
  { name: "BANK NIFTY", price: "51,820.40", pct: "0.12%", up: false },
];

const Home = () => {
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [watchlistOpen, setWatchlistOpen] = useState(false);

  /* ── auth check ── */
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) { window.location.href = LANDING_LOGIN_URL; return; }
      try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = LANDING_LOGIN_URL;
          return;
        }
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = LANDING_LOGIN_URL;
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* Single nav for the whole app */}
      <Menu
        user={user}
        indices={INDICES}
        onOpenWatchlist={() => setWatchlistOpen((p) => !p)}
        watchlistOpen={watchlistOpen}
      />

      {/* Page shell — sits below topbar + desktop-nav */}
      <div id="shell">
        <div id="main">
          <Routes>
            {/* Dashboard gets watchlist state so it can show/hide sidebar */}
            <Route
              index
              element={
                <Dashboard
                  watchlistOpen={watchlistOpen}
                  setWatchlistOpen={setWatchlistOpen}
                />
              }
            />

            {/* ── All main pages ── */}
            <Route path="orders"    element={<Orders />} />
            <Route path="holdings"  element={<Holdings />} />
            <Route path="positions" element={<Positions />} />
            <Route path="funds"     element={<Funds />} />
            <Route path="apps"      element={<Apps />} />

            {/* ── Profile & Settings ── */}
            <Route path="profile"  element={<ProfilePage  user={user} setUser={setUser} />} />
            <Route path="settings" element={<SettingsPage user={user} />} />

            {/* ── Catch-all ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Home;