// client/src/pages/staff/QueueManage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import QRScanner from "../../components/QRScanner";
import printStub from "../../utils/printStub";




const API = "http://localhost:5000/api/staff";

export default function QueueManage() {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [waiting, setWaiting] = useState([]);
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");


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
      const res = await axios.post(
        `${API}/queue/join`,
        { rideId, uid: uid || undefined, name: name || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMsg(res.data.msg || "Added");
      setUid("");
      setName("");
      await loadQueue();


const entry = res.data.entry;
const estReturn = computeEstimate(ride.duration, entry.position); // helper to format
printStub({
  type: "queue",
  guestName: entry.guest.name,
  guestId: entry.guest.id,
  qr: entry.guest.id, 
  rideName: entry.ride.name,
  position: entry.position,
  estimatedReturn: estReturn
});





    } catch (err) {
      console.error("add err", err);
      setMsg(err.response?.data?.msg || "Error adding guest");
    }
  }

  async function handleRemove(entryId) {
    if (!window.confirm("Remove this guest from queue?")) return;
    try {
      const res = await axios.post(
        `${API}/queue/remove`,
        { entryId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(res.data.msg || "Removed");
      await loadQueue();
    } catch (err) {
      console.error("remove err", err);
      setMsg(err.response?.data?.msg || "Error removing");
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
