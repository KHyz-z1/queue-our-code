// client/src/pages/staff/QueueManage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import QRScanner from "../../components/QRScanner";
import printStub from "../../utils/printStub";




const API = `${(process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/staff`;

export default function QueueManage() {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [waiting, setWaiting] = useState([]);
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  const [lastAddedEntry, setLastAddedEntry] = useState(null); // store returned entry just after join



  const [activeBatch, setActiveBatch] = useState(null);
  const [activeEntries, setActiveEntries] = useState([]);

  useEffect(() => {
    if (rideId) loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  function computeEstimate(durationMin, position, capacity=1) {
  // naive estimate: each batch runs durationMin, capacity guests per batch
  const roundsBefore = Math.floor((position - 1) / capacity);
  const minutes = durationMin * roundsBefore;
  const target = new Date(Date.now() + minutes * 60 * 1000);
  return target.toLocaleTimeString();
}


  // Single loadQueue that fetches waiting list + active batch
  async function loadQueue() {
    try {
      // waiting list + ride meta
      const res = await axios.get(`${API}/ride/${rideId}/queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("ride queue response", res.data);
      setRide(res.data.ride || null);
      setWaiting(res.data.waiting || []);

      // active batch (may be null)
      try {
        const b = await axios.get(`${API}/ride/${rideId}/active-batch`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("active-batch response", b.data);
        setActiveBatch(b.data.batch || null);
        setActiveEntries(b.data.entries || []);
      } catch (err) {
        console.error("fetch active-batch err", err?.response?.data || err.message);
        setActiveBatch(null);
        setActiveEntries([]);
      }
    } catch (err) {
      console.error("loadQueue err", err);
      setMsg("Could not load queue");
      setRide(null);
      setWaiting([]);
      setActiveBatch(null);
      setActiveEntries([]);
    }
  }

  // add by uid or name
  async function handleAdd(e) {
  e.preventDefault();
  try {
    // call your join endpoint (staff join)
    const res = await axios.post(`${API}/queue/join`, { rideId, uid: uid || undefined, name: name || undefined }, { headers: { Authorization: `Bearer ${token}` }});
    setMsg(res.data.msg || 'Added');
    setUid(''); setName('');
    // save the returned entry so staff may print stub manually
    const entry = res.data.entry || null;
    setLastAddedEntry(entry);
    // refresh lists
    await loadQueue();
  } catch (err) {
    console.error('add err', err);
    setMsg(err.response?.data?.msg || 'Error adding guest');
  }
}

  // remove entry from queue
 async function handleRemove(entryId) {
   if (!window.confirm('Remove this guest from queue?')) return;
   try {
     // NOTE: use the queue API base and the staff-cancel endpoint
     const res = await axios.post(
       `http://localhost:5000/api/queue/cancel-by-staff`,
       { entryId },
       { headers: { Authorization: `Bearer ${token}` } }
     );
     setMsg(res.data.msg || 'Removed');
     await loadQueue();
   } catch (err) {
     console.error('remove err', err);
     setMsg(err.response?.data?.msg || 'Error removing');
   }
 }

  async function handleStartBatch() {
    if (!window.confirm("Start next batch? This will move up to ride capacity guests to active."))
      return;
    try {
      const res = await axios.post(
        `${API}/queue/start-batch`,
        { rideId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(res.data.msg || `Batch started (${res.data.movedCount})`);
      await loadQueue();
    } catch (err) {
      console.error("startBatch err", err);
      setMsg(err.response?.data?.msg || "Error starting batch");
    }
  }

  // End the currently active batch
  async function handleEndBatch() {
    if (!activeBatch) {
      setMsg("No active batch to end");
      return;
    }

    if (!window.confirm("End current batch now? Guests in the batch will be marked completed."))
      return;

    try {
      const batchId = activeBatch._id || activeBatch.id;
      const res = await axios.post(
        `${API}/queue/end-batch`,
        { batchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(res.data.msg || "Batch ended");
      // refresh data
      await loadQueue();
    } catch (err) {
      console.error("endBatch err", err);
      setMsg(err.response?.data?.msg || "Error ending batch");
    }
  }

  // Push a waiting entry to the end of the line
  async function handlePushback(entryId) {
    if (!entryId) {
      setMsg("Invalid entry id");
      return;
    }
    if (!window.confirm("Push this guest to the end of the line?")) return;

    try {
      const res = await axios.post(
        `${API}/queue/pushback`,
        { entryId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(res.data.msg || "Moved to end of line");
      await loadQueue();
    } catch (err) {
      console.error("pushback err", err);
      setMsg(err.response?.data?.msg || "Error pushing back entry");
    }
  }


  async function handlePrintStub(entry) {
  try {
    const guest = normalizeGuestFromEntry(entry);
    const rideName = entry?.ride?.name || ride?.name || (entry?.ride || {}).name || "Ride";
    const position = entry?.position ?? entry?.pos ?? entry?.positionNumber ?? "—";

    // compute estimate using computeEstimate helper (ensure function exists in file)
    const est = computeEstimate(ride?.duration || 0, Number(position), ride?.capacity || 1);

    const stubPayload = {
      type: "queue",
      guestName: guest.name || `Guest (${guest.id})`,
      guestId: guest.id,
      rideName,
      position,
      estimatedReturn: est,
      qr: guest.id // use id for QR payload
    };

    printStub(stubPayload);
  } catch (e) {
    console.error("print stub failed", e);
    setMsg("Could not open print window. Allow pop-ups.");
  }
}


function normalizeGuestFromEntry(entry) {
  const maybe = entry?.guest || entry?.user || entry?.guestId || entry?.userId || null;
  if (!maybe) return { id: entry?.guest || entry?.guestId || entry?.id || "unknown", name: entry?.guest?.name || entry?.user?.name || null };

  if (typeof maybe === "string") return { id: maybe, name: null };

  return {
    id: maybe._id || maybe.id || maybe.uid || maybe.uuid || String(maybe),
    name: maybe.name || maybe.fullName || maybe.displayName || null
  };
}





  return (
    <div style={{ maxWidth: 980 }}>
      <h2>Queue Manager</h2>
      {ride && (
        <div style={{ marginBottom: 8, color: "#6b7280" }}>
          {ride.name} • Capacity: {ride.capacity} • Duration: {ride.duration} min
        </div>
      )}

      {msg && <div style={{ marginBottom: 8 }}>{msg}</div>}


      <div style={{ marginBottom: 10 }}>
  <h4>Scan guest QR to add to queue</h4>
<QRScanner
  elementId="qr-reader-queue"
  onDecode={(decoded) => {
    // parse decoded similar to your VerifyGuest.handleScanText
    try {
      const parsed = JSON.parse(decoded);
      const u = parsed.uid || parsed.id || parsed._id || null;
      if (u) setUid(u);
      else {
        if (decoded.includes(":")) setUid(decoded.split(":")[0].trim());
        else setUid(decoded);
      }
      setMsg("Scanned UID populated. Click Add to join.");
    } catch (e) {
      // fallback plain text
      setUid(decoded);
      setMsg("Scanned UID populated. Click Add to join.");
    }
  }}
  autoStopOnDecode={true}
  autoSubmitOnDecode={true}
/>
</div>


      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="guest uid (scan or paste)"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            style={{ padding: 8, borderRadius: 6 }}
          />
          <input
            placeholder="or guest name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8, borderRadius: 6 }}
          />
          <button style={{ padding: "8px 10px", background: "#059669", color: "#fff", borderRadius: 6 }}>
            Add
          </button>
        </form>
        
                  {lastAddedEntry && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #e6edf3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{lastAddedEntry.guest?.name || lastAddedEntry.guest || `Guest (${lastAddedEntry.guest?.id || lastAddedEntry.guest})`}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Position: {lastAddedEntry.position}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handlePrintStub(lastAddedEntry)}
                      style={{ padding: "6px 10px", borderRadius: 6, background: "#0ea5e9", color: "#fff", border: "none" }}
                    >
                      Print Stub
                    </button>

                    <button
                      onClick={() => setLastAddedEntry(null)}
                      style={{ padding: "6px 10px", borderRadius: 6, background: "#efefef", border: "1px solid #ddd" }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}


        <button
          onClick={handleStartBatch}
          style={{ padding: "8px 10px", background: "#0369a1", color: "#fff", borderRadius: 6 }}
        >
          Start Next Batch
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <h3>Current Batch</h3>
        {activeBatch ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Array.from({ length: activeBatch.capacity || ride?.capacity || 0 }).map((_, i) => {
              const entry = activeEntries[i];
              return (
                <div
                  key={i}
                  style={{
                    width: 120,
                    height: 90,
                    borderRadius: 8,
                    background: entry ? "#fff" : "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    border: "1px solid #e6edf3",
                  }}
                >
                  {entry ? (
                    <>
                      <div style={{ fontWeight: 700 }}>{entry.user?.name || entry.user}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{entry.position}</div>
                    </>
                  ) : (
                    <div style={{ color: "#9ca3af" }}>Empty</div>
                  )}
                </div>
              );
            })}
            <div style={{ marginLeft: 12 }}>
              <button onClick={handleEndBatch} style={{ padding: "8px 10px", background: "#ef4444", color: "#fff", borderRadius: 6 }}>
                End Batch
              </button>
            </div>
          </div>
        ) : (
          <div>No active batch</div>
        )}
      </div>

      <div>
        <h3>Waiting List ({waiting.length})</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {waiting.map((e) => (
            <div
              key={e.id}
              style={{ padding: 10, borderRadius: 6, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{e.user?.name || e.user?.id || "Unknown"}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Pos {e.position} • Joined: {new Date(e.joinedAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleRemove(e.id)} style={{ background: "#ef4444", color: "#fff", padding: "6px 10px", borderRadius: 6 }}>
                  Remove
                </button>
                <button onClick={() => handlePushback(e.id)} style={{ background: "#f59e0b", color: "#fff", padding: "6px 10px", borderRadius: 6 }}>
                  Push back
                </button>
                <button onClick={() => handlePrintStub(e)} style={{ background:'#0ea5e9', color:'#fff', padding:'6px 10px', borderRadius:6 }}>Print</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
