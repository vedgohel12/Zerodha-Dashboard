import React, { useState, useContext } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice]       = useState(0.0);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState(null);
  const [success, setSuccess]             = useState(false);

  const { closeBuyWindow } = useContext(GeneralContext);

  const marginRequired = (Number(stockQuantity) || 0) * (Number(stockPrice) || 0);

  const handleBuyClick = async () => {
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
      await axios.post(`${API_BASE_URL}/newOrder`, {
        name: uid,
        qty:   Number(stockQuantity),
        price: Number(stockPrice),
        mode:  "BUY",
      });

      setSuccess(true);

      // 2 second baad window band ho
      setTimeout(() => closeBuyWindow(), 2000);

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
          background: "#16a34a", color: "#fff",
          padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Buy {uid}</span>
          <button onClick={closeBuyWindow} style={{
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
                  Order Placed Successfully!
                </p>
                <p style={{ color: "#166534", margin: "2px 0 0", fontSize: 12 }}>
                  {uid} — Qty {stockQuantity} @ ₹{Number(stockPrice).toLocaleString("en-IN")}
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
                Margin required: <strong style={{ color: "#111827" }}>₹{marginRequired.toFixed(2)}</strong>
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleBuyClick}
                  disabled={submitting}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 8, border: "none",
                    background: submitting ? "#86efac" : "#16a34a",
                    color: "#fff", fontWeight: 700, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Placing..." : "Buy"}
                </button>
                <button
                  onClick={closeBuyWindow}
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
              onClick={closeBuyWindow}
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

export default BuyActionWindow;