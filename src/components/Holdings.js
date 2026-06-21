import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { VerticalGraph } from "./VerticalGraph";
import { API_BASE_URL } from "../api";

const REFRESH_INTERVAL_MS = 5000;
const fmt = (n) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
const pnlClass = (v) => (v > 0 ? "text-green" : v < 0 ? "text-red" : "");

const SORT_KEYS = {
  name: (s) => s.name, qty: (s) => s.qty, avg: (s) => s.avg, price: (s) => s.price,
  curval: (s) => s.price * s.qty, pnl: (s) => s.price * s.qty - s.avg * s.qty,
  net: (s) => parseFloat(s.net), day: (s) => parseFloat(s.day),
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

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState({ key: null, dir: 1 });
  const isFetchingRef = useRef(false);

  const fetchHoldings = useCallback(async (isMounted) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await axios.get(`${API_BASE_URL}/allHoldings`);
      if (isMounted()) { setAllHoldings(res.data); setLastUpdated(new Date()); setError(null); setLoading(false); }
    } catch (err) {
      if (isMounted()) { setError(err.message || "Failed to fetch holdings."); setLoading(false); }
    } finally { isFetchingRef.current = false; }
  }, []);

  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;
    fetchHoldings(isMounted);
    const id = setInterval(() => fetchHoldings(isMounted), REFRESH_INTERVAL_MS);
    return () => { mounted = false; clearInterval(id); };
  }, [fetchHoldings]);

  const totalInvestment = allHoldings.reduce((s, h) => s + h.avg * h.qty, 0);
  const currentValue = allHoldings.reduce((s, h) => s + h.price * h.qty, 0);
  const totalPnL = currentValue - totalInvestment;
  const pnlPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  const visible = sortData(
    allHoldings.filter((s) => {
      const pnl = s.price * s.qty - s.avg * s.qty;
      if (filter === "profit") return pnl >= 0;
      if (filter === "loss") return pnl < 0;
      return true;
    }), sort
  );

  const handleSort = (key) => setSort((p) => ({ key, dir: p.key === key ? p.dir * -1 : 1 }));

  const chartData = {
    labels: allHoldings.map((s) => s.name),
    datasets: [{ label: "LTP", data: allHoldings.map((s) => s.price), backgroundColor: "rgba(15,157,140,0.15)", borderColor: "rgba(15,157,140,0.8)", borderWidth: 1 }],
  };

  return (
    <>
      <div className="cards-row">
        <div className="card">
          <div className="c-label">Invested</div>
          <div className="c-val mono">₹{fmt(totalInvestment)}</div>
        </div>
        <div className="card">
          <div className="c-label">Current value</div>
          <div className="c-val mono">₹{fmt(currentValue)}</div>
        </div>
        <div className="card">
          <div className="c-label">Total P&L</div>
          <div className={`c-val mono ${pnlClass(totalPnL)}`}>
            {totalPnL >= 0 ? "+" : ""}₹{fmt(totalPnL)} ({pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%)
          </div>
        </div>
        <div className="card">
          <div className="c-label">Holdings</div>
          <div className="c-val mono">{allHoldings.length}</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <span className="p-title">Holdings</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {lastUpdated && (
              <div className="live-pill">
                <span className="live-dot" />
                {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="profit">Profit</option>
              <option value="loss">Loss</option>
            </select>
          </div>
        </div>

        {error && <div className="error-banner" style={{ margin: "12px 16px 0" }}>⚠ {error} Showing last known data.</div>}

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortableHeader label="Instrument" sortKey="name" sortState={sort} onSort={handleSort} />
                <SortableHeader label="Qty" sortKey="qty" sortState={sort} onSort={handleSort} />
                <SortableHeader label="Avg cost" sortKey="avg" sortState={sort} onSort={handleSort} />
                <SortableHeader label="LTP" sortKey="price" sortState={sort} onSort={handleSort} />
                <SortableHeader label="Cur. val" sortKey="curval" sortState={sort} onSort={handleSort} />
                <SortableHeader label="P&L" sortKey="pnl" sortState={sort} onSort={handleSort} />
                <SortableHeader label="Net chg." sortKey="net" sortState={sort} onSort={handleSort} />
                <SortableHeader label="Day chg." sortKey="day" sortState={sort} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><span className="skeleton" style={{ width: j === 0 ? 90 : 55 }} /></td>
                  ))}</tr>
                ))
              ) : visible.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No holdings found.</td></tr>
              ) : (
                visible.map((stock, i) => {
                  const curVal = stock.price * stock.qty;
                  const pnl = curVal - stock.avg * stock.qty;
                  const pc = pnlClass(pnl);
                  const dc = stock.isLoss ? "text-red" : "text-green";
                  return (
                    <tr key={stock.name ?? i}>
                      <td className="sym-cell">{stock.name}</td>
                      <td>{stock.qty}</td>
                      <td>₹{stock.avg.toFixed(2)}</td>
                      <td>₹{stock.price.toFixed(2)}</td>
                      <td>₹{curVal.toFixed(2)}</td>
                      <td className={pc}>{pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}</td>
                      <td className={pc}>{stock.net}</td>
                      <td className={dc}>{stock.day}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && <div className="panel" style={{ marginTop: 16, padding: 16 }}><VerticalGraph data={chartData} /></div>}
    </>
  );
};

export default Holdings;