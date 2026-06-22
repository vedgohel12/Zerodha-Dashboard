import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const RANGES = ["1D", "1W", "1M", "1Y"];

const buildPath = (values, width, height, pad = 8) => {
  if (!values || values.length < 2) return { line: "", area: "" };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return [x, y];
  });

  // Smooth bezier curve
  let line = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const mx = (px + cx) / 2;
    line += ` C${mx.toFixed(1)},${py.toFixed(1)} ${mx.toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  const first = points[0];
  const area = `${line} L${last[0].toFixed(1)},${(height - pad).toFixed(1)} L${first[0].toFixed(1)},${(height - pad).toFixed(1)} Z`;

  return { line, area, points };
};

// ── Tiny sparkline for watchlist items ──
const Sparkline = ({ values = [], up }) => {
  const w = 60, h = 28;
  const { line } = buildPath(values, w, h, 2);
  if (!line) return null;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
      <path d={line} fill="none" stroke={up ? "var(--green)" : "var(--red)"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

const MOCK_WATCHLIST = [
  { symbol: "RELIANCE", ltp: 2847.35, chg: 1.24, spark: [2790, 2800, 2785, 2810, 2830, 2820, 2847] },
  { symbol: "INFY",     ltp: 1543.60, chg: -0.87, spark: [1580, 1570, 1560, 1555, 1548, 1545, 1543] },
  { symbol: "TCS",      ltp: 3912.15, chg: 0.43, spark: [3880, 3890, 3895, 3900, 3905, 3908, 3912] },
  { symbol: "HDFC",     ltp: 1621.80, chg: -1.10, spark: [1650, 1645, 1638, 1630, 1625, 1622, 1621] },
  { symbol: "ICICIBANK",ltp: 1089.45, chg: 2.05, spark: [1050, 1060, 1065, 1075, 1080, 1085, 1089] },
  { symbol: "WIPRO",    ltp: 487.20,  chg: 0.18, spark: [484, 485, 484, 486, 486, 487, 487] },
  { symbol: "SBIN",     ltp: 802.30,  chg: -0.55, spark: [808, 806, 805, 804, 803, 802, 802] },
  { symbol: "AXISBANK", ltp: 1145.60, chg: 1.60, spark: [1120, 1125, 1130, 1135, 1140, 1143, 1145] },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState([]);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [funds, setFunds] = useState({ availableMargin: 0, usedMargin: 0 });
  const [range, setRange] = useState("1W");
  const [holdingsFilter, setHoldingsFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [watchSearch, setWatchSearch] = useState("");

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

  const portfolioValue = useMemo(() => enrichedHoldings.reduce((s, h) => s + h.currentVal, 0), [enrichedHoldings]);
  const totalInvested  = useMemo(() => enrichedHoldings.reduce((s, h) => s + h.investedVal, 0), [enrichedHoldings]);
  const totalPnl       = portfolioValue - totalInvested;
  const totalPnlPct    = totalInvested ? (totalPnl / totalInvested) * 100 : 0;
  const dayPnl         = totalPnl * 0.04;
  const dayPnlPct      = portfolioValue ? (dayPnl / portfolioValue) * 100 : 0;

  const openPositionsCount = positions.length;
  const fnoCount    = positions.filter((p) => /FUT|OPT|CE|PE/i.test(p.name || p.product || "")).length;
  const equityCount = Math.max(openPositionsCount - fnoCount, 0);

  const filteredHoldings = useMemo(() => {
    if (holdingsFilter === "gainers") return enrichedHoldings.filter((h) => h.pnl > 0);
    if (holdingsFilter === "losers")  return enrichedHoldings.filter((h) => h.pnl < 0);
    return enrichedHoldings;
  }, [enrichedHoldings, holdingsFilter]);

  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [orders]
  );

  const chartSeries = useMemo(() => {
    const base  = portfolioValue || 100000;
    const pts   = { "1D": 24, "1W": 7, "1M": 30, "1Y": 52 }[range] || 7;
    const start = base - Math.abs(totalPnl || base * 0.08);
    return Array.from({ length: pts }, (_, i) => {
      const t = i / (pts - 1);
      return start + (base - start) * t + Math.sin(i * 1.9) * base * 0.008;
    });
  }, [portfolioValue, totalPnl, range]);

  const chartW = 900, chartH = 200;
  const { line, area } = buildPath(chartSeries, chartW, chartH);
  const isUp = chartSeries[chartSeries.length - 1] >= chartSeries[0];

  const filteredWatch = useMemo(() =>
    MOCK_WATCHLIST.filter((s) => s.symbol.includes(watchSearch.toUpperCase())),
    [watchSearch]
  );

  const fmt  = (v) => `₹${Math.abs(Number(v) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const fmtD = (v) => {
    const n = Number(v) || 0;
    return `${n >= 0 ? "+" : "-"}₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const orderColor = (s = "") => {
    const u = s.toUpperCase();
    if (u.includes("COMPLETE")) return "complete";
    if (u.includes("PENDING"))  return "pending";
    if (u.includes("REJECT"))   return "reject";
    return "";
  };

  return (
    <div className="db-shell">

      {/* ─────────────────────── LEFT — WATCHLIST ─────────────────────── */}
      <aside className="db-watch">
        <div className="db-watch__head">
          <span className="db-watch__title">Watchlist</span>
          <button className="db-watch__add" title="Add symbol">＋</button>
        </div>
        <div className="db-watch__search-wrap">
          <span className="db-watch__search-icon">⌕</span>
          <input
            className="db-watch__search"
            placeholder="Search symbol…"
            value={watchSearch}
            onChange={(e) => setWatchSearch(e.target.value)}
          />
        </div>

        <div className="db-watch__list">
          {filteredWatch.map((s) => (
            <div className="wl-row" key={s.symbol}>
              <div className="wl-row__info">
                <span className="wl-row__sym">{s.symbol}</span>
                <span className={`wl-row__chg ${s.chg >= 0 ? "up" : "dn"}`}>
                  {s.chg >= 0 ? "▲" : "▼"} {Math.abs(s.chg).toFixed(2)}%
                </span>
              </div>
              <div className="wl-row__right">
                <Sparkline values={s.spark} up={s.chg >= 0} />
                <span className="wl-row__ltp mono">₹{s.ltp.toLocaleString("en-IN")}</span>
              </div>
              <div className="wl-row__actions">
                <button className="wl-btn wl-btn--buy"  onClick={() => navigate("/orders")}>B</button>
                <button className="wl-btn wl-btn--sell" onClick={() => navigate("/orders")}>S</button>
              </div>
            </div>
          ))}
          {filteredWatch.length === 0 && (
            <div className="db-empty">No symbols found</div>
          )}
        </div>

        {/* Market status */}
        <div className="db-watch__footer">
          <span className="db-mkt-dot" />
          <span>NSE · Market Open</span>
          <span className="db-watch__footer-time">09:15 – 15:30</span>
        </div>
      </aside>

      {/* ─────────────────────── RIGHT — MAIN ─────────────────────── */}
      <main className="db-main">

        {/* Topline strip */}
        <div className="db-strip">
          <div className="db-strip__item">
            <span className="db-strip__label">Day P&amp;L</span>
            <span className={`db-strip__val ${dayPnl >= 0 ? "up" : "dn"}`}>{fmtD(dayPnl)}</span>
            <span className={`db-strip__pct ${dayPnl >= 0 ? "up" : "dn"}`}>
              {dayPnlPct >= 0 ? "+" : ""}{dayPnlPct.toFixed(2)}%
            </span>
          </div>
          <div className="db-strip__sep" />
          <div className="db-strip__item">
            <span className="db-strip__label">Overall P&amp;L</span>
            <span className={`db-strip__val ${totalPnl >= 0 ? "up" : "dn"}`}>{fmtD(totalPnl)}</span>
            <span className={`db-strip__pct ${totalPnl >= 0 ? "up" : "dn"}`}>
              {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%
            </span>
          </div>
          <div className="db-strip__sep" />
          <div className="db-strip__item">
            <span className="db-strip__label">Margin Available</span>
            <span className="db-strip__val">{fmt(funds.availableMargin)}</span>
            <span className="db-strip__pct dim">Used {fmt(funds.usedMargin)}</span>
          </div>
          <div className="db-strip__sep" />
          <div className="db-strip__item">
            <span className="db-strip__label">Open Positions</span>
            <span className="db-strip__val">{openPositionsCount}</span>
            <span className="db-strip__pct dim">{fnoCount} F&amp;O · {equityCount} Eq</span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="db-cards">
          <div className="db-card">
            <div className="db-card__label">Portfolio Value</div>
            <div className="db-card__val mono">{fmt(portfolioValue)}</div>
            <div className={`db-card__sub ${totalPnl >= 0 ? "up" : "dn"}`}>
              {fmtD(totalPnl)} · {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%
            </div>
            <div className="db-card__bg-icon">◈</div>
          </div>

          <div className="db-card">
            <div className="db-card__label">Invested</div>
            <div className="db-card__val mono">{fmt(totalInvested)}</div>
            <div className="db-card__sub dim">{enrichedHoldings.length} stocks</div>
            <div className="db-card__bg-icon">⊞</div>
          </div>

          <div className="db-card">
            <div className="db-card__label">Available Margin</div>
            <div className="db-card__val mono">{fmt(funds.availableMargin)}</div>
            <div className="db-card__sub dim">Used {fmt(funds.usedMargin)}</div>
            <div className="db-card__bg-icon">◎</div>
          </div>

          <div className="db-card db-card--action" onClick={() => navigate("/positions")}>
            <div className="db-card__label">Open Positions</div>
            <div className="db-card__val mono">{openPositionsCount}</div>
            <div className="db-card__sub dim">{fnoCount} F&amp;O · {equityCount} Equity</div>
            <div className="db-card__arrow">→</div>
          </div>
        </div>

        {/* Chart + Recent Orders */}
        <div className="db-mid">
          <div className="db-panel db-chart-panel">
            <div className="db-panel__hd">
              <span className="db-panel__title">Portfolio Performance</span>
              <div className="db-range">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    className={`db-range__btn${range === r ? " active" : ""}`}
                    onClick={() => setRange(r)}
                  >{r}</button>
                ))}
              </div>
            </div>

            <div className="db-chart__val-row">
              <span className="db-chart__big mono">{fmt(portfolioValue)}</span>
              <span className={`db-chart__chg ${isUp ? "up" : "dn"}`}>
                {isUp ? "▲" : "▼"} {fmtD(totalPnl)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%)
              </span>
            </div>

            <div className="db-chart__wrap">
              {loading ? (
                <div className="db-empty">Loading…</div>
              ) : (
                <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" className="db-chart__svg">
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={isUp ? "var(--green)" : "var(--red)"} stopOpacity="0.22" />
                      <stop offset="100%" stopColor={isUp ? "var(--green)" : "var(--red)"} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#g1)" />
                  <path d={line} fill="none"
                    stroke={isUp ? "var(--green)" : "var(--red)"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="db-panel db-orders-panel">
            <div className="db-panel__hd">
              <span className="db-panel__title">Recent Orders</span>
              <button className="db-panel__link" onClick={() => navigate("/orders")}>View all →</button>
            </div>
            <div className="db-orders__list">
              {recentOrders.length === 0 && !loading && (
                <div className="db-empty">No orders yet.<br />
                  <button className="db-link-btn" onClick={() => navigate("/orders")}>Place an order →</button>
                </div>
              )}
              {recentOrders.map((o) => (
                <div className="ord-row" key={o._id || `${o.name}-${o.createdAt}`}>
                  <div>
                    <div className="ord-row__name">{o.name}</div>
                    <div className="ord-row__qty">Qty {o.qty}</div>
                  </div>
                  <div className="ord-row__right">
                    <span className={`ord-mode ${(o.mode || "").toLowerCase()}`}>{o.mode}</span>
                    <span className="mono ord-row__price">₹{Number(o.price).toLocaleString("en-IN")}</span>
                    <span className={`ord-status s-${orderColor(o.status)}`}>
                      {o.status || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Holdings table */}
        <div className="db-panel db-hold-panel">
          <div className="db-panel__hd">
            <span className="db-panel__title">Holdings</span>
            <div className="db-tabs">
              {[["all","All"],["gainers","Gainers ▲"],["losers","Losers ▼"]].map(([k,l]) => (
                <button
                  key={k}
                  className={`db-tab${holdingsFilter === k ? " active" : ""}`}
                  onClick={() => setHoldingsFilter(k)}
                >{l}</button>
              ))}
            </div>
            <button className="db-panel__link" onClick={() => navigate("/holdings")}>View all →</button>
          </div>

          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg Cost</th>
                  <th>LTP</th>
                  <th>Current Value</th>
                  <th>P&amp;L</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.length === 0 && (
                  <tr><td colSpan={7} className="db-empty">
                    {loading ? "Loading holdings…" : "No holdings to show"}
                  </td></tr>
                )}
                {filteredHoldings.map((h) => (
                  <tr key={h._id || h.name} className="db-table__row">
                    <td className="db-table__sym">{h.name}</td>
                    <td className="mono">{h.qty}</td>
                    <td className="mono">₹{h.avgCost.toFixed(2)}</td>
                    <td className="mono">₹{h.ltp.toFixed(2)}</td>
                    <td className="mono">₹{h.currentVal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                    <td className={`mono ${h.pnl >= 0 ? "up" : "dn"}`}>{fmtD(h.pnl)}</td>
                    <td>
                      <span className={`pct-chip ${h.pct >= 0 ? "up" : "dn"}`}>
                        {h.pct >= 0 ? "▲" : "▼"} {Math.abs(h.pct).toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;