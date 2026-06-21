import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api";
import GeneralContext from "./GeneralContext";
import "./SellActionWindow.css";

const SellActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
      console.log("📤 Sending SELL order:", {
        name: uid,
        qty: Number(stockQuantity),
        price: Number(stockPrice),
        mode: "SELL",
      });

      const response = await axios.post(`${API_BASE_URL}/newOrder`, {
        name: uid,
        qty: Number(stockQuantity),
        price: Number(stockPrice),
        mode: "SELL",
      });

      console.log("✅ Order placed successfully!");
      console.log("💰 Updated Funds:", response.data.funds);

      setSuccess(true);

      // Dispatch event to notify Funds component to refresh
      console.log("📢 Dispatching sellOrderComplete event...");
      window.dispatchEvent(new CustomEvent("sellOrderComplete", {
        detail: {
          funds: response.data.funds,
          orderValue: totalValue,
        }
      }));

      // Show success message for 2 seconds then close
      setTimeout(() => {
        closeSellWindow();
      }, 1500);
    } catch (err) {
      console.error("❌ Order submission failed:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Order failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    closeSellWindow();
  };

  return (
    <div className="container" id="sell-window" draggable="true">
      <div className="header">
        <h3>Sell {uid}</h3>
      </div>

      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="qty"
              min="1"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
              disabled={submitting || success}
            />
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              min="0"
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
              disabled={submitting || success}
            />
          </fieldset>
        </div>
      </div>

      {error && (
        <div
          style={{
            color: "#dc2626",
            fontSize: "12px",
            margin: "8px 20px 0 20px",
            padding: "8px 12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            color: "#059669",
            fontSize: "12px",
            margin: "8px 20px 0 20px",
            padding: "8px 12px",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "6px",
            fontWeight: "500",
          }}
        >
          ✅ Order placed successfully! Funds increased by ₹{totalValue.toFixed(2)}
        </div>
      )}

      <div className="buttons">
        <span>Total Value ₹{totalValue.toFixed(2)}</span>
        <div>
          <Link
            className="btn btn-red"
            onClick={!submitting && !success ? handleSellClick : undefined}
            style={{
              opacity: submitting || success ? 0.6 : 1,
              pointerEvents: submitting || success ? "none" : "auto",
              cursor: submitting || success ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Processing..." : success ? "Success!" : "Sell"}
          </Link>
          <Link 
            to="" 
            className="btn btn-grey" 
            onClick={handleCancelClick}
            style={{
              pointerEvents: submitting ? "none" : "auto",
            }}
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellActionWindow;