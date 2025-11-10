// client/src/pages/staff/QueueManage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const API = "http://localhost:5000/api/staff";
const API_QUEUE = "http://localhost:5000/api/queue";

export default function QueueManage() {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [waiting, setWaiting] = useState([]);
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (rideId) loadQueue();
  }, [rideId]);

  async function loadQueue() {
    try {
      const res = await axios.get(`${API}/ride/${rideId}/queue`, { headers: { Authorization: `Bearer ${token}` }});
      setRide(res.data.ride);
      setWaiting(res.data.waiting || []);
    } catch (err) {
      console.error('loadQueue err', err);
      setMsg('Could not load queue');
    }
  }

  // add by uid or name
  async function handleAdd(e) {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/queue/join`, { rideId, uid: uid || undefined, name: name || undefined }, { headers: { Authorization: `Bearer ${token}` }});
      setMsg(res.data.msg || 'Added');
      setUid(''); setName('');
      loadQueue();
    } catch (err) {
      console.error('add err', err);
      setMsg(err.response?.data?.msg || 'Error adding guest');
    }
  }

  async function handleRemove(entryId) {
    if (!window.confirm('Remove this guest from queue?')) return;
    try {
      const res = await axios.post(`${API}/queue/remove`, { entryId }, { headers: { Authorization: `Bearer ${token}` }});
      setMsg(res.data.msg || 'Removed');
      loadQueue();
    } catch (err) {
      console.error('remove err', err);
      setMsg(err.response?.data?.msg || 'Error removing');
    }
  }

  async function handleStartBatch() {
    if (!window.confirm('Start next batch? This will move up to ride capacity guests to active.')) return;
    try {
      const res = await axios.post(`${API}/queue/start-batch`, { rideId }, { headers: { Authorization: `Bearer ${token}` }});
      setMsg(res.data.msg || `Batch started (${res.data.movedCount})`);
      loadQueue();
    } catch (err) {
      console.error('startBatch err', err);
      setMsg(err.response?.data?.msg || 'Error starting batch');
    }
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h2>Queue Manager</h2>
      {ride && <div style={{ marginBottom: 8, color: '#6b7280' }}>{ride.name} • Capacity: {ride.capacity} • Duration: {ride.duration} min</div>}

      {msg && <div style={{ marginBottom:8 }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="guest uid (scan or paste)" value={uid} onChange={e=>setUid(e.target.value)} style={{ padding:8, borderRadius:6 }} />
          <input placeholder="or guest name" value={name} onChange={e=>setName(e.target.value)} style={{ padding:8, borderRadius:6 }} />
          <button style={{ padding:'8px 10px', background:'#059669', color:'#fff', borderRadius:6 }}>Add</button>
        </form>

        <button onClick={handleStartBatch} style={{ padding:'8px 10px', background:'#0369a1', color:'#fff', borderRadius:6 }}>Start Next Batch</button>
      </div>

      <div>
        <h3>Waiting List ({waiting.length})</h3>
        <div style={{ display:'grid', gap:8 }}>
          {waiting.map(e => (
            <div key={e.id} style={{ padding:10, borderRadius:6, background:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700 }}>{e.user?.name || e.user?.id || 'Unknown'}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>Pos {e.position} • Joined: {new Date(e.joinedAt).toLocaleString()}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>handleRemove(e.id)} style={{ background:'#ef4444', color:'#fff', padding:'6px 10px', borderRadius:6 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
