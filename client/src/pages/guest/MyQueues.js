// client/src/pages/guest/MyQueues.js
import React, { useEffect, useState } from 'react';
import GuestSidebar from '../../components/GuestSidebar';
import api from '../../utils/api';

export default function MyQueues() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/queue/my-queues');
      setQueues(res.data.queues || []);
    } catch (err) {
      console.error('load queues err', err);
      setMsg('Could not load queues');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(entryId) {
    if (!window.confirm('Cancel this queue?')) return;
    try {
      await api.post('/queue/leave', { entryId });
      setMsg('Cancelled successfully');
      load();
    } catch (err) {
      console.error('cancel err', err);
      setMsg(err.response?.data?.msg || 'Cancel failed');
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <GuestSidebar />
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ maxWidth: 720 }}>
          <h2>My Queues</h2>
          {msg && <div style={{ marginBottom: 12 }}>{msg}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : queues.length === 0 ? (
            <div>No active queues</div>
          ) : (
            <div style={{ display:'grid', gap:12 }}>
              {queues.map(q => (
                <div key={q.id} style={{ background:'#fff', padding:12, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700 }}>{q.ride?.name || 'Ride'}</div>
                    <div style={{ fontSize:13, color:'#6b7280' }}>Position: {q.position} • Status: {q.status}</div>
                    <div style={{ fontSize:12, color:'#8b8b8b' }}>Joined: {new Date(q.joinedAt || q.createdAt).toLocaleString()}</div>
                  </div>

                  <div style={{ display:'flex', gap:8 }}>
                    {q.status === 'waiting' && (
                      <button onClick={() => handleCancel(q.id)} style={{ padding:'8px 10px', background:'#ef4444', color:'#fff', borderRadius:6, border:'none' }}>
                        Cancel
                      </button>
                    )}
                    <a href={`/guest/ride/${q.ride?.id}`} style={{ padding:'8px 10px', borderRadius:6, background:'#0369a1', color:'#fff', textDecoration:'none' }}>View Ride</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
