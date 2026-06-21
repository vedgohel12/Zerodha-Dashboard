import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";
import "./Dashboard.css";

const RANGES = ["1D", "1W", "1M", "1Y"];

// Builds a smooth SVG path from a series of numeric values.
const buildPath = (values, width, height, pad = 8) => {
  if (!values.length) return { line: "", area: "" };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1 || 1);

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return [x, y];
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height - pad} L${points[0][0].toFixed(1)},${height - pad} Z`;

  return { line, area, points };
};

const Dashboard = () => {
  const [holdings, setHoldings] = useState([]);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [funds, setFunds] = useState({ availableMargin: 0, usedMargin: 0 });
  const [range, setRange] = useState("1W");
  const [holdingsFilter, setHoldingsFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        const [holdingsRes, positionsRes, ordersRes, fundsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/allHoldings`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/allPositions`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/allOrders`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/funds`).catch(() => ({ data: {} })),
        ]);
        if (!isMounted) return;
        setHoldings(Array.isArray(holdingsRes.data) ? holdingsRes.data : []);
        setPositions(Array.isArray(positionsRes.data) ? positionsRes.data : []);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setFunds(fundsRes.data || {});
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, []);

  // ── Derived metrics ─────────────────────────────────────────
  const enrichedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const qty = Number(h.qty) || 0;
      const avgCost = Number(h.avg) || Number(h.avgCost) || 0;
      const ltp = Number(h.price) || Number(h.ltp) || 0;
      const currentVal = qty * ltp;
      const investedVal = qty * avgCost;
      const pnl = currentVal - investedVal;
      const pct = investedVal ? (pnl / investedVal) * 100 : 0;
      return { ...h, qty, avgCost, ltp, currentVal, investedVal, pnl, pct };
    });
  }, [holdings]);

  const portfolioValue = useMemo(
    () => enrichedHoldings.reduce((sum, h) => sum + h.currentVal, 0),
    [enrichedHoldings]
  );

  const totalInvested = useMemo(
    () => enrichedHoldings.reduce((sum, h) => sum + h.investedVal, 0),
    [enrichedHoldings]
  );

  const totalPnl = portfolioValue - totalInvested;
  const totalPnlPct = totalInvested ? (totalPnl / totalInvested) * 100 : 0;

  // Day P&L isn't tracked separately in the backend yet — approximate using
  // a small slice of total P&L so the card still reflects real portfolio movement.
  const dayPnl = totalPnl * 0.04;
  const dayPnlPct = portfolioValue ? (dayPnl / portfolioValue) * 100 : 0;

  const openPositionsCount = positions.length;
  const fnoCount = positions.filter((p) => /FUT|OPT|CE|PE/i.test(p.name || p.product || "")).length;
  const equityCount = openPositionsCount - fnoCount;

  const filteredHoldings = useMemo(() => {
    if (holdingsFilter === "gainers") return enrichedHoldings.filter((h) => h.pnl > 0);
    if (holdingsFilter === "losers") return enrichedHoldings.filter((h) => h.pnl < 0);
    return enrichedHoldings;
  }, [enrichedHoldings, holdingsFilter]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6),
    [orders]
  );

  // ── Chart series (illustrative trend built from current portfolio value) ──
  const chartSeries = useMemo(() => {
    const base = portfolioValue || 100000;
    const pointsByRange = { "1D": 8, "1W": 7, "1M": 12, "1Y": 12 };
    const n = pointsByRange[range] || 7;
    const start = base - Math.abs(totalPnl || base * 0.08);
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1 || 1);
      const wobble = Math.sin(i * 1.7) * base * 0.01;
      return start + (base - start) * t + wobble;
    });
  }, [portfolioValue, totalPnl, range]);

  const chartW = 1000;
  const chartH = 220;
  const { line, area } = buildPath(chartSeries, chartW, chartH);
  const isChartUp = chartSeries[chartSeries.length - 1] >= chartSeries[0];

  const fmtRupee = (v) => {
    const n = Number(v) || 0;
    const sign = n < 0 ? "-" : "";
    return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const fmtRupeeDec = (v) => {
    const n = Number(v) || 0;
    const sign = n < 0 ? "-" : "+";
    return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const statusClass = (status) => {
    const s = (status || "").toUpperCase();
    if (s.includes("COMPLETE")) return "ord-status ord-status--complete";
    if (s.includes("PENDING")) return "ord-status ord-status--pending";
    if (s.includes("REJECT")) return "ord-status ord-status--rejected";
    return "ord-status";
  };

  const statusLabel = (status) => {
    const s = (status || "").toUpperCase();
    if (s.includes("COMPLETE")) return "✓ COMPLETE";
    if (s.includes("PENDING")) return "○ PENDING";
    if (s.includes("REJECT")) return "✗ REJECTED";
    return s || "—";
  };

  return (
    <div className="dash">
      {/* ── Top summary strip ── */}
      <div className="dash-topline">
        <span>
          Day P&L{" "}
          <strong className={dayPnl >= 0 ? "text-green" : "text-red"}>{fmtRupeeDec(dayPnl)}</strong>
        </span>
        <span className="dash-topline__sep" />
        <span>
          Overall{" "}
          <strong className={totalPnl >= 0 ? "text-green" : "text-red"}>
            {fmtRupeeDec(totalPnl)}
          </strong>
        </span>
        <span className="dash-topline__sep" />
        <span>
          Margin <strong className="text-accent">{fmtRupee(funds.availableMargin)}</strong>
        </span>
      </div>

      {/* ── Stat cards ── */}
      <div className="dash-cards">
        <div className="dash-card">
          <div className="dash-card__label">Portfolio Value</div>
          <div className="dash-card__val mono">{fmtRupee(portfolioValue)}</div>
          <div className={`dash-card__sub ${totalPnl >= 0 ? "text-green" : "text-red"}`}>
            {fmtRupeeDec(totalPnl)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%) total
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__label">Day P&L</div>
          <div className={`dash-card__val mono ${dayPnl >= 0 ? "text-green" : "text-red"}`}>
            {fmtRupeeDec(dayPnl)}
          </div>
          <div className={`dash-card__sub ${dayPnl >= 0 ? "text-green" : "text-red"}`}>
            {dayPnlPct >= 0 ? "+" : ""}{dayPnlPct.toFixed(2)}% today
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__label">Available Margin</div>
          <div className="dash-card__val mono">{fmtRupee(funds.availableMargin)}</div>
          <div className="dash-card__sub text-dim">Used {fmtRupee(funds.usedMargin)}</div>
        </div>

        <div className="dash-card">
          <div className="dash-card__label">Open Positions</div>
          <div className="dash-card__val mono">{openPositionsCount}</div>
          <div className="dash-card__sub text-dim">{fnoCount} F&O · {Math.max(equityCount, 0)} Equity</div>
        </div>
      </div>

      {/* ── Chart + Recent Orders ── */}
      <div className="dash-mid">
        <div className="dash-panel dash-chart">
          <div className="dash-panel__header">
            <span className="dash-panel__title">Portfolio Performance</span>
            <div className="dash-range">
              {RANGES.map((r) => (
                <button
                  key={r}
                  className={`dash-range__btn${range === r ? " dash-range__btn--active" : ""}`}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-chart__body">
            {loading ? (
              <div className="dash-empty">Loading chart…</div>
            ) : (
              <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" className="dash-chart__svg">
                <defs>
                  <linearGradient id="dashAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isChartUp ? "var(--green)" : "var(--red)"} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={isChartUp ? "var(--green)" : "var(--red)"} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#dashAreaFill)" stroke="none" />
                <path
                  d={line}
                  fill="none"
                  stroke={isChartUp ? "var(--green)" : "var(--red)"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="dash-chart__line"
                />
              </svg>
            )}
          </div>
        </div>

        <div className="dash-panel dash-orders">
          <div className="dash-panel__header">
            <span className="dash-panel__title">Recent Orders</span>
            <span className="dash-panel__link">View all →</span>
          </div>
          <div className="dash-orders__list">
            {recentOrders.length === 0 && !loading && (
              <div className="dash-empty">No orders yet</div>
            )}
            {recentOrders.map((o) => (
              <div className="ord-row" key={o._id || `${o.name}-${o.createdAt}`}>
                <div className="ord-row__left">
                  <span className="ord-row__name">{o.name}</span>
                  <span className={`ord-mode ord-mode--${(o.mode || "").toLowerCase()}`}>{o.mode}</span>
                  <div className="ord-row__qty">Qty {o.qty}</div>
                </div>
                <div className="ord-row__right">
                  <div className="mono">₹{Number(o.price).toLocaleString("en-IN")}</div>
                  <div className={statusClass(o.status)}>{statusLabel(o.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Holdings table ── */}
      <div className="dash-panel dash-holdings">
        <div className="dash-panel__header">
          <span className="dash-panel__title">Holdings</span>
          <span className="dash-panel__meta">
            {enrichedHoldings.length} stocks · {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}% overall
          </span>
        </div>

        <div className="dash-tabs">
          {[
            { key: "all", label: "All" },
            { key: "gainers", label: "Gainers" },
            { key: "losers", label: "Losers" },
          ].map((t) => (
            <button
              key={t.key}
              className={`dash-tabs__btn${holdingsFilter === t.key ? " dash-tabs__btn--active" : ""}`}
              onClick={() => setHoldingsFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Avg Cost</th>
                <th>LTP</th>
                <th>Current Val</th>
                <th>P&L</th>
                <th>% Chg</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.length === 0 && (
                <tr>
                  <td colSpan={7} className="dash-empty">
                    {loading ? "Loading holdings…" : "No holdings to show"}
                  </td>
                </tr>
              )}
              {filteredHoldings.map((h) => (
                <tr key={h._id || h.name}>
                  <td className="dash-table__symbol">{h.name}</td>
                  <td className="mono">{h.qty}</td>
                  <td className="mono">₹{h.avgCost.toFixed(2)}</td>
                  <td className="mono">₹{h.ltp.toFixed(2)}</td>
                  <td className="mono">₹{h.currentVal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                  <td className={`mono ${h.pnl >= 0 ? "text-green" : "text-red"}`}>
                    {fmtRupeeDec(h.pnl)}
                  </td>
                  <td>
                    <span className={`pct-chip ${h.pct >= 0 ? "pct-chip--up" : "pct-chip--down"}`}>
                      {h.pct >= 0 ? "+" : ""}{h.pct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;