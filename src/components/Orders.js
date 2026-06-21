import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../api";

const REFRESH_INTERVAL_MS = 5000;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);

  const fetchOrders = useCallback(async (isMounted) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await axios.get(`${API_BASE_URL}/allOrders`);
      if (isMounted()) { setOrders(res.data); setLastUpdated(new Date()); setError(null); }
    } catch (err) {
      if (isMounted()) setError(err.message);
    } finally {
      isFetchingRef.current = false;
      if (isMounted()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;
    fetchOrders(isMounted);
    const id = setInterval(() => fetchOrders(isMounted), REFRESH_INTERVAL_MS);
    return () => { mounted = false; clearInterval(id); };
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="p-title">Orders</span></div>
        <div className="panel-body">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "9px 0" }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <span key={j} className="skeleton" style={{ width: j === 0 ? 90 : 60 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="panel" style={{ padding: 40, textAlign: "center" }}>
        <p className="text-dim" style={{ marginBottom: 14 }}>You haven't placed any orders today</p>
        <Link to="/" className="text-accent" style={{ fontWeight: 600, fontSize: 13 }}>Get started →</Link>
      </div>
    );
  }

  const buyCount = orders.filter((o) => o.mode === "BUY").length;
  const sellCount = orders.filter((o) => o.mode === "SELL").length;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="p-title">Orders ({orders.length}) <span className="text-dim" style={{ fontSize: 11, fontWeight: 400 }}>{buyCount}B · {sellCount}S</span></span>
        {lastUpdated && (
          <div className="live-pill">
            <span className="live-dot" />
            {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      {error && <div className="error-banner" style={{ margin: "12px 16px 0" }}>⚠ Failed to refresh. Showing last known orders.</div>}

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr><th>Instrument</th><th>Qty.</th><th>Price</th><th>Mode</th><th>Time</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="sym-cell">{order.name}</td>
                <td>{order.qty}</td>
                <td>₹{Number(order.price).toFixed(2)}</td>
                <td><span className={`badge ${order.mode === "BUY" ? "badge-buy" : "badge-sell"}`}>{order.mode}</span></td>
                <td className="text-dim" style={{ fontFamily: "var(--font-ui)" }}>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;