// client/src/pages/guest/MyQueues.js
import React, { useCallback, useEffect, useState } from "react";
import MobileGuestNav from "../../components/MobileGuestNav";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import api from "../../utils/api";

export default function MyQueues() {
  const [queues, setQueues] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [expanded, setExpanded] = useState({});

  function computeEstimate(duration, position = 1, capacity = 1) {
    if (!duration || Number(duration) <= 0) return null;
    const batchesAhead = Math.ceil(Number(position) / Number(capacity));
    const minutes = Number(duration) * batchesAhead;
    const at = new Date(Date.now() + minutes * 60 * 1000).toLocaleString();
    return { minutes, at };
  }

  function normalizeGuestFromEntry(entry) {
    const maybe = entry?.guest || entry?.user || entry?.guestId || entry?.userId || null;
    if (!maybe) {
      return {
        id: entry?.guest || entry?.guestId || entry?.user || entry?.userId || entry?.id || "unknown",
        name: entry?.guest?.name || entry?.user?.name || null,
      };
    }
    if (typeof maybe === "string") return { id: maybe, name: null };
    const id = maybe._id || maybe.id || maybe.uid || maybe.userId || String(maybe);
    const name = maybe.name || maybe.fullName || maybe.displayName || maybe.username || null;
    return { id, name };
  }

  function escapeHtml(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      const [aRes, hRes] = await Promise.all([api.get("/queue/my-queues"), api.get("/queue/history")]);
      setQueues(aRes.data.queues || []);
      setHistory(hRes.data.history || []);
    } catch (err) {
      console.error("load queues/history err", err);
      setMsg("Could not load queues");
      setQueues([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function estimateReturn(entry) {
    const ride = entry.ride || {};
    const duration = (ride && ride.duration) || entry.rideDuration || null;
    const capacity = (ride && ride.capacity) || entry.rideCapacity || 1;
    const position = entry.position || 1;
    if (!duration) return null;
    const batchesAhead = Math.ceil(position / capacity);
    const minutes = Number(duration) * batchesAhead;
    const t = new Date(Date.now() + minutes * 60 * 1000);
    return { minutes, at: t.toLocaleString() };
  }

  async function handleCancel(entryId) {
    if (!window.confirm("Cancel this queue entry?")) return;
    try {
      await api.post("/queue/leave", { entryId });
      setMsg("Cancelled");
      await loadAll();
    } catch (err) {
      console.error("cancel err", err);
      setMsg(err.response?.data?.msg || "Cancel failed");
    }
  }

  async function handlePrintStub(entry, ride) {
    try {
      const guest = normalizeGuestFromEntry(entry);
      const rideName = entry?.ride?.name || ride?.name || entry?.rideName || "Ride";
      const position = entry?.position ?? entry?.pos ?? entry?.positionNumber ?? "—";
      const duration = (ride && ride.duration) || entry?.rideDuration || null;
      const capacity = (ride && ride.capacity) || entry?.rideCapacity || 1;
      const est = computeEstimate(duration, Number(position || 1), capacity);

      const stubPayload = {
        type: "queue",
        guestName: guest.name || `Guest (${guest.id})`,
        guestId: guest.id,
        rideName,
        position,
        estimatedReturn: est,
        qr: guest.id,
      };

      if (typeof window.printStub === "function") {
        window.printStub(stubPayload);
        return;
      }

      const html = `
        <html>
        <head><meta charset="utf-8"><title>Queue Stub</title></head>
        <body style="font-family: Arial, Helvetica, sans-serif; padding:20px;">
          <h3>Queue Stub</h3>
          <div><strong>Guest:</strong> ${escapeHtml(stubPayload.guestName)}</div>
          <div><strong>UID:</strong> ${escapeHtml(stubPayload.guestId)}</div>
          <div><strong>Ride:</strong> ${escapeHtml(stubPayload.rideName)}</div>
          <div><strong>Position:</strong> ${escapeHtml(stubPayload.position)}</div>
          <div><strong>Estimated return:</strong> ${est ? `${est.minutes} min (~${escapeHtml(est.at)})` : "N/A"}</div>
          <hr/>
          <div style="margin-top:12px;">Present this stub to staff on arrival.</div>
        </body>
        </html>
      `;
      const w = window.open("", "_blank", "width=320,height=480");
      if (!w) throw new Error("Popup blocked");
      w.document.write(html);
      w.document.close();
      w.focus();
    } catch (e) {
      console.error("print stub failed", e);
      setMsg("Could not open print window. Allow pop-ups.");
    }
  }

  function toggleDetails(id) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  /* ---------- Small subcomponents ---------- */

  function DetailsPanel({ entry }) {
    const ride = entry.ride || entry.rideObj || entry.rideData || {};
    const duration = ride.duration || entry.rideDuration || null;
    const capacity = ride.capacity || entry.rideCapacity || 1;
    const position = entry.position || entry.pos || 1;
    const est = computeEstimate(duration, Number(position), capacity);
    const guest = normalizeGuestFromEntry(entry);
    const joined = entry.joinedAt || entry.createdAt || null;

    return (
      <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-100 text-sm">
        <div className="font-semibold mb-2">{ride.name || entry.rideName || "Ride"}</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-slate-500">Guest</div>
            <div className="font-medium">{guest.name || "You"}</div>
            <div className="text-xs text-slate-400">UID: {guest.id || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Queue Info</div>
            <div>Position: <strong>{position}</strong></div>
            <div>Status: <strong className="capitalize">{entry.status}</strong></div>
          </div>
        </div>

        <div className="mt-3 text-xs">
          <div className="text-xs text-slate-500">Estimated return</div>
          {est ? (
            <div className="mt-1">~{est.minutes} min • return by {est.at}</div>
          ) : (
            <div className="text-xs text-slate-400 mt-1">No duration available for this ride</div>
          )}
        </div>

        <div className="mt-2 text-xs text-slate-400">Joined: {joined ? new Date(joined).toLocaleString() : "—"}</div>
      </div>
    );
  }

  function QueueItem({ entry }) {
    const ride = entry.ride || {};
    const est = estimateReturn(entry);
    return (
      <Card className="p-3">
        <div className="flex gap-3 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-base truncate">{ride.name || entry.rideName || "Ride"}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Position {entry.position} • Joined: {new Date(entry.joinedAt || entry.createdAt).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  UID: {getUserId(entry.user) || "—"} {getUserName(entry.user) ? `• ${getUserName(entry.user)}` : ""}
                </div>
                {est && <div className="text-xs text-slate-500 mt-1">Est return: ~{est.minutes} min ({est.at})</div>}
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-2xl font-extrabold text-slate-800">{entry.position}</div>
                <div className="text-xs text-slate-400">in queue</div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              {entry.status === "waiting" && (
                <Button variant="danger" onClick={() => handleCancel(entry.id)} className="px-3 py-1 text-xs">
                  Cancel
                </Button>
              )}

              <Button variant="secondary" onClick={() => toggleDetails(entry.id)} className="px-3 py-1 text-xs">
                {expanded[entry.id] ? "Hide details" : "Details"}
              </Button>

              <Button variant="secondary" onClick={() => handlePrintStub(entry, ride)} className="px-3 py-1 text-xs">
                Print Stub
              </Button>
            </div>

            {expanded[entry.id] && <DetailsPanel entry={entry} />}
          </div>
        </div>
      </Card>
    );
  }

  function HistoryItem({ entry }) {
    return (
      <Card className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">{entry.ride?.name || entry.rideName || "Ride"}</div>
            <div className="text-xs text-slate-500 mt-1">
              Position {entry.position} • {entry.status} • {new Date(entry.joinedAt || entry.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div>
              <Button variant="secondary" onClick={() => toggleDetails(entry.id)} className="px-3 py-1 text-xs">
                {expanded[entry.id] ? "Hide details" : "Details"}
              </Button>
            </div>
          </div>
        </div>

        {expanded[entry.id] && (
          <div className="mt-3 p-2 bg-slate-50 rounded-sm border border-slate-100 text-sm">
            <div className="font-medium">{entry.ride?.name}</div>
            <div>Position: {entry.position}</div>
            <div>Status: {entry.status}</div>
            {entry.removedAt && <div>Removed at: {new Date(entry.removedAt).toLocaleString()}</div>}
            {entry.completedAt && <div>Completed at: {new Date(entry.completedAt).toLocaleString()}</div>}
          </div>
        )}
      </Card>
    );
  }

  function getUserId(u) {
    if (!u) return null;
    if (typeof u === "string") return u;
    if (u.id) return u.id;
    if (u._id) return typeof u._id === "object" ? u._id.toString() : u._id;
    if (u.userId) return u.userId;
    return null;
  }
  function getUserName(u) {
    if (!u) return null;
    if (typeof u === "string") return null;
    return u.name || u.username || u.userName || null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <MobileGuestNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Queues</h2>
          <div className="text-sm text-slate-500">{loading ? "Loading..." : `${queues.length} active`}</div>
        </div>

        {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

        <section className="mb-6">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Active / Waiting</h3>

          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : queues.length === 0 ? (
              <div className="text-sm text-slate-500">No active queues</div>
            ) : (
              queues.map((q) => <QueueItem key={q.id} entry={q} />)
            )}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-medium text-slate-700 mb-2">History (Cancelled / Completed)</h3>

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-sm text-slate-500">No past queue entries</div>
            ) : (
              history.map((h) => <HistoryItem key={h.id} entry={h} />)
            )}
          </div>
        </section>

        <div className="mt-auto text-center text-xs text-slate-400 py-3">v1.0 • Star Parks</div>
      </main>
    </div>
  );
}
