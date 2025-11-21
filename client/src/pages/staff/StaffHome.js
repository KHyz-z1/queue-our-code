// client/src/pages/staff/StaffHome.js (or wherever your staff rides list lives)
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api'; // your axios wrapper that sets baseURL + Authorization
// or use: import axios from 'axios';

const statusColors = { open: '#059669', closed: '#6b7280', maintenance: '#ef4444' };
const categoryColors = { Easy: '#10b981', Moderate: '#3b82f6', Extreme: '#ef4444' };

export default function StaffHome() {
  const [rides, setRides] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // search & filter & pin handling
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    loadRides();
  }, []);

  async function loadRides() {
    setLoading(true);
    try {
      const res = await api.get('/staff/rides'); // make sure api wrapper sets Authorization
      setRides(res.data.rides || []);
    } catch (err) {
      console.error('load rides err', err);
      setMsg('Could not load rides');
    } finally {
      setLoading(false);
    }
  }

  async function togglePin(rideId, targetPinned) {
  try {
    const res = await api.post(`/admin/rides/${rideId}/pin`, { pinned: targetPinned });
    setMsg(res.data.msg || (targetPinned ? 'Pinned' : 'Unpinned'));
    await loadRides();
  } catch (err) {
    console.error('pin err', err);
    setMsg(err.response?.data?.msg || 'Pin failed');
  }
}



  // client-side filtering
  const filtered = rides.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === 'All' || (r.category || '').toLowerCase() === filterCat.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // keep server-sent order (pinned already sorted server-side), but if pinned property exists, ensure pinned top:
  filtered.sort((a,b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.queueCount - a.queueCount;
  });

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h2>Staff — Rides</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Search ride" value={search} onChange={e=>setSearch(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ padding: 8, borderRadius: 6 }}>
            <option>All</option>
            <option>Easy</option>
            <option>Moderate</option>
            <option>Extreme</option>
          </select>
        </div>
      </div>

      {msg && <div style={{ marginBottom: 12 }}>{msg}</div>}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {filtered.map(r => {
          const id = String(r.id ?? r._id ?? (r._id && r._id.$oid) ?? '');
          const img = r.image ? (r.image.startsWith('http') ? r.image : `${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${r.image}`) : null;
          return (
            <div key={id} style={{
              display: 'flex', flexDirection: 'column', borderRadius: 12, background: '#fff',
              boxShadow: '0 4px 6px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #e5e7eb'
            }}>
              {/* image */}
              <div style={{ height: 160, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                {img ? <img src={img} alt={r.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                     : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af'}}>No image</div>}
              </div>

              <div style={{ padding: 16, flexGrow: 1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize: 18 }}>{r.name}</div>
                    <div style={{ color:'#6b7280', fontSize:13, marginTop:4 }}>
                      ID: {id} • Cap: {r.capacity} • {r.duration} min
                    </div>
                  </div>

                  <div style={{ textAlign:'right' }}>
                    {/* pinned indicator */}
                    {r.pinned && <div style={{ fontSize:12, padding:'4px 8px', borderRadius:6, background:'#fde68a', color:'#92400e', fontWeight:700, marginBottom:6 }}>PINNED</div>}
                    <div style={{ fontSize:12, fontWeight:600, color:'#fff', padding:'4px 8px', borderRadius:6, background: statusColors[r.status] || '#9ca3af', textTransform:'uppercase' }}>
                      {r.status}
                    </div>
                  </div>
                </div>

                {/* category badge + description */}
                <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{
                    padding: '6px 8px', borderRadius: 999, fontSize: 12, fontWeight:700,
                    background: categoryColors[r.category] || '#9ca3af', color: '#fff'
                  }}>
                    {r.category || 'Moderate'}
                  </div>
                  <div style={{ color:'#374151', fontSize:14, flex:1 }}>
                    {r.shortDescription || (r.description ? r.description.slice(0,120)+'...' : 'No description')}
                  </div>
                </div>

                {/* queue count */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight:700 }}>{r.queueCount}</div>
                    <div style={{ fontSize: 12, color:'#6b7280' }}>in queue</div>
                  </div>

                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => togglePin(id, !r.pinned)} style={{ padding:'8px 10px', borderRadius:6, border:'none', background: r.pinned ? '#d1d5db' : '#f59e0b', color:'#fff' }}>
                      {r.pinned ? 'Unpin' : 'Pin'}
                    </button>

                    { r.status !== 'open' ? (
                      <button disabled style={{ padding:'8px 10px', borderRadius:6, background:'#d1d5db', color:'#4b5563' }}>CANNOT MANAGE</button>
                    ) : (
                      <Link to={`/staff/rides/${id}`} style={{ padding:'8px 10px', borderRadius:6, background:'#0369a1', color:'#fff', textDecoration:'none' }}>Manage</Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
