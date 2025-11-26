// client/src/pages/guest/RidesList.js
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function RidesList() {
  const [rides, setRides] = useState([]);

  useEffect(()=> {
    async function load() {
      const res = await api.get('/rides'); // or /admin/rides if public
      setRides(res.data.rides || []);
    }
    load();
  }, []);

  return (
    <div style={{ padding:16 }}>
      <h2>Rides</h2>
      <div style={{ display:'grid', gap:12 }}>
        {rides.map(r => (
          <div key={r.id} style={{ display:'flex', gap:12, padding:12, borderRadius:8, background:'#fff', alignItems:'center' }}>
            <div style={{ width:100, height:72, overflow:'hidden', borderRadius:8 }}>
              <img src={`http://localhost:5000${r.image || ''}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700 }}>{r.name}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{r.status} • {r.capacity} • {r.duration ?? '-'} min</div>
            </div>
            <div>
              <button onClick={()=> window.location.href = `/guest/ride/${r.id}`}>View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
