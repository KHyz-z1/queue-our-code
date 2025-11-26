// snippet for StaffHome or modal (React)
import { useState } from 'react';
import axios from 'axios';
import printStub from '../../utils/printStub';

export default function RegisterGuest() {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const token = localStorage.getItem('token');
  const [snowAccess, setSnowAccess] = useState(false);


 async function handleCreateGuest(e) {
  e.preventDefault();
  if (!name) return setMsg('Name is required');
  try {
    const res = await axios.post(
      'http://localhost:5000/api/staff/create-guest',
      { name, snowAccess }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setMsg(res.data.msg || 'Guest created');
    const user = res.data.user;
    const qrPayload = res.data.qrPayload || { uid: user.id, vtok: user.verificationToken, snowAccess: user.snowAccess };

    // print stub for registration 
    printStub({
      type: 'registration',
      guestName: user.name,
      guestId: user.id,
      qr: JSON.stringify(qrPayload),
      snowAccess: user.snowAccess   // 🔥 ADD THIS
    });

    setName('');
    setSnowAccess(false); 
  } catch (err) {
    console.error('create guest err', err);
    setMsg(err.response?.data?.msg || 'Error creating guest');
  }

}


  return (
<div style={{
  background: '#ffffff',
  border: '1px solid #e6edf3',
  borderRadius: 10,
  padding: 12,
  maxWidth: 520,
  boxShadow: '0 1px 3px rgba(16,24,40,0.04)'
}}>
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
    <div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>Register Guest (no phone)</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>Create & print a stub for guests without devices</div>
    </div>
  </div>

  <form onSubmit={handleCreateGuest} style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
    <input
      placeholder="Guest name"
      value={name}
      onChange={(e)=>setName(e.target.value)}
      style={{ padding:8, borderRadius:8, border:'1px solid #e6edf3', width: '100%' }}
    />
    <label style={{ display:'flex', alignItems:'center', gap:8 }}>
  <input type="checkbox" checked={snowAccess} onChange={e => setSnowAccess(e.target.checked)} />
  Snow World access
    </label>
    <button type="submit" style={{ padding:'8px 12px', borderRadius:8, background:'#059669', color:'#fff', border:'none' }}>
      Register & Print
    </button>
  </form>

  {msg && <div style={{ marginTop:8, color: msg.startsWith('Guest created') ? 'green' : 'red' }}>{msg}</div>}
</div>
  );
}
