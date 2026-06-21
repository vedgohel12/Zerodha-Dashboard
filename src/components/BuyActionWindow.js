import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { closeBuyWindow } = useContext(GeneralContext); // ✅ get real function from provider

  const marginRequired = (Number(stockQuantity) || 0) * (Number(stockPrice) || 0);

  const handleBuyClick = async () => {
    setError(null);

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
        qty: Number(stockQuantity),
        price: Number(stockPrice),
        mode: "BUY",
      });
      // Order placed and funds deducted on the backend — close the window.
      closeBuyWindow();
    } catch (err) {
      console.error("Order submission failed:", err);
      // Show the backend's reason (e.g. "Insufficient funds to place this order")
      // instead of silently closing the window.
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
    closeBuyWindow(); // ✅ same here
  };

  return (
    <div className="container" id="buy-window" draggable="true">
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
            />
          </fieldset>
        </div>
      </div>

      {error && (
        <div style={{
          color: "#dc2626",
          fontSize: "12px",
          margin: "8px 0",
          padding: "6px 10px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "6px",
        }}>
          ⚠ {error}
        </div>
      )}

      <div className="buttons">
        <span>Margin required ₹{marginRequired.toFixed(2)}</span>
        <div>
          <Link
            className="btn btn-blue"
            onClick={!submitting ? handleBuyClick : undefined}
            style={{ opacity: submitting ? 0.6 : 1, pointerEvents: submitting ? "none" : "auto" }}
          >
            {submitting ? "Placing..." : "Buy"}
          </Link>
          <Link to="" className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;