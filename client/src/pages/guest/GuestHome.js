// client/src/pages/guest/GuestHome.js
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import GuestSidebar from "../../components/GuestSidebar";

const API = `${(process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/rides`;
const API_BASE = (process.env.REACT_APP_API_BASE || "http://localhost:5000").replace(/\/$/, "");


// color map aligned with staff page
const categoryColors = {
  "Attractions": "#10b981",
  "Kiddie Rides": "#3b82f6",
  "Family Rides": "#f59e0b",
  "Teen/Adult Rides": "#6366f1",
  "Extreme Rides": "#ef4444"
};

const CATEGORIES = ['All', 'Attractions', 'Kiddie Rides', 'Family Rides', 'Teen/Adult Rides', 'Extreme Rides'];

export default function GuestHome() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('waiting'); // waiting | name | congestion
  const deb = useRef(null);
  const [expanded, setExpanded] = useState({}); // map rideId -> bool

  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line
  }, []);

  // debounce when q/category/sort change
  useEffect(() => {
    clearTimeout(deb.current);
    deb.current = setTimeout(() => {
      fetchRides();
    }, 300);
    return () => clearTimeout(deb.current);
    // eslint-disable-next-line
  }, [q, category, sort]);

  async function fetchRides() {
    setLoading(true);
    try {
      const params = { sort };
      if (q && q.trim()) params.q = q.trim();
      if (category && category !== 'All') params.category = category;
      const res = await axios.get(API, { params });
      const list = res.data.rides || [];
      setRides(list);
    } catch (err) {
      console.error("load rides err", err);
      setRides([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f7fb" }}>
      <GuestSidebar />

      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={centeredContentStyle}>
          <h2 style={{ marginBottom: 16 }}>Guest Dashboard</h2>

          {/* Top Navigation Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <a href="/guest/account" style={cardStyle}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>📱</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>My QR</div>
            </a>

            <a href="/guest/queues" style={cardStyle}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>🎟️</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>My Queues</div>
            </a>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
            <input placeholder="Search rides by name" value={q} onChange={e => setQ(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }} />
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>
              <option value="waiting">Least busy</option>
              <option value="congestion">Most busy</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Ride List Header */}
          <h3 style={{ marginBottom: 8 }}>Rides Available</h3>
          <div style={{ marginBottom: 15, color: '#6b7280', fontSize: 13 }}>
            {loading ? 'Loading ride data...' : `Showing ${rides.length} results`}
          </div>

          {/* Ride List */}
          <div style={{ display: "grid", gap: 16 }}>
            {rides.map((r) => (
              <article key={r.id} style={rideCardStyle}>
                <div style={{ width: 200, height: 120, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: '#f3f4f6' }}>
                  <img
                    src={r.image ? `${API_BASE}${r.image}` : "/placeholder.png"}
                    alt={r.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                {/* Middle: Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>

                  {/* Name and Category Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: categoryColors[r.category] || '#9ca3af',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      {r.category || '—'}
                    </div>
                  </div>

                  {/* Capacity and Duration Info */}
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Capacity: {r.capacity} • Duration: {r.duration ?? '—'} min
                  </div>

                  {/* Description + show more */}
                  <div style={{ marginTop: 8, color: '#374151' }}>
                    <div style={{
                      maxHeight: expanded[r.id] ? 220 : 39, 
                      overflow: 'hidden',
                      transition: 'max-height 180ms ease',
                      lineHeight: '1.3em',
                      fontSize: 14
                    }}>
                      {r.description || 'No description available.'}
                    </div>

                    {r.description && r.description.length > 100 && ( 
                      <button onClick={() => toggleExpand(r.id)} style={showMoreBtn}>
                        {expanded[r.id] ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Queue Count and Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: 10, minWidth: 100 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#062353ff', lineHeight: 1 }}>{r.waitingCount}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>in queue</div>
                  <a href={`/guest/ride/${r.id}`} style={viewBtnStyle}>View Details</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Styles --- */
const centeredContentStyle = {
  maxWidth: 680, 
  width: '100%'
};

const cardStyle = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: 20, background: "#ffffff", borderRadius: 10, textDecoration: "none",
  color: "#333", boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
};

const rideCardStyle = {
  display: 'flex',
  gap: 12, 
  alignItems: 'stretch', 
  padding: 12, 
  background: '#fff',
  borderRadius: 10,
  border: '1px solid #e6edf3',
  boxShadow: '0 4px 10px rgba(13,20,30,0.03)' 
};

const viewBtnStyle = {
  padding: "8px 10px",
  background: "#0369a1",
  color: "#fff",
  borderRadius: 6,
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
  textAlign: 'center'
};

const showMoreBtn = {
  marginTop: 6, 
  padding: '4px 8px', 
  borderRadius: 4,
  border: 'none',
  background: '#eef2ff',
  color: '#1e3a8a',
  cursor: 'pointer',
  fontSize: 12
};