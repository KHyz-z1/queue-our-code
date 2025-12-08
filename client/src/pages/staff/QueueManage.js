// client/src/pages/staff/QueueManage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import QRScanner from "../../components/QRScanner";
import printStub from "../../utils/printStub";
import Card from "../../ui/Card";

const API = `${(process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/staff`;

export default function QueueManage() {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [waiting, setWaiting] = useState([]);
  
  // Form State
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  
  const token = localStorage.getItem("token");
  const [lastAddedEntry, setLastAddedEntry] = useState(null);
  const [activeBatch, setActiveBatch] = useState(null);
  const [activeEntries, setActiveEntries] = useState([]);

  useEffect(() => {
    if (rideId) loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  function computeEstimate(durationMin, position, capacity = 1) {
    const roundsBefore = Math.floor((position - 1) / capacity);
    const minutes = durationMin * roundsBefore;
    const target = new Date(Date.now() + minutes * 60 * 1000);
    return target.toLocaleTimeString();
  }

  async function loadQueue() {
    try {
      const res = await axios.get(`${API}/ride/${rideId}/queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRide(res.data.ride || null);
      setWaiting(res.data.waiting || []);

      try {
        const b = await axios.get(`${API}/ride/${rideId}/active-batch`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActiveBatch(b.data.batch || null);
        setActiveEntries(b.data.entries || []);
      } catch (err) {
        setActiveBatch(null);
        setActiveEntries([]);
      }
    } catch (err) {
      console.error("loadQueue err", err);
      setMsg("Could not load queue");
    }
  }

  async function handleAdd(e) {
    if (e) e.preventDefault();

    // CHECK: Ensure at least one field is filled
    if (!uid && !name) {
        setMsg("Please scan a QR or enter a Name");
        return;
    }

    try {
      const res = await axios.post(
        `${API}/queue/join`, 
        { 
            rideId, 
            uid: uid || undefined, 
            name: name || undefined 
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(res.data.msg || 'Added');
      setUid(''); setName('');
      const entry = res.data.entry || null;
      setLastAddedEntry(entry);
      await loadQueue();
    } catch (err) {
      console.error('add err', err);
      setMsg(err.response?.data?.msg || 'Error adding guest');
    }
  }

  const handleScan = (decoded) => {
    setMsg("Scanned! Ready to add.");
    try {
      const parsed = JSON.parse(decoded);
      const scannedUid = parsed.uid || parsed.id || parsed._id || decoded;
      setUid(scannedUid);
      // Optional: Auto-submit if you want instant add on scan
      // handleAdd(null); 
    } catch (e) {
      if (decoded.includes(":")) {
        setUid(decoded.split(":")[0].trim());
      } else {
        setUid(decoded);
      }
    }
  };

  async function handleRemove(entryId) {
    if (!window.confirm('Remove this guest from queue?')) return;
    try {
      // Use dynamic API variable
      const res = await axios.post(
        `${API}/queue/remove`, 
        { entryId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(res.data.msg || 'Removed');
      await loadQueue();
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Error removing');
    }
  }

  async function handleStartBatch() {
    if (!window.confirm("Start next batch? This will move up to ride capacity guests to active.")) return;
    try {
      const res = await axios.post(`${API}/queue/start-batch`, { rideId }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg(res.data.msg || `Batch started (${res.data.movedCount})`);
      await loadQueue();
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error starting batch");
    }
  }

  async function handleEndBatch() {
    if (!activeBatch) return setMsg("No active batch to end");
    if (!window.confirm("End current batch now?")) return;
    try {
      const batchId = activeBatch._id || activeBatch.id;
      const res = await axios.post(`${API}/queue/end-batch`, { batchId }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg(res.data.msg || "Batch ended");
      await loadQueue();
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error ending batch");
    }
  }

  async function handlePushback(entryId) {
    if (!entryId) return;
    if (!window.confirm("Push this guest to the end of the line?")) return;
    try {
      const res = await axios.post(`${API}/queue/pushback`, { entryId }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg(res.data.msg || "Moved to end of line");
      await loadQueue();
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error pushing back");
    }
  }

  async function handlePrintStub(entry) {
    try {
      const guest = normalizeGuestFromEntry(entry);
      const rideName = entry?.ride?.name || ride?.name || "Ride";
      const position = entry?.position ?? "—";
      const est = computeEstimate(ride?.duration || 0, Number(position), ride?.capacity || 1);

      printStub({
        type: "queue",
        guestName: guest.name || `Guest (${guest.id})`,
        guestId: guest.id,
        rideName,
        position,
        estimatedReturn: est,
        qr: guest.id 
      });
    } catch (e) {
      setMsg("Could not open print window.");
    }
  }

  function normalizeGuestFromEntry(entry) {
    const maybe = entry?.guest || entry?.user || entry?.guestId || entry?.userId || null;
    if (!maybe) return { id: "unknown", name: null };
    if (typeof maybe === "string") return { id: maybe, name: null };
    return {
      id: maybe._id || maybe.id || maybe.uid || String(maybe),
      name: maybe.name || maybe.fullName || null
    };
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Queue Manager</h2>
          {ride && (
            <div className="text-sm text-slate-500 mt-1">
              <span className="font-medium text-slate-700">{ride.name}</span> • Capacity: {ride.capacity} • Duration: {ride.duration} min
            </div>
          )}
        </header>

        {msg && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- LEFT COLUMN: SCANNER & ACTIONS --- */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Scanner Card */}
            <Card className="p-4 bg-white shadow-sm border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Add Guest</h4>
              
              <div className="mb-4">
                <QRScanner
                  elementId="qr-reader-queue"
                  onDecode={handleScan}
                  onError={(e) => console.warn(e)}
                  autoStopOnDecode={true}
                  autoSubmitOnDecode={false} 
                />
              </div>

              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Guest UID</label>
                   <input
                     placeholder="Scan or paste UID..."
                     value={uid}
                     onChange={(e) => setUid(e.target.value)}
                     className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm font-mono"
                   />
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Name (Optional if UID present)</label>
                   <input
                     placeholder="Guest Name"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm"
                   />
                </div>
                <button 
                  type="submit"
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add to Queue
                </button>
              </form>
            </Card>

            {/* Last Added Notification */}
            {lastAddedEntry && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 truncate">
                      {lastAddedEntry.guest?.name || lastAddedEntry.guest || `Guest`}
                    </div>
                    <div className="text-xs text-slate-500">Position: {lastAddedEntry.position}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handlePrintStub(lastAddedEntry)}
                    className="flex-1 py-1.5 px-3 bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold rounded hover:bg-emerald-50"
                  >
                    Print Stub
                  </button>
                  <button
                    onClick={() => setLastAddedEntry(null)}
                    className="py-1.5 px-3 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            
            {/* Start Batch Button */}
            <button
              onClick={handleStartBatch}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-200 transition-all active:scale-[0.98]"
            >
              Start Next Batch
            </button>
          </div>

          {/* --- RIGHT COLUMN: ACTIVE & WAITING --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Batch Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-800">Current Batch</h3>
                {activeBatch && (
                  <button 
                    onClick={handleEndBatch} 
                    className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors"
                  >
                    End Batch
                  </button>
                )}
              </div>

              {activeBatch ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: activeBatch.capacity || ride?.capacity || 0 }).map((_, i) => {
                    const entry = activeEntries[i];
                    return (
                      <div
                        key={i}
                        className={`
                          aspect-[4/3] rounded-lg border flex flex-col items-center justify-center p-2 text-center transition-all
                          ${entry ? "bg-white border-slate-200 shadow-sm" : "bg-slate-100 border-dashed border-slate-300"}
                        `}
                      >
                        {entry ? (
                          <>
                            <div className="font-bold text-slate-900 text-sm truncate w-full px-1">{entry.user?.name || entry.user}</div>
                            <div className="text-xs text-slate-500 mt-1 bg-slate-100 px-1.5 py-0.5 rounded">Pos {entry.position}</div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-400 font-medium">Empty</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-100 rounded-xl border border-dashed border-slate-300 text-slate-500">
                  No active batch running
                </div>
              )}
            </section>

            {/* Waiting List Section */}
            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                Waiting List <span className="text-slate-400 font-normal ml-1">({waiting.length})</span>
              </h3>
              
              <div className="space-y-3">
                {waiting.length === 0 ? (
                    <div className="text-sm text-slate-500 italic">Queue is empty.</div>
                ) : (
                    waiting.map((e) => (
                      <div
                        key={e.id}
                        className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{e.user?.name || e.user?.id || "Unknown"}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Pos <span className="font-mono font-medium text-slate-700">{e.position}</span> • {new Date(e.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                           <button 
                            onClick={() => handlePrintStub(e)} 
                            className="px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 text-xs font-semibold hover:bg-sky-200"
                          >
                            Print
                          </button>
                          <button 
                            onClick={() => handlePushback(e.id)} 
                            className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold hover:bg-amber-200"
                          >
                            Push Back
                          </button>
                          <button 
                            onClick={() => handleRemove(e.id)} 
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}