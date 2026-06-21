import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";

const REFRESH_INTERVAL_MS = 5000;
const emptyFunds = { availableMargin: 0, usedMargin: 0, openingBalance: 0 };

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const Summary = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [funds, setFunds] = useState(emptyFunds);
  const isFetchingHoldingsRef = useRef(false);
  const isFetchingFundsRef = useRef(false);

  const fetchHoldings = useCallback(async (isMounted) => {
    if (isFetchingHoldingsRef.current) return;
    isFetchingHoldingsRef.current = true;
    try {
      const res = await axios.get(`${API_BASE_URL}/allHoldings`);
      if (isMounted()) setAllHoldings(res.data);
    } finally {
      isFetchingHoldingsRef.current = false;
    }
  }, []);

  const fetchFunds = useCallback(async (isMounted) => {
    if (isFetchingFundsRef.current) return;
    isFetchingFundsRef.current = true;
    try {
      const res = await axios.get(`${API_BASE_URL}/funds`);
      if (isMounted() && res.data) setFunds({ ...emptyFunds, ...res.data });
    } finally {
      isFetchingFundsRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;
    fetchHoldings(isMounted);
    fetchFunds(isMounted);
    const id = setInterval(() => { fetchHoldings(isMounted); fetchFunds(isMounted); }, REFRESH_INTERVAL_MS);
    return () => { mounted = false; clearInterval(id); };
  }, [fetchHoldings, fetchFunds]);

  const totalInvestment = allHoldings.reduce((s, h) => s + h.avg * h.qty, 0);
  const currentValue = allHoldings.reduce((s, h) => s + h.price * h.qty, 0);
  const totalPnL = currentValue - totalInvestment;
  const pnlPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
  const isProfit = totalPnL >= 0;

  return (
    <div className="cards-row">
      <div className="card">
        <div className="c-label">Portfolio Value</div>
        <div className="c-val text-accent mono">{fmt(currentValue)}</div>
        <div className={`c-sub mono ${isProfit ? "text-green" : "text-red"}`}>
          {isProfit ? "+" : ""}{fmt(totalPnL)} ({pnlPercent.toFixed(2)}%)
        </div>
      </div>
      <div className="card">
        <div className="c-label">Available Margin</div>
        <div className="c-val mono">{fmt(funds.availableMargin)}</div>
        <div className="c-sub text-dim mono">Used {fmt(funds.usedMargin)}</div>
      </div>
      <div className="card">
        <div className="c-label">Opening Balance</div>
        <div className="c-val mono">{fmt(funds.openingBalance)}</div>
      </div>
      <div className="card">
        <div className="c-label">Holdings</div>
        <div className="c-val mono">{allHoldings.length}</div>
        <div className="c-sub text-dim">positions</div>
      </div>

      <style>{`
        .cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
        .card .c-label { font-size: 11px; color: var(--text-dim); margin-bottom: 6px; text-transform: uppercase; letter-spacing: .4px; }
        .card .c-val { font-size: 20px; font-weight: 700; }
        .card .c-sub { font-size: 11px; margin-top: 4px; }
        @media (max-width: 900px) { .cards-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 360px) { .cards-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default Summary;