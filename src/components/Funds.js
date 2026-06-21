import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";

const REFRESH_INTERVAL_MS = 2000;

const Funds = () => {
  const [funds, setFunds] = useState({ availableMargin: 0, usedMargin: 0, openingBalance: 0 });
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchFunds = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const res = await axios.get(`${API_BASE_URL}/funds`);
        if (isMounted && res.data) setFunds(res.data);
      } finally { isFetchingRef.current = false; }
    };
    fetchFunds();
    const intervalId = setInterval(fetchFunds, REFRESH_INTERVAL_MS);
    const handleSellOrderComplete = () => fetchFunds();
    window.addEventListener("sellOrderComplete", handleSellOrderComplete);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("sellOrderComplete", handleSellOrderComplete);
    };
  }, []);

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleAddFunds = async () => {
    if (!amount || Number(amount) < 100) { setMessage({ type: "error", text: "Minimum amount is ₹100." }); return; }
    setLoading(true);
    setMessage(null);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) { setMessage({ type: "error", text: "Failed to load payment gateway." }); setLoading(false); return; }

      const orderRes = await axios.post(`${API_BASE_URL}/api/payment/createOrder`, { amount: Number(amount) });
      if (!orderRes.data || !orderRes.data.id) throw new Error(orderRes.data?.error || "Order creation failed.");

      const order = orderRes.data;
      const razorpayKey = order.key_id || process.env.REACT_APP_RAZORPAY_KEY_ID;
      if (!razorpayKey) throw new Error("Payment gateway key is not configured.");

      const options = {
        key: razorpayKey, amount: order.amount, currency: "INR",
        name: "TradePulse", description: "Add Funds to Account", order_id: order.id,
        method: { card: true, netbanking: true, upi: true, wallet: true, paylater: true },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => { setMessage({ type: "error", text: "Payment cancelled." }); setLoading(false); } },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(amount),
            });
            if (verifyRes.data.success) {
              setMessage({ type: "success", text: `₹${amount} added successfully!` });
              setAmount("");
              if (verifyRes.data.funds) setFunds(verifyRes.data.funds);
              else { const res = await axios.get(`${API_BASE_URL}/funds`); if (res.data) setFunds(res.data); }
            } else {
              setMessage({ type: "error", text: verifyRes.data.error || "Verification failed." });
            }
          } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.error || "Verification failed." });
          } finally { setLoading(false); }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        const reason = response.error?.reason || response.error?.description || "Payment failed.";
        setMessage({ type: "error", text: /international/i.test(reason)
          ? "International cards not supported. Use Indian card, UPI, or netbanking."
          : `Payment failed: ${reason}` });
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || err.message || "Failed to initiate payment." });
    } finally { setLoading(false); }
  };

  const fmtVal = (v) => { const a = Math.abs(v || 0); return a >= 1000 ? `${(a / 1000).toFixed(2)}k` : a.toFixed(2); };

  return (
    <>
      <div className="cards-row">
        <div className="card">
          <div className="c-label">Available Margin</div>
          <div className="c-val text-green mono">₹{fmtVal(funds.availableMargin)}</div>
        </div>
        <div className="card">
          <div className="c-label">Used Margin</div>
          <div className="c-val text-red mono">₹{fmtVal(funds.usedMargin)}</div>
        </div>
        <div className="card">
          <div className="c-label">Opening Balance</div>
          <div className="c-val text-accent mono">₹{fmtVal(funds.openingBalance)}</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16, padding: 16, background: "#f0f9ff", border: "1px solid #bfdbfe" }}>
        <p style={{ fontSize: 12, color: "#1e40af", margin: 0 }}>
          💡 <strong>Tip:</strong> Your available margin increases when you SELL stocks.
        </p>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header"><span className="p-title">Add Funds</span></div>
        <div className="panel-body">
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>
            Amount (₹)
          </label>
          <div style={{ position: "relative", marginBottom: 6 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}>₹</span>
            <input
              type="number" value={amount} min="100"
              onChange={(e) => { setAmount(e.target.value); setMessage(null); }}
              placeholder="Enter amount"
              style={{ width: "100%", padding: "11px 14px 11px 30px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 15, color: "var(--text)", background: "var(--surface)", outline: "none", boxSizing: "border-box" }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <p style={{ fontSize: 11, color: "var(--text-dim)", margin: "0 0 16px" }}>Minimum amount: ₹100</p>

          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[500, 1000, 2000, 5000, 10000].map((val) => (
              <button key={val} onClick={() => { setAmount(val); setMessage(null); }}
                style={{
                  padding: "6px 14px", borderRadius: 20,
                  border: `1px solid ${Number(amount) === val ? "var(--accent)" : "var(--border)"}`,
                  background: Number(amount) === val ? "rgba(37,99,235,.08)" : "transparent",
                  color: Number(amount) === val ? "var(--accent)" : "var(--text-dim)",
                  fontSize: 12, fontWeight: 500,
                }}>
                +₹{val.toLocaleString()}
              </button>
            ))}
          </div>

          {message && (
            <div className="error-banner" style={{
              background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              color: message.type === "success" ? "var(--green)" : "var(--red)",
            }}>
              {message.type === "success" ? "✓ " : "⚠ "}{message.text}
            </div>
          )}

          <button
            onClick={handleAddFunds} disabled={loading}
            style={{
              width: "100%", padding: 13, borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: loading ? "#93c5fd" : "var(--accent)", color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
            }}>
            {loading ? "Processing..." : `Pay ₹${amount || "0"} via Razorpay`}
          </button>
        </div>
      </div>
    </>
  );
};

export default Funds;