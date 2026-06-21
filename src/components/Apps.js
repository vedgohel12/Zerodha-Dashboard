import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";
import "./Apps.css";

const Apps = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchApps = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/allApps`);
        if (isMounted) {
          setApps(res.data);
          setError("");
        }
      } catch (err) {
        console.error("❌ Failed to fetch apps:", err.message);
        if (isMounted) {
          setError("Couldn't load apps. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApps();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <h3 className="title">Loading apps…</h3>;
  }

  if (error) {
    return <h3 className="title">{error}</h3>;
  }

  return (
    <>
      <h3 className="title">Apps ({apps.length})</h3>

      <div className="apps-grid">
        {apps.map((app) => (
          <div className="app-card" key={app._id || app.id || app.name}>
            <img
              src={app.icon}
              alt={`${app.name} icon`}
              className="app-icon"
            />
            <div className="app-info">
              <p className="app-name">{app.name}</p>
              <p className="app-description">{app.description}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Apps;