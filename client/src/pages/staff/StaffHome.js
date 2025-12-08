// client/src/pages/staff/StaffHome.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";

const CATEGORY_BADGES = {
  Attractions: "bg-emerald-500",
  "Kiddie Rides": "bg-blue-400",
  "Family Rides": "bg-yellow-500",
  "Teen/Adult Rides": "bg-violet-600",
  "Extreme Rides": "bg-red-500",
};

const STATUS_CLASS = {
  open: "bg-emerald-500 text-white",
  closed: "bg-slate-300 text-slate-800",
  maintenance: "bg-red-400 text-white",
};

export default function StaffHome() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  useEffect(() => {
    loadRides();
    // eslint-disable-next-line
  }, []);

  async function loadRides() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/staff/rides");
      setRides(res.data.rides || []);
    } catch (err) {
      console.error("load rides err", err);
      setMsg("Could not load rides");
      setRides([]);
    } finally {
      setLoading(false);
    }
  }

  async function togglePin(rideId, targetPinned) {
    try {
      const res = await api.post(`/admin/rides/${rideId}/pin`, { pinned: targetPinned });
      setMsg(res.data.msg || (targetPinned ? "Pinned" : "Unpinned"));
      await loadRides();
    } catch (err) {
      console.error("pin err", err);
      setMsg(err.response?.data?.msg || "Pin failed");
    }
  }

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return (rides || [])
      .filter((r) => {
        const matchesSearch = !lower || (r.name || "").toLowerCase().includes(lower);
        const matchesCat = filterCat === "All" || (r.category || "") === filterCat;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.queueCount || 0) - (a.queueCount || 0);
      });
  }, [rides, search, filterCat]);

  function getImgSrc(r) {
    if (!r) return null;
    if (!r.image) return null;
    if (r.image.startsWith("http")) return r.image;
    const base = (process.env.REACT_APP_API_BASE || "http://localhost:5000").replace(/\/$/, "");
    return `${base}${r.image}`;
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Staff — Rides</h1>
            <p className="text-sm text-slate-500 mt-1">Manage rides, queues and quick staff actions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
            <input
              type="search"
              placeholder="Search ride..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            />

            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white flex-shrink-0"
            >
              <option>All</option>
              <option>Attractions</option>
              <option>Kiddie Rides</option>
              <option>Family Rides</option>
              <option>Teen/Adult Rides</option>
              <option>Extreme Rides</option>
            </select>

            <button
              onClick={() => {
                setSearch("");
                setFilterCat("All");
              }}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm flex-shrink-0"
            >
              Reset
            </button>
          </div>
        </header>

        {msg && (
          <div className="mb-4 text-sm text-red-600">
            {msg}
          </div>
        )}

        <section>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse p-4">
                  <div className="h-36 bg-slate-100 rounded-md" />
                  <div className="mt-3 h-3 bg-slate-100 rounded w-1/2" />
                </Card>
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-sm text-slate-500 p-4">No rides found.</div>
            ) : (
              filtered.map((r) => {
                const id = String(r.id ?? r._id ?? "");
                const img = getImgSrc(r);
                return (
                  <Card key={id} className="p-0 overflow-hidden flex flex-col h-full">
                    {/* Image */}
                    <div className="h-40 bg-slate-100 shrink-0">
                      {img ? (
                        <img src={img} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>
                      )}
                    </div>

                    <div className="p-3 sm:p-4 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-lg font-semibold text-slate-900 truncate">{r.name}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            ID: {id} • Cap: <span className="font-medium">{r.capacity}</span> • {r.duration ?? "-"} min
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {r.pinned && (
                            <div className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">PINNED</div>
                          )}
                          <div className={`text-xs uppercase px-2 py-1 rounded-full ${STATUS_CLASS[r.status] || "bg-slate-200 text-slate-800"}`}>
                            {r.status}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          colorClass={CATEGORY_BADGES[r.category] || "bg-gray-400"}
                          className="text-xs px-2 py-1 shrink-0"
                        >
                          {r.category || "Attractions"}
                        </Badge>

                        <div className="text-sm text-slate-700 line-clamp-2">{r.shortDescription || (r.description ? `${r.description.slice(0, 120)}...` : "No description")}</div>
                      </div>

                      <div className="mt-auto pt-2 flex flex-wrap items-center justify-between gap-y-3">
                        <div>
                          <div className="text-2xl font-extrabold leading-none">{r.queueCount ?? 0}</div>
                          <div className="text-xs text-slate-500">in queue</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => togglePin(id, !r.pinned)}
                            className="px-3 py-1 text-sm whitespace-nowrap"
                          >
                            {r.pinned ? "Unpin" : "Pin"}
                          </Button>

                          {r.status !== "open" ? (
                            <Button variant="secondary" className="px-3 py-1 text-sm whitespace-nowrap opacity-50 cursor-not-allowed">
                              Closed
                            </Button>
                          ) : (
                            <Link to={`/staff/rides/${id}`} className="inline-block">
                              <Button variant="primary" className="px-3 py-1 text-sm whitespace-nowrap">
                                Manage
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}