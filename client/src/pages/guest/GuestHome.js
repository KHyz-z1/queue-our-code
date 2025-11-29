// client/src/pages/guest/GuestHome.js
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import MobileGuestNav from "../../components/MobileGuestNav";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import Card from "../../ui/Card";

const API = `${(process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/rides`;
const API_BASE = (process.env.REACT_APP_API_BASE || "http://localhost:5000").replace(/\/$/, "");

const categoryColors = {
  "Attractions": "bg-[#5c5f7c]",
  "Kiddie Rides": "bg-[#b29758]",
  "Family Rides": "bg-[#c3c0c0]",
  "Teen/Adult Rides": "bg-[#404472]",
  "Extreme Rides": "bg-[#191c40]",
};

const CATEGORIES = ["All", "Attractions", "Kiddie Rides", "Family Rides", "Teen/Adult Rides", "Extreme Rides"];

export default function GuestHome() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("waiting");
  const deb = useRef(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { fetchRides(); }, []);

  useEffect(() => {
    clearTimeout(deb.current);
    deb.current = setTimeout(fetchRides, 300);
    return () => clearTimeout(deb.current);
  }, [q, category, sort]);

  async function fetchRides() {
    setLoading(true);
    try {
      const params = { sort };
      if (q && q.trim()) params.q = q.trim();
      if (category && category !== "All") params.category = category;
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

  // header + controls total height estimate (px). Adjust if you change visuals.
  const controlsHeight = 220; // header (approx) + tiles + filter area

  return (
    <div className="flex min-h-screen bg-[#f7f7f8] text-[#191c40] flex-col">
      <MobileGuestNav />

      {/* Main area */}
      <main className="flex-1 overflow-hidden">
        {/* top fixed area (title + tiles + search/filters) */}
        <div className="w-full px-4 sm:px-6 pt-4 bg-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <a href="/guest/account" className="block">
                <Card className="flex items-center gap-4 p-4 rounded-2xl border border-[#e6e3e3]">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#e9e7e3] flex items-center justify-center text-xl">📱</div>
                  <div>
                    <div className="text-sm font-semibold text-[#404472]">My QR</div>
                    <div className="text-xs text-slate-500">Quick access</div>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-[#b29758]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </a>

              <a href="/guest/queues" className="block">
                <Card className="flex items-center gap-4 p-4 rounded-2xl border border-[#e6e3e3]">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#e9e7e3] flex items-center justify-center text-xl">🎟️</div>
                  <div>
                    <div className="text-sm font-semibold text-[#404472]">My Queues</div>
                    <div className="text-xs text-slate-500">Active & history</div>
                  </div>
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-[#b29758]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </a>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#eaeaea] mb-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#e6e3e3] focus:outline-none focus:ring-2 focus:ring-[#b29758]/30"
                    placeholder="Search rides by name"
                  />
                </div>

                <div className="flex gap-2 items-center mt-2 sm:mt-0">
                  <select value={category} onChange={e => setCategory(e.target.value)} className="p-2 rounded-lg border text-sm bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <select value={sort} onChange={e => setSort(e.target.value)} className="p-2 rounded-lg border text-sm bg-white">
                    <option value="waiting">Least busy</option>
                    <option value="congestion">Most busy</option>
                    <option value="name">Name</option>
                  </select>

                  <button
                    onClick={() => { setQ(""); setCategory("All"); setSort("waiting"); }}
                    className="px-3 py-2 rounded-lg text-sm bg-[#f3f3f4] border border-[#e6e3e3]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-[#404472]">Rides Available</h3>
              <div className="text-sm text-slate-500">{loading ? "Loading..." : `Showing ${rides.length} results`}</div>
            </div>
          </div>
        </div>

        {/* Scrollable rides list (separate container) */}
        <div
          className="px-4 sm:px-6 pb-6"
          style={{ height: `calc(100vh - ${controlsHeight}px)`, overflow: "auto" }}
        >
          <div className="max-w-4xl mx-auto space-y-4 py-2">
            {rides.map(r => (
              <article key={r.id} className="bg-white rounded-xl border border-[#ececec] shadow-sm p-3 sm:p-4 flex gap-3 sm:gap-4 items-start">
                <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#f0f0f0]">
                  <img src={r.image ? `${API_BASE}${r.image}` : "/placeholder.png"} alt={r.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-base sm:text-lg text-[#1C2340] truncate">{r.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">Capacity {r.capacity} • {r.duration ?? "—"} min</p>
                    </div>

                    <div className="flex-shrink-0">
                      <Badge colorClass={{
                        "Attractions": "bg-[#5AA9E6]",
                        "Kiddie Rides": "bg-[#FFB74D]",
                        "Family Rides": "bg-[#A9D18E]",
                        "Teen/Adult Rides": "bg-[#5A6ACF]",
                        "Extreme Rides": "bg-[#D9534F]"
                      }[r.category] || "bg-[#E0E0E0]"}>
                        {r.category || "—"}
                      </Badge>
                    </div>
                  </div>

                  <p className={`text-sm text-slate-600 mt-2 ${expanded[r.id] ? "" : "line-clamp-2"}`}>
                    {r.description || "No description available."}
                  </p>

                  {r.description && r.description.length > 120 && (
                    <button onClick={() => toggleExpand(r.id)} className="mt-1 text-[#5A6ACF] text-xs font-medium">
                      {expanded[r.id] ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-center min-w-[80px] gap-1 sm:gap-2">
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1C2340]">{r.waitingCount}</div>
                  <div className="text-xs text-slate-500">in queue</div>

                  <a href={`/guest/ride/${r.id}`} className="mt-2 w-full">
                    <Button variant="primary" className="w-full bg-[#D4A017] hover:bg-[#B68A12] text-white">View</Button>
                  </a>
                </div>
              </article>
            ))}

            {rides.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-500">No rides found.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
