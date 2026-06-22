import React, { useState, useContext } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";
import GeneralContext from "./GeneralContext";
import "./SellActionWindow.css";

const SellActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice]       = useState(0.0);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState(null);
  const [success, setSuccess]             = useState(false);

  const { closeSellWindow } = useContext(GeneralContext);

  const totalValue = (Number(stockQuantity) || 0) * (Number(stockPrice) || 0);

  const handleSellClick = async () => {
    setError(null);
    setSuccess(false);

    if (!stockQuantity || Number(stockQuantity) <= 0) {
      setError("Quantity must be at least 1.");
      return;
    }
    if (!stockPrice || Number(stockPrice) <= 0) {
      setError("Enter a valid price before placing the order.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/newOrder`, {
        name: uid,
        qty:   Number(stockQuantity),
        price: Number(stockPrice),
        mode:  "SELL",
      });

      setSuccess(true);

      window.dispatchEvent(new CustomEvent("sellOrderComplete", {
        detail: { funds: response.data.funds, orderValue: totalValue },
      }));

      setTimeout(() => closeSellWindow(), 2000);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error   ||
        "Order failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, width: 340,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          background: "#dc2626", color: "#fff",
          padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Sell {uid}</span>
          <button onClick={closeSellWindow} style={{
            background: "none", border: "none", color: "#fff",
            fontSize: 20, cursor: "pointer", lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ padding: "20px" }}>

          {/* Success alert */}
          {success && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac",
              borderRadius: 8, padding: "14px 16px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div>
                <p style={{ fontWeight: 700, color: "#15803d", margin: 0, fontSize: 14 }}>
                  Sold Successfully!
                </p>
                <p style={{ color: "#166534", margin: "2px 0 0", fontSize: 12 }}>
                  {uid} — Qty {stockQuantity} @ ₹{Number(stockPrice).toLocaleString("en-IN")} · +₹{totalValue.toFixed(2)} added
                </p>
              </div>
            </div>
          )}

          {/* Error alert */}
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              color: "#dc2626", fontSize: 13,
            }}>
              ⚠ {error}
            </div>
          )}

          {!success && (
            <>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>QTY</label>
                  <input
                    type="number" min="1" value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    disabled={submitting}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 7,
                      border: "1px solid #e5e7eb", fontSize: 14,
                      color: "#111827", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>PRICE (₹)</label>
                  <input
                    type="number" min="0" step="0.05" value={stockPrice}
                    onChange={(e) => setStockPrice(e.target.value)}
                    disabled={submitting}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 7,
                      border: "1px solid #e5e7eb", fontSize: 14,
                      color: "#111827", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                Total value: <strong style={{ color: "#111827" }}>₹{totalValue.toFixed(2)}</strong>
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSellClick}
                  disabled={submitting}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 8, border: "none",
                    background: submitting ? "#fca5a5" : "#dc2626",
                    color: "#fff", fontWeight: 700, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Processing..." : "Sell"}
                </button>
                <button
                  onClick={closeSellWindow}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 8,
                    border: "1px solid #e5e7eb", background: "#f9fafb",
                    color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {success && (
            <button
              onClick={closeSellWindow}
              style={{
                width: "100%", padding: "11px", borderRadius: 8, border: "none",
                background: "#16a34a", color: "#fff",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellActionWindow;