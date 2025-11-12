// snippet for StaffHome or modal (React)
import { useState } from 'react';
import axios from 'axios';
import printStub from '../../utils/printStub';

export default function RegisterGuest() {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const token = localStorage.getItem('token');

  async function handleCreateGuest(e) {
    e.preventDefault();
    if (!name) return setMsg('Name is required');
    try {
      const res = await axios.post('http://localhost:5000/api/staff/create-guest', { name }, { headers: { Authorization: `Bearer ${token}` }});
      setMsg(res.data.msg || 'Guest created');
      const user = res.data.user;
      const qrPayload = res.data.qrPayload; // {uid, vtok}
      // print stub for registration - automatically
      printStub({
        type: 'registration',
        guestName: user.name,
        guestId: user.id,
        qr: JSON.stringify(qrPayload)
      });
      setName('');
    } catch (err) {
      console.error('create guest err', err);
      setMsg(err.response?.data?.msg || 'Error creating guest');
    }
  }

  return (
    <div style={{ padding:8, borderRadius:6, background:'#fff' }}>
      <h4>Register guest (no phone)</h4>
      <form onSubmit={handleCreateGuest}>
        <input placeholder="Guest name" value={name} onChange={e=>setName(e.target.value)} style={{ padding:8, marginRight:8 }} />
        <button type="submit" style={{ padding:'6px 10px' }}>Register & Print</button>
      </form>
      {msg && <div style={{ marginTop:8 }}>{msg}</div>}
    </div>
  );
}
