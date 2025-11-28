// client/src/pages/guest/GuestHome.js
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import GuestSidebar from "../../components/GuestSidebar";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import MobileGuestNav from "../../components/MobileGuestNav";


const API = `${(process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/rides`;
const API_BASE = (process.env.REACT_APP_API_BASE || "http://localhost:5000").replace(/\/$/, "");

const categoryColors = {
  "Attractions": "bg-emerald-500",
  "Kiddie Rides": "bg-blue-500",
  "Family Rides": "bg-yellow-500",
  "Teen/Adult Rides": "bg-violet-600",
  "Extreme Rides": "bg-red-500",
};

const CATEGORIES = ['All', 'Attractions', 'Kiddie Rides', 'Family Rides', 'Teen/Adult Rides', 'Extreme Rides'];

export default function GuestHome() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("waiting");
  const deb = useRef(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line
  }, []);

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
      setRides(res.data.rides || []);
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
    <div className="flex min-h-screen bg-slate-50">
      <MobileGuestNav />
      <GuestSidebar />

      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Guest Dashboard</h2>

          {/* Top: cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="flex flex-col items-center justify-center">
              <div className="text-2xl mb-2">📱</div>
              <div className="font-semibold">My QR</div>
              <div className="text-sm text-slate-500 mt-1">Show to staff to verify</div>
              <a href="/guest/account" className="mt-3">
                <Button variant="primary">Open</Button>
              </a>
            </Card>

            <Card className="flex flex-col items-center justify-center">
              <div className="text-2xl mb-2">🎟️</div>
              <div className="font-semibold">My Queues</div>
              <div className="text-sm text-slate-500 mt-1">View active and past queues</div>
              <a href="/guest/queues" className="mt-3">
                <Button variant="primary">Open</Button>
              </a>
            </Card>
          </div>

          {/* Search & filters */}
          <div className="flex gap-3 items-center mb-6">
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white"
              placeholder="Search rides by name"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="waiting">Least busy</option>
              <option value="congestion">Most busy</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="mb-2 text-sm text-slate-600">{loading ? "Loading..." : `Showing ${rides.length} results`}</div>

          {/* Rides list */}
          <div className="space-y-4">
            {rides.map(r => (
              <article key={r.id} className="flex gap-4 items-start bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="w-40 h-28 flex-shrink-0 bg-gray-100">
                  <img src={r.image ? `${API_BASE}${r.image}` : "/placeholder.png"} alt={r.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 p-3 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="text-lg font-bold truncate">{r.name}</div>
                    <Badge colorClass={categoryColors[r.category] || "bg-gray-400"}>{r.category || "—"}</Badge>
                  </div>

                  <div className="text-sm text-slate-500 mt-1">Capacity: {r.capacity} • Duration: {r.duration ?? '—'} min</div>

                  <div className={`mt-3 text-sm text-slate-700 ${expanded[r.id] ? "" : "line-clamp-2"}`} style={{ maxHeight: expanded[r.id] ? 220 : 40 }}>
                    {r.description || "No description available."}
                  </div>

                  {r.description && r.description.length > 120 && (
                    <button className="mt-2 text-sm text-sky-600 font-semibold" onClick={() => toggleExpand(r.id)}>
                      {expanded[r.id] ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>

                <div className="p-3 flex flex-col items-center justify-center min-w-[110px]">
                  <div className="text-2xl font-extrabold text-sky-900">{r.waitingCount}</div>
                  <div className="text-xs text-slate-500">in queue</div>
                  <a href={`/guest/ride/${r.id}`} className="mt-3 w-full">
                    <Button variant="primary" className="w-full">View</Button>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
