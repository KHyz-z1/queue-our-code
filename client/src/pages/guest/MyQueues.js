// client/src/pages/guest/MyQueues.js
import React, { useEffect, useState } from "react";
import GuestSidebar from "../../components/GuestSidebar";
import api from "../../utils/api";

/**
 * MyQueues page:
 * - Shows current queues (waiting/active)
 * - Each entry has a "Details" toggle that expands a compact details panel
 * - Shows a Queue History section for cancelled/completed
 */

export default function MyQueues() {
  const [queues, setQueues] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [expanded, setExpanded] = useState({}); // { [entryId]: true }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- add below other imports in MyQueues.js ---
/** computeEstimate
 * duration: minutes per ride (number)
 * position: integer (1-based)
 * capacity: number
 * returns { minutes: number, at: string } or null if duration falsy
 */
function computeEstimate(duration, position = 1, capacity = 1) {
  if (!duration || Number(duration) <= 0) return null;
  const batchesAhead = Math.ceil(Number(position) / Number(capacity));
  const minutes = Number(duration) * batchesAhead;
  const at = new Date(Date.now() + minutes * 60 * 1000).toLocaleString();
  return { minutes, at };
}

/** normalizeGuestFromEntry
 * Returns { id, name } extracted from various possible entry shapes.
 */
function normalizeGuestFromEntry(entry) {
  const maybe = entry?.guest || entry?.user || entry?.guestId || entry?.userId || null;
  if (!maybe) {
    return {
      id: entry?.guest || entry?.guestId || entry?.user || entry?.userId || entry?.id || 'unknown',
      name: entry?.guest?.name || entry?.user?.name || null
    };
  }
  if (typeof maybe === 'string') return { id: maybe, name: null };
  // object case
  const id = maybe._id || maybe.id || maybe.uid || maybe.userId || String(maybe);
  const name = maybe.name || maybe.fullName || maybe.displayName || maybe.username || null;
  return { id, name };
}

/** handlePrintStub - builds payload and prints using existing printStub() if available,
 * otherwise opens a simple popup with the stub info.
 */
async function handlePrintStub(entry, ride) {
  try {
    const guest = normalizeGuestFromEntry(entry);
    const rideName = entry?.ride?.name || ride?.name || entry?.rideName || 'Ride';
    const position = entry?.position ?? entry?.pos ?? entry?.positionNumber ?? '—';
    // duration can be on ride (preferred) or entry
    const duration = (ride && ride.duration) || entry?.rideDuration || null;
    const capacity = (ride && ride.capacity) || entry?.rideCapacity || 1;
    const est = computeEstimate(duration, Number(position || 1), capacity);

    const stubPayload = {
      type: "queue",
      guestName: guest.name || `Guest (${guest.id})`,
      guestId: guest.id,
      rideName,
      position,
      estimatedReturn: est, // {minutes, at} or null
      qr: guest.id
    };

    // if a global printStub helper exists (staff page), use it
    if (typeof window.printStub === 'function') {
      window.printStub(stubPayload);
      return;
    }

    // fallback: open a small print popup
    const html = `
      <html>
      <head><title>Queue Stub</title></head>
      <body style="font-family: Arial, Helvetica, sans-serif; padding:20px;">
        <h3>Queue Stub</h3>
        <div><strong>Guest:</strong> ${escapeHtml(stubPayload.guestName)}</div>
        <div><strong>UID:</strong> ${escapeHtml(stubPayload.guestId)}</div>
        <div><strong>Ride:</strong> ${escapeHtml(stubPayload.rideName)}</div>
        <div><strong>Position:</strong> ${escapeHtml(stubPayload.position)}</div>
        <div><strong>Estimated return:</strong> ${est ? `${est.minutes} min (~${escapeHtml(est.at)})` : 'N/A'}</div>
        <hr/>
        <div style="margin-top:12px;">Present this stub to staff on arrival.</div>
      </body>
      </html>
    `;
    const w = window.open('', '_blank', 'width=320,height=480');
    w.document.write(html);
    w.document.close();
    w.focus();
    // auto-open print dialog (optional)
    // w.print();
  } catch (e) {
    console.error("print stub failed", e);
    // `setMsg` is in outer component scope, so call it if available:
    if (typeof setMsg === 'function') setMsg("Could not open print window. Allow pop-ups.");
  }
}

// small helper to escape HTML in fallback popup
function escapeHtml(s) {
  if (!s && s !== 0) return '';
  return String(s).replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}


  async function loadAll() {
    setLoading(true);
    try {
      const [aRes, hRes] = await Promise.all([
        api.get("/queue/my-queues"),
        api.get("/queue/history")
      ]);
      setQueues(aRes.data.queues || []);
      setHistory(hRes.data.history || []);
    } catch (err) {
      console.error("load queues/history err", err);
      setMsg("Could not load queues");
    } finally {
      setLoading(false);
    }
  }

  function toggleDetails(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Defensive helpers to get user id/name when server shape varies
  function getUserId(u) {
    if (!u) return null;
    if (typeof u === 'string') return u;
    if (u.id) return u.id;
    if (u._id) return (typeof u._id === 'object' ? u._id.toString() : u._id);
    if (u.userId) return u.userId;
    return null;
  }
  function getUserName(u) {
    if (!u) return null;
    if (typeof u === 'string') return null;
    return u.name || u.username || u.userName || null;
  }

  // Estimate return: look for duration in several places defensively
  function estimateReturn(entry) {
    // entry.ride may be populated (object) or just an id
    const ride = entry.ride || {};
    const duration =
      (ride && ride.duration) ||
      entry.rideDuration ||
      null;

    const capacity =
      (ride && ride.capacity) ||
      entry.rideCapacity ||
      1;

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

 function DetailsPanel({ entry }) {
  // try to find ride info either on entry or via top-level ride (if you pass it)
  const ride = entry.ride || entry.rideObj || entry.rideData || {};
  const duration = ride.duration || entry.rideDuration || null;
  const capacity = ride.capacity || entry.rideCapacity || 1;

  const position = entry.position || entry.pos || 1;
  const est = computeEstimate(duration, Number(position), capacity);
  const guest = normalizeGuestFromEntry(entry);
  const joined = entry.joinedAt || entry.createdAt || null;

  return (
    <div style={{ marginTop: 8, padding: 12, background: "#f9fafb", borderRadius: 8, border: "1px solid #e6eef6" }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{ride.name || entry.rideName || "Ride"}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, color: "#374151" }}>Guest</div>
          <div style={{ fontWeight: 600 }}>{guest.name || 'You'}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>UID: {guest.id || '—'}</div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: "#374151" }}>Queue Info</div>
          <div>Position: <strong>{position}</strong></div>
          <div>Status: <strong>{entry.status}</strong></div>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 13, color: "#374151" }}>Estimated return</div>
        {est ? (
          <div>
            ~{est.minutes} min • return by {est.at}
          </div>
        ) : (
          <div style={{ color: "#6b7280" }}>No duration available for this ride</div>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
        Joined: {joined ? new Date(joined).toLocaleString() : '—'}
      </div>
    </div>
  );
}


  return (
    <div style={{ display: "flex" }}>
      <GuestSidebar />
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ maxWidth: 900 }}>
          <h2>My Queues</h2>
          {msg && <div style={{ marginBottom: 12 }}>{msg}</div>}

          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <section style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>Active / Waiting ({queues.length})</h3>
                {queues.length === 0 ? (
                  <div>No active queues</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {queues.map((q) => {
                      const uid = getUserId(q.user);
                      const uname = getUserName(q.user);
                      const est = estimateReturn(q);
                      return (
                        <div key={q.id} style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>{q.ride?.name || (q.rideName || 'Ride')}</div>
                              <div style={{ fontSize: 13, color: "#6b7280" }}>
                                Position {q.position} • Joined: {new Date(q.joinedAt || q.createdAt).toLocaleString()}
                              </div>
                              <div style={{ fontSize: 12, color: "#8b8b8b" }}>
                                UID: {uid || '—'} {uname ? `• ${uname}` : ''}
                              </div>
                              {est && <div style={{ fontSize: 12, color: "#6b7280" }}>Est return: ~{est.minutes} min ({est.at})</div>}
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                              {q.status === "waiting" && (
                                <button onClick={() => handleCancel(q.id)} style={{ padding: "8px 10px", background: "#ef4444", color: "#fff", borderRadius: 6, border: "none" }}>
                                  Cancel
                                </button>
                              )}

                              <button onClick={() => toggleDetails(q.id)} style={{ padding: "8px 10px", borderRadius: 6 }}>
                                {expanded[q.id] ? "Hide details" : "Details"}
                              </button>
                            </div>
                          </div>

                          {expanded[q.id] && <DetailsPanel entry={q} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <h3 style={{ marginBottom: 12 }}>History (Cancelled / Completed)</h3>
                {history.length === 0 ? (
                  <div>No past queue entries</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {history.map(h => (
                      <div key={h.id} style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{h.ride?.name || (h.rideName || 'Ride')}</div>
                            <div style={{ fontSize: 13, color: "#6b7280" }}>
                              Position {h.position} • {h.status} • {new Date(h.joinedAt).toLocaleString()}
                            </div>
                          </div>

                          <div>
                            <button onClick={() => toggleDetails(h.id)} style={{ padding: "8px 10px", borderRadius: 6 }}>
                              {expanded[h.id] ? "Hide details" : "Details"}
                            </button>
                          </div>
                        </div>

                        {expanded[h.id] && (
                          <div style={{ marginTop: 8, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
                            <div style={{ fontWeight: 600 }}>{h.ride?.name}</div>
                            <div>Position: {h.position}</div>
                            <div>Status: {h.status}</div>
                            {h.removedAt && <div>Removed at: {new Date(h.removedAt).toLocaleString()}</div>}
                            {h.completedAt && <div>Completed at: {new Date(h.completedAt).toLocaleString()}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
