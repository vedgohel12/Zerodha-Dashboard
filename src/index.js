import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import "./components/theme.css"; // ✅ TradePulse design tokens (colors, fonts, layout vars)
import Home from "./components/Home";

const params = new URLSearchParams(window.location.search);
const tokenFromUrl = params.get("token");

console.log("🚀 Dashboard app loading...");
console.log("📍 Current URL:", window.location.href);
console.log("🔑 Token from URL:", tokenFromUrl || "NONE");

// create root once so it's always defined
const root = ReactDOM.createRoot(document.getElementById("root"));

if (tokenFromUrl) {
  localStorage.setItem("token", tokenFromUrl);
  console.log("✅ Token saved to localStorage");
  const cleanedUrl = window.location.origin + window.location.pathname;
  console.log("🔁 Reloading dashboard without query params:", cleanedUrl);
  window.location.replace(cleanedUrl);
} else {
  root.render(
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}