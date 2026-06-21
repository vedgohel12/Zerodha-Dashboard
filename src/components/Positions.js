import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api";

const REFRESH_INTERVAL_MS = 5000;
const fmt = (n) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
const pnlClass = (v) => (v > 0 ? "text-green" : v < 0 ? "text-red" : "");

const SORT_KEYS = {
  product: (s) => s.product, name: (s) => s.name, qty: (s) => s.qty, avg: (s) => s.avg,
  price: (s) => s.price, pnl: (s) => (s.price - s.avg) * s.qty, day: (s) => parseFloat(s.day),
};

function sortData(data, { key, dir }) {
  if (!key) return data;
  return [...data].sort((a, b) => {
    const va = SORT_KEYS[key](a), vb = SORT_KEYS[key](b);
    return typeof va === "string" ? va.localeCompare(vb) * dir : (va - vb) * dir;
  });
}

function SortableHeader({ label, sortKey, sortState, onSort }) {
  const isActive = sortState.key === sortKey;
  const icon = !isActive ? "↕" : sortState.dir === 1 ? "↑" : "↓";
  return (
    <th onClick={() => onSort(sortKey)} style={{ cursor: "pointer", userSelect: "none", color: isActive ? "var(--text)" : undefined }}>
      {label} <span style={{ opacity: isActive ? .8 : .35, fontSize: 9 }}>{icon}</span>
    </th>
  );
}

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState({ key: null, dir: 1 });
  const isFetchingRef = useRef(false);

  const fetchPositions = useCallback(async (isMounted) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await axios.get(`${API_BASE_URL}/allPositions`);
      if (isMounted()) { setPositions(res.data); setLastUpdated(new Date()); setError(null); setLoading(false); }
    } catch (err) {
      if (isMounted()) { setError(err.message || "Failed to fetch positions."); setLoading(false); }
    } finally { isFetchingRef.current = false; }
  }, []);

  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;
    fetchPositions(isMounted);
    const id = setInterval(() => fetchPositions(isMounted), REFRESH_INTERVAL_MS);
    return () => { mounted = false; clearInterval(id); };
  }, [fetchPositions]);

  const unrealised = positions.reduce((s, p) => s + (p.price - p.avg) * p.qty, 0);
  const realised = positions.reduce((s, p) => s + (p.realisedPnl ?? 0), 0);
  const totalPnL = unrealised + realised;
  const longCount = positions.filter((p) => p.qty > 0).length;
  const shortCount = positions.filter((p) => p.qty < 0).length;

  const visible = sortData(positions.filter((p) => filter === "all" || p.product === filter), sort);
  const handleSort = (key) => setSort((p) => ({ key, dir: p.key === key ? p.dir * -1 : 1 }));

  return (
    <>
      <div className="cards-row">
        <div className="card">
          <div className="c-label">Open</div>
          <div className="c-val mono">{positions.length} <span style={{ fontSize: 12, fontWeight: 400 }} className="text-dim">({longCount}L · {shortCount}S)</span></div>
        </div>
        <div className="card">
          <div className="c-label">Unrealised P&L</div>
          <div className={`c-val mono ${pnlClass(unrealised)}`}>{unrealised >= 0 ? "+" : ""}₹{fmt(unrealised)}</div>
        </div>
        <div className="card">
          <div className="c-label">Realised P&L</div>
          <div className={`c-val mono ${pnlClass(realised)}`}>{realised >= 0 ? "+" : ""}₹{fmt(realised)}</div>
        </div>
        <div className="card">
          <div className="c-label">Total P&L</div>
          <div className={`c-val mono ${pnlClass(totalPnL)}`}>{totalPnL >= 0 ? "+" : ""}₹{fmt(totalPnL)}</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <span className="p-title">Positions ({positions.length})</span>
          {lastUpdated && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="live-pill">
                <span className="live-dot" />
                {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All products</option>
                <option value="MIS">MIS</option>
                <option value="CNC">CNC</option>
              </select>
            </div>
          )}
        </div>

        {error && <div className="error-banner" style={{ margin: "12px 16px 0" }}>⚠ {error} Showing last known data.</div>}

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortableHeader label="Product" sortKey="product" sortState={sort} onSort={handleSort} />
                <SortableHeader label="Instrument" sortKey="name" sortState={sort} onSort={handleSort} />
                <SortableHeader label="Qty" sortKey="qty" sortState={sort} onSort={handleSort} />
                <SortableHeader label="Avg." sortKey="avg" sortState={sort} onSort={handleSort} />
                <SortableHeader label="LTP" sortKey="price" sortState={sort} onSort={handleSort} />
                <SortableHeader label="P&L" sortKey="pnl" sortState={sort} onSort={handleSort} />
                <SortableHeader label="Day chg." sortKey="day" sortState={sort} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><span className="skeleton" style={{ width: j <= 1 ? 80 : 55 }} /></td>
                  ))}</tr>
                ))
              ) : visible.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No positions found.</td></tr>
              ) : (
                visible.map((stock, i) => {
                  const pnl = (stock.price - stock.avg) * stock.qty;
                  const pc = pnlClass(pnl);
                  const dc = stock.isLoss ? "text-red" : "text-green";
                  const qtyLabel = stock.qty > 0 ? `+${stock.qty}` : String(stock.qty);
                  return (
                    <tr key={`${stock.name}-${i}`}>
                      <td><span className={`badge ${stock.product === "MIS" ? "badge-sell" : "badge-buy"}`}>{stock.product}</span></td>
                      <td className="sym-cell">{stock.name}</td>
                      <td className={stock.qty < 0 ? "text-red" : "text-green"}>{qtyLabel}</td>
                      <td>₹{stock.avg.toFixed(2)}</td>
                      <td>₹{stock.price.toFixed(2)}</td>
                      <td className={pc}>{pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}</td>
                      <td className={dc}>{stock.day}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Positions;