// client/src/pages/guest/GuestRideStatus.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import GuestSidebar from "../../components/GuestSidebar";
import api from "../../utils/api";

/**
 * Visual Ride status for guests
 * - shows Current batch, Upcoming batch, Waiting list (scrollable)
 * - highlights viewer (if logged in and they are in any entry)
 */

function Slot({ entry, emptyLabel, highlight }) {
  return (
    <div style={{
      width: 110, height: 90,
      borderRadius: 8,
      background: entry ? '#ffffff' : '#f3f4f6',
      border: highlight ? '2px solid #10b981' : '1px solid #e6edf3',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent:'center',
      padding:8, boxSizing:'border-box'
    }}>
      {entry ? (
        <>
          <div style={{ fontWeight:700, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: 92 }}>
            {entry.user?.name || entry.userName || entry.user?.id || (typeof entry.user === 'string' ? entry.user : 'Guest')}
          </div>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:6 }}>Pos {entry.position}</div>
        </>
      ) : (
        <div style={{ color:'#9ca3af' }}>{emptyLabel || 'Empty'}</div>
      )}
    </div>
  );
}

export default function GuestRideStatus() {
  const { rideId } = useParams();
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null); // viewer id if logged in
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/rides/${rideId}/visual`);
      setData(res.data);

      // try to get viewer identity (optional)
      try {
        const meRes = await api.get('/auth/me');
        setMe(meRes.data.user?.id || null);
      } catch (e) {
        setMe(null); // not logged in or no token
      }
    } catch (err) {
      console.error('load ride visual err', err);
      setError(err.response?.data?.msg || 'Could not load ride data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [rideId]);

  if (loading) return <div style={{ display:'flex' }}><GuestSidebar /><div style={{ padding:24 }}>Loading...</div></div>;
  if (error) return <div style={{ display:'flex' }}><GuestSidebar /><div style={{ padding:24 }}>Error: {error}</div></div>;

  const ride = data.ride;
  const capacity = ride.capacity || 1;
  const current = data.currentBatch || [];
  const upcoming = data.upcomingBatch || [];
  const waiting = data.waiting || [];

  const buildSlots = (entries, length) => {
    const arr = [];
    for (let i = 0; i < length; i++) {
      arr.push(entries[i] || null);
    }
    return arr;
  };

  const currentSlots = buildSlots(current, capacity);
  const upcomingSlots = buildSlots(upcoming, capacity);

  // waitingSlots will display at least capacity slots, and if more waiting exist we'll show them
  const waitingSlots = waiting.length > 0 ? waiting : Array.from({ length: capacity }).map(() => null);

  return (
    <div style={{ display: 'flex' }}>
      <GuestSidebar />
      <main style={{ flex:1, padding:24 }}>
        <div style={{ maxWidth:980 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h2 style={{ margin:0 }}>{ride.name}</h2>
              <div style={{ color:'#6b7280' }}>{ride.status} • Capacity: {capacity} • Duration: {ride.duration ?? '-'} min</div>
            </div>
            <div>
              <button onClick={load} style={{ padding:'8px 12px', borderRadius:6, background:'#0369a1', color:'#fff', border:'none' }}>Refresh</button>
            </div>
          </div>

          {/* Current Batch */}
          <section style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom:8 }}>Current Batch</h3>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {currentSlots.map((s, i) => (
                <Slot key={`cur-${i}`} entry={s} emptyLabel="Empty" highlight={s && me && s.user && (s.user.id === me)} />
              ))}
            </div>
            <div style={{ marginTop:8, fontSize:13, color:'#6b7280' }}>
              Guests currently boarding / on the ride.
            </div>
          </section>

          {/* Upcoming Batch */}
          <section style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom:8 }}>Upcoming Batch</h3>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {upcomingSlots.map((s, i) => (
                <Slot key={`up-${i}`} entry={s} emptyLabel="Empty" highlight={s && me && s.user && (s.user.id === me)} />
              ))}
            </div>
            <div style={{ marginTop:8, fontSize:13, color:'#6b7280' }}>
              Next guests to board (based on queue order).
            </div>
          </section>

          {/* Waiting */}
          <section>
            <h3 style={{ marginBottom:8 }}>Waiting ({waiting.length})</h3>

            <div style={{
              display:'flex',
              gap:12,
              flexWrap:'nowrap',
              overflowX: 'auto',
              paddingBottom: 8,
              maxWidth: '100%'
            }}>
              {waitingSlots.map((s, i) => (
                <div key={`wait-${i}`} style={{ flex: '0 0 auto' }}>
                  <Slot entry={s} emptyLabel="Empty" highlight={s && me && s.user && (s.user.id === me)} />
                </div>
              ))}
            </div>

            <div style={{ marginTop:8, fontSize:13, color:'#6b7280' }}>
              Guests waiting in the queue. Highlighted slot is you (if you are in queue).
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
