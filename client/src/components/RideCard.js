// client/src/components/RideCard.js
import React from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function RideCard({ ride, apiBase = "", expanded, onToggleExpand }) {
  const imgSrc = ride.image ? `${apiBase}${ride.image}` : "/placeholder.png";

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* LEFT: image + badge */}
        <div className="flex-shrink-0 flex flex-col items-start">
          <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden bg-slate-100">
            <img src={imgSrc} alt={ride.name} className="w-full h-full object-cover" />
          </div>

          <div className="mt-2">
            <Badge
              colorClass={
                {
                  "Attractions": "bg-[#5AA9E6]",
                  "Kiddie Rides": "bg-[#FFB74D]",
                  "Family Rides": "bg-[#A9D18E]",
                  "Teen/Adult Rides": "bg-[#5A6ACF]",
                  "Extreme Rides": "bg-[#D9534F]"
                }[ride.category] || "bg-gray-400"
              }
              className="text-xs px-2 py-1"
            >
              {ride.category || "—"}
            </Badge>
          </div>
        </div>

        {/* CENTER: main info */}
        <div className="flex-1 min-w-0">
          {/* Single-line title */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              {ride.name}
            </h4>
          </div>

          {/* capacity / duration */}
          <div className="text-xs sm:text-sm text-slate-500 mt-1">
            Capacity: <span className="font-medium text-slate-700">{ride.capacity}</span> • Duration:{" "}
            <span className="font-medium text-slate-700">{ride.duration ?? "—"}</span> min
          </div>

          <div
            className="text-sm text-slate-700 mt-2 leading-relaxed"
            style={{
              maxHeight: expanded ? 220 : 42,
              overflow: "hidden",
              transition: "max-height 220ms ease"
            }}
          >
            {ride.description || "No description available."}
          </div>

          {ride.description && ride.description.length > 110 && (
            <button
              onClick={() => onToggleExpand(ride.id)}
              className="mt-1 text-xs text-sky-700 font-medium"
              aria-expanded={!!expanded}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        <div className="flex flex-col items-center min-w-[84px] gap-1 ml-1">
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{ride.waitingCount}</div>
          <div className="text-xs text-slate-500">in queue</div>
          <a href={`/guest/ride/${ride.id}`} className="w-full mt-2">
            <Button variant="primary" className="w-full bg-[#0369a1] hover:bg-[#075b83] text-white">
              View
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}

