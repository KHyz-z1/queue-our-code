// client/src/components/RideFilters.js
import React from "react";
import Card from "../ui/Card";

/**
 * Props:
 * - q, setQ
 * - category, setCategory
 * - sort, setSort
 * - categories (array)
 * - onReset (fn)
 */
export default function RideFilters({ q, setQ, category, setCategory, sort, setSort, categories = [], onReset }) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search rides by name"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          />
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          >
            <option value="waiting">Least busy</option>
            <option value="congestion">Most busy</option>
            <option value="name">Name</option>
          </select>

          <button
            onClick={onReset}
            className="px-2 py-2 rounded-lg text-sm bg-slate-100 border border-slate-200"
            type="button"
          >
            Reset
          </button>
        </div>
      </div>
    </Card>
  );
}
