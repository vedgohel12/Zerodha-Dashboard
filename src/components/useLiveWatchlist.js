// useLiveWatchlist.js
//
// Connects to the live price socket server and keeps a piece of state
// in sync with the latest broadcasted prices. Use it in any component
// that needs live watchlist data.
//
// npm install socket.io-client   (run this inside your frontend project)

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// 🔧 Point this to wherever backend/server.js is running.
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5050";
const POLL_INTERVAL_MS = 5000;

export default function useLiveWatchlist(fallbackData = []) {
  const [stocks, setStocks] = useState(fallbackData);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to live price feed", SOCKET_URL);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Disconnected from live price feed");
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      setConnected(false);
    });

    socket.on("watchlist:update", (updatedStocks) => {
      console.log("🔁 Received watchlist update", updatedStocks);
      setStocks(updatedStocks);
    });

    const fetchLatestWatchlist = async () => {
      try {
        const response = await fetch(`${SOCKET_URL}/health`);
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }
        const body = await response.json();
        if (Array.isArray(body.lastUpdate)) {
          setStocks(body.lastUpdate);
        }
      } catch (err) {
        console.warn("⚠️ Live watchlist polling failed:", err.message);
      }
    };

    fetchLatestWatchlist();
    const intervalId = setInterval(fetchLatestWatchlist, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      socket.disconnect();
    };
  }, []);

  return { stocks, connected };
}