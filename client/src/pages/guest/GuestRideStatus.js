// client/src/pages/guest/GuestRideStatus.js
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MobileGuestNav from "../../components/MobileGuestNav";
import Card from "../../ui/Card";
import api from "../../utils/api";

// --- TIMER HELPER FUNCTIONS ---

function pad2(n) { return String(Math.max(0, Math.floor(n))).padStart(2, '0'); }

function formatMs(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0) return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
  return `${pad2(mm)}:${pad2(ss)}`;
}

// --- SLOT COMPONENT (Tailwind) ---

function Slot({ entry, emptyLabel, highlight }) {
  return (
    <div
      className={`w-24 h-24 rounded-xl flex flex-col items-center justify-center text-center p-2 border 
      ${entry ? "bg-white" : "bg-slate-100"} 
      ${highlight ? "border-green-500 border-2" : "border-slate-200"}`} // Increased border-2 for visibility
      style={{ minWidth: '6rem' }}
    >
      {entry ? (
        <>
          <div className="font-semibold truncate max-w-[80px]">
            {entry.user?.name ||
              entry.userName ||
              entry.user?.id ||
              (typeof entry.user === "string" ? entry.user : "Guest")}
          </div>
          <div className="text-xs text-slate-500 mt-1">Pos {entry.position}</div>
        </>
      ) : (
        <div className="text-slate-400 text-sm">{emptyLabel || "Empty"}</div>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function GuestRideStatus() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timer states and refs
  const [timeLeftMs, setTimeLeftMs] = useState(null);
  const [isBoarding, setIsBoarding] = useState(false);
  const [showFiveMinBanner, setShowFiveMinBanner] = useState(false);
  
  // Ref to track if notifications have been sent for the current state
  const notifiedRef = useRef({ fiveMin: false, boardNow: false });
  // Ref for the interval ID
  const tickRef = useRef(null);
  // Ref to store the parameters used to compute the current ETA
  const watchedRef = useRef(null); 

  // --- DATA LOADING ---

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/rides/${rideId}/visual`);
      setData(res.data);

      // Try to get viewer identity (optional)
      try {
        const meRes = await api.get("/auth/me");
        setMe(meRes.data.user?.id || null);
      } catch {
        setMe(null);
      }
    } catch (err) {
      console.error("load ride visual err", err);
      setError(err.response?.data?.msg || "Could not load ride data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [rideId]);

  // --- ETA CALCULATION & USER ENTRY ---

  // Derive current viewer entry (if any) from data + me
  const myEntry = useMemo(() => {
    if (!data || !me) return null;
    const all = (data.currentBatch || []).concat(data.upcomingBatch || [], data.waiting || []);
    // Normalize user ID comparison
    return all.find(e => {
      if (!e || !e.user) return false;
      const uid = e.user.id || e.user._id || e.user;
      return String(uid) === String(me);
    }) || null;
  }, [data, me]);

  // Compute target time for given entry
  function computeTargetTimeForEntry(entry) {
    if (!entry) return null;
    const joined = entry.joinedAt ? new Date(entry.joinedAt) : (entry.createdAt ? new Date(entry.createdAt) : new Date());
    const ride = data?.ride || {};
    const durationMinutes = Number(ride.duration || entry.rideDuration || entry.duration || 5);
    const capacity = Number(ride.capacity || entry.rideCapacity || entry.capacity || 1);
    const pos = Number(entry.position || 1);

    const batchNumber = Math.max(1, Math.ceil(pos / Math.max(1, capacity)));
    const minutesUntilStart = (batchNumber - 1) * durationMinutes;

    const target = new Date(joined.getTime() + minutesUntilStart * 60000);
    return { target, minutesUntilStart, batchNumber, capacity, durationMinutes };
  }

  // Notification helper
  function sendBrowserNotification(title, body) {
    try {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      new Notification(title, { body });
    } catch (e) {
      console.warn("notify failed", e);
    }
  }

  // --- TIMER EFFECT (Optimized for single-trigger) ---

  useEffect(() => {
    // 1. CLEANUP PREVIOUS INTERVAL
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    // 2. RESET STATES AND REFS (CRUCIAL for accuracy)
    notifiedRef.current = { fiveMin: false, boardNow: false };
    setShowFiveMinBanner(false);
    setIsBoarding(false);
    setTimeLeftMs(null);
    watchedRef.current = null;

    if (!myEntry || !data) return () => { }; // Exit if no entry or data

    // 3. INITIAL SETUP
    const computed = computeTargetTimeForEntry(myEntry);
    watchedRef.current = {
      entryId: myEntry.id || myEntry._id,
      computed
    };

    // Check for existing notifications permissions once
    const notificationPermission = typeof Notification !== "undefined" ? Notification.permission : "default";

    function tick() {
      const now = Date.now();
      const tgt = watchedRef.current?.computed?.target?.getTime();
      if (!tgt) {
        setTimeLeftMs(null);
        return;
      }
      const ms = tgt - now;
      setTimeLeftMs(ms);

      // 5-MINUTE NOTIFICATION (Single Trigger)
      if (ms <= 5 * 60 * 1000 && ms > 0 && !notifiedRef.current.fiveMin) {
        notifiedRef.current.fiveMin = true;
        setShowFiveMinBanner(true);

        const title = "Queue Reminder — 5 Minutes";
        const body = `You're ~5 minutes away from ${data.ride?.name || 'your ride'}`;

        if (notificationPermission === "granted") {
          sendBrowserNotification(title, body);
        } else if (notificationPermission === "default") {
          Notification.requestPermission().then(p => {
            if (p === "granted") sendBrowserNotification(title, body);
          });
        }
      }

      // BOARD NOW NOTIFICATION (Single Trigger)
      if (ms <= 0 && !notifiedRef.current.boardNow) {
        notifiedRef.current.boardNow = true;
        setIsBoarding(true);
        setShowFiveMinBanner(false); // Hide the 5-min banner

        const title = "It's Your Turn — Board Now";
        const body = `Please head to ${data.ride?.name || 'the ride'}`;

        if (notificationPermission === "granted") {
          sendBrowserNotification(title, body);
        } else if (notificationPermission === "default") {
          Notification.requestPermission().then(p => {
            if (p === "granted") sendBrowserNotification(title, body);
          });
        }
      }
    }

    // Run immediately then every second
    tick();
    tickRef.current = setInterval(tick, 1000);

    // Cleanup function
    return () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
    // Dependencies: Restart timer if the user's entry (id, position) or ride parameters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEntry?.id, myEntry?.position, data?.ride?.capacity, data?.ride?.duration, data?.ride?.id]);


  // --- RENDERING ---

  if (loading)
    return (
      <>
        <MobileGuestNav />
        <div className="p-4">Loading...</div>
      </>
    );

  if (error || !data)
    return (
      <>
        <MobileGuestNav />
        <div className="p-4">Error: {error || "Couldn’t load ride data."}</div>
      </>
    );

  const ride = data.ride;
  const capacity = ride.capacity || 1;

  const current = data.currentBatch || [];
  const upcoming = data.upcomingBatch || [];
  const waiting = data.waiting || [];

  const buildSlots = (entries, length) => {
    const arr = [];
    for (let i = 0; i < length; i++) arr.push(entries[i] || null);
    return arr;
  };

  const currentSlots = buildSlots(current, capacity);
  const upcomingSlots = buildSlots(upcoming, capacity);
  const waitingSlots =
    waiting.length > 0
      ? waiting
      : Array.from({ length: capacity }).map(() => null);

  // Helper to check for highlight status (current user)
  const isMyEntry = (s) => s && me && s.user && (String(s.user.id || s.user._id || s.user) === String(me));


  return (
    <>
      {/* 🔵 TOP NAVIGATION */}
      <MobileGuestNav />

      {/* 🔵 MAIN CONTENT */}
      <div className="max-w-3xl mx-auto p-4 pb-24">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">{ride.name}</h1>
            <p className="text-slate-500 text-sm">
              {ride.status} • Capacity: {capacity} • Duration: {ride.duration ?? '-'} min
            </p>
          </div>

          <div className="flex gap-3 items-center">
            {/* TIMER DISPLAY */}
            {myEntry ? (
              <div className="text-right">
                <div className="text-xs text-slate-500">Your ETA</div>
                <div className={`font-extrabold text-lg ${isBoarding ? 'text-green-700' : 'text-sky-800'}`}>
                  {timeLeftMs === null ? "—" : (isBoarding ? "Board now!" : formatMs(timeLeftMs))}
                </div>
                {showFiveMinBanner && !isBoarding && (
                  <div className="mt-1 text-xs text-amber-900 bg-amber-50 p-1 rounded">
                    ~5 min left — get ready
                  </div>
                )}
              </div>
            ) : (
              <div className="text-right">
                <div className="text-xs text-slate-500">Not in queue</div>
              </div>
            )}

            <button
              onClick={load}
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm shadow-sm hover:bg-sky-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* CURRENT BATCH */}
        <Card className="mb-4">
          <h2 className="font-semibold mb-2">Current Batch</h2>
          <div className="flex flex-wrap gap-3">
            {currentSlots.map((s, i) => (
              <Slot
                key={`c-${i}`}
                entry={s}
                emptyLabel="Empty"
                highlight={isMyEntry(s)}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Guests currently boarding / on the ride.</p>
        </Card>

        {/* UPCOMING */}
        <Card className="mb-4">
          <h2 className="font-semibold mb-2">Upcoming Batch</h2>
          <div className="flex flex-wrap gap-3">
            {upcomingSlots.map((s, i) => (
              <Slot
                key={`u-${i}`}
                entry={s}
                emptyLabel="Empty"
                highlight={isMyEntry(s)}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Next guests to board (based on queue order).</p>
        </Card>

        {/* WAITING LIST */}
        <Card className="mb-4">
          <h2 className="font-semibold mb-2">Waiting ({waiting.length})</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {waitingSlots.map((s, i) => (
              <div key={`w-${i}`} className="flex-none">
                <Slot
                  entry={s}
                  emptyLabel="Empty"
                  highlight={isMyEntry(s)}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Guests waiting in the queue. Highlighted slot is you (if you are in queue).
          </p>
        </Card>

        {/* BACK BUTTON */}
        <div className="mt-6">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
          >
            Back
          </button>
        </div>
      </div>
    </>
  );
}