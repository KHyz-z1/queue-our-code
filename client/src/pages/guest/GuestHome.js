import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import MobileGuestNav from "../../components/MobileGuestNav";
import RideCard from "../../components/RideCard";
import RideFilters from "../../components/RideFilters";

const API = `${(process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/rides`;
const API_BASE = (process.env.REACT_APP_API_BASE || "http://localhost:5000").replace(/\/$/, "");

const CATEGORIES = ["All", "Attractions", "Kiddie Rides", "Family Rides", "Teen/Adult Rides", "Extreme Rides"];

export default function GuestHome() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("waiting");
  const deb = useRef(null);
  const [expandedMap, setExpandedMap] = useState({});

  // fetchRides is stable via useCallback -> can be used as dependency
  const fetchRides = useCallback(async () => {
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
  }, [q, category, sort]); // depends on q/category/sort

  // initial load (safe to include fetchRides in deps)
  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // debounce reload on q/category/sort changes (fetchRides already depends on them)
  useEffect(() => {
    clearTimeout(deb.current);
    deb.current = setTimeout(() => fetchRides(), 250);
    return () => clearTimeout(deb.current);
  }, [fetchRides]);

  function toggleExpand(id) {
    setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleReset() {
    setQ("");
    setCategory("All");
    setSort("waiting");
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <MobileGuestNav />

      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col px-3 sm:px-6 py-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <a href="/guest/account" className="block">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">📱</div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">My QR</div>
                  <div className="text-xs text-slate-500">Quick access</div>
                </div>
                <div className="ml-auto text-slate-400">›</div>
              </div>
            </a>

            <a href="/guest/queues" className="block">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">🎟️</div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">My Queues</div>
                  <div className="text-xs text-slate-500">Active & history</div>
                </div>
                <div className="ml-auto text-slate-400">›</div>
              </div>
            </a>
          </div>

          <RideFilters
            q={q}
            setQ={setQ}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
            categories={CATEGORIES}
            onReset={handleReset}
          />

          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-semibold">Rides Available</h3>
            <div className="text-sm text-slate-500">{loading ? "Loading..." : `Showing ${rides.length} results`}</div>
          </div>
        </div>

        <div className="mt-3 flex-1 min-h-0">
          <div className="overflow-y-auto px-0 py-2">
            <div className="space-y-4">
              {rides.map(r => (
                <RideCard
                  key={r.id}
                  ride={r}
                  apiBase={API_BASE}
                  expanded={!!expandedMap[r.id]}
                  onToggleExpand={() => toggleExpand(r.id)}
                />
              ))}
              {rides.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-500">No rides found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
