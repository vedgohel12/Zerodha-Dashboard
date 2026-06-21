import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import Menu from "./Menu";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";

const LANDING_LOGIN_URL = "http://localhost:3000/login";
const API_BASE_URL = "http://localhost:5000/api/auth";

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlistOpen, setWatchlistOpen] = useState(false); // ✅ lifted here, single source of truth
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    document.body.style.background = darkMode ? "#0a0a0a" : "#fff";
    document.body.style.color = darkMode ? "#f1f5f9" : "#111827";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

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
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        height: "100vh", fontSize: "18px", color: "#387ed1", fontWeight: 600,
        background: darkMode ? "#0a0a0a" : "#fff",
      }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: darkMode ? "#0a0a0a" : "#f9fafb",
      color: darkMode ? "#f1f5f9" : "#111827",
      transition: "background 0.3s, color 0.3s",
    }}>
      {/* ✅ ONE navbar for the whole app */}
      <Menu
        user={user}
        onOpenWatchlist={() => setWatchlistOpen(true)}
        watchlistOpen={watchlistOpen}
      />

      {/* ✅ TopBar now ONLY shows indices — no nav inside it anymore */}
      <TopBar user={user} />

      <Routes>
        <Route
          path="/*"
          element={
            <Dashboard
              darkMode={darkMode}
              watchlistOpen={watchlistOpen}
              setWatchlistOpen={setWatchlistOpen}
            />
          }
        />
        <Route path="/profile" element={<ProfilePage user={user} darkMode={darkMode} />} />
        <Route path="/settings" element={<SettingsPage user={user} darkMode={darkMode} setDarkMode={setDarkMode} />} />
      </Routes>
    </div>
  );
};

export default Home;