import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useLiveWatchlist from "./useLiveWatchlist";
import "./Topbar.css";

// Hide TopBar on these routes
const HIDDEN_ROUTES = ["/profile", "/settings"];

const TopBar = () => {
  const location = useLocation();
  const { stocks } = useLiveWatchlist([]);
  const [nifty, setNifty] = useState(null);
  const [sensex, setSensex] = useState(null);
  const [loading, setLoading] = useState(true);
  const isHiddenRoute = HIDDEN_ROUTES.includes(location.pathname);

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      const niftyFound = stocks.find(
        (s) =>
          s.name?.toUpperCase() === "NIFTY 50" ||
          s.displayName?.toUpperCase() === "NIFTY 50" ||
          s.symbol?.toUpperCase() === "NIFTY50" ||
          s.symbol?.toUpperCase() === "^NSEI"
      );
      const sensexFound = stocks.find(
        (s) =>
          s.name?.toUpperCase() === "SENSEX" ||
          s.displayName?.toUpperCase() === "SENSEX" ||
          s.symbol?.toUpperCase() === "^BSESN"
      );
      setNifty(niftyFound || null);
      setSensex(sensexFound || null);
      setLoading(false);
    }
  }, [stocks]);

  if (isHiddenRoute) return null;

  const renderIndex = (indexData, indexName) => {
    if (!indexData) {
      return (
        <div key={indexName} className={indexName.toLowerCase().replace(" ", "-")}>
          <p className="index">{indexName}</p>
          <p className="index-points">—</p>
          <p className="percent">—</p>
        </div>
      );
    }
    return (
      <div key={indexName} className={indexName.toLowerCase().replace(" ", "-")}>
        <p className="index">{indexName}</p>
        <p className="index-points">{indexData.price || indexData.current || "—"}</p>
        <p className={`percent ${indexData.isDown ? "down" : "up"}`}>
          {indexData.percent || indexData.change || indexData.percentChange || ""}
        </p>
      </div>
    );
  };

  return (
    <div className="topbar-container">
      {loading ? (
        <p className="topbar-loading">Loading indices...</p>
      ) : (
        <div className="indices-container">
          {renderIndex(nifty, "NIFTY 50")}
          {renderIndex(sensex, "SENSEX")}
        </div>
      )}
    </div>
  );
};

export default TopBar;