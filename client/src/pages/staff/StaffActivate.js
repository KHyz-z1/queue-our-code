// client/src/pages/staff/StaffActivate.js
import React, { useState } from "react";
import axios from "axios";

export default function StaffActivate() {
  const [uid, setUid] = useState("");
  const [vtok, setVtok] = useState("");
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  // staff-only verify endpoint is /api/auth/verify (existing)
  async function handleVerify(e) {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify', { uid, vtok }, { headers: { Authorization: `Bearer ${token}` }});
      setMsg(res.data.msg || 'Verified');
    } catch (err) {
      console.error('verify err', err);
      setMsg(err.response?.data?.msg || 'Error');
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h2>Activate / Verify Guest</h2>

      {msg && <div style={{ marginBottom: 8 }}>{msg}</div>}

      <form onSubmit={handleVerify} style={{ display: 'grid', gap: 8 }}>
        <input placeholder="guest uid (or scan QR)" value={uid} onChange={e=>setUid(e.target.value)} style={{ padding:8, borderRadius:6 }} />
        <input placeholder="verification token (vtok)" value={vtok} onChange={e=>setVtok(e.target.value)} style={{ padding:8, borderRadius:6 }} />
        <button style={{ padding: '8px 12px', background:'#059669', color:'#fff', borderRadius:6 }}>Verify</button>
      </form>

      <div style={{ marginTop: 12, color:'#6b7280', fontSize:13 }}>
        Tip: You can paste guest QR payload uid/vtok in the inputs to verify quickly.
      </div>
    </div>
  );
}
