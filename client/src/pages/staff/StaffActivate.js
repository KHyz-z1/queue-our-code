// client/src/pages/staff/StaffActivate.js
import React, { useState } from "react";
import axios from "axios";
import QRScanner from "../../components/QRScanner";

export default function StaffActivate() {
  const [uid, setUid] = useState("");
  const [vtok, setVtok] = useState("");
  
  // UI States
  const [msg, setMsg] = useState("");
  const [snowMsg, setSnowMsg] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'success' | 'error'
  
  const [snowAccess, setSnowAccess] = useState(false);
  const token = localStorage.getItem("token");

  async function handleVerify(e) {
    e.preventDefault();
    
    // Reset states before request
    setMsg("Verifying...");
    setSnowMsg("");
    setStatus("idle");

    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/verify',
        { uid, vtok, snowAccess },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // 1. Success Handling
      setStatus("success");
      setMsg(res.data.msg || 'Guest verified successfully!');

      if (res.data.user) {
        const hasAccess = res.data.user.snowAccess ? "YES" : "NO";
        setSnowMsg(`Snow World Access: ${hasAccess}`);
      }

      // Clear form inputs on success para mascan agad sunod
      setUid('');
      setVtok('');
      setSnowAccess(false);

    } catch (err) {
      // 2. Error Handling
      console.error('verify err', err);
      setStatus("error");
      setMsg(err.response?.data?.msg || 'Verification Failed');
      setSnowMsg(""); // Clear snow msg on error
    }
  }

  // Helper to handle scan data
  const handleScan = (decoded) => {
    // Reset previous messages when a new scan happens
    setMsg("Scanned! Ready to verify.");
    setStatus("idle");
    setSnowMsg("");

    try {
      const parsed = JSON.parse(decoded);
      if (parsed.uid && parsed.vtok) {
        setUid(parsed.uid);
        setVtok(parsed.vtok);
      } else {
        setUid(parsed.uid || decoded);
      }
    } catch (e) {
      if (decoded.includes(":")) {
        const [u, v] = decoded.split(":");
        setUid(u);
        setVtok(v);
      } else {
        setUid(decoded);
      }
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h2>Activate / Verify Guest</h2>

      {/* QR Scanner Section */}
      <div style={{ marginTop: 12, marginBottom: 20 }}>
        <h4>Scan guest QR (recommended)</h4>
        <QRScanner
          onDecode={handleScan}
          onError={(e) => {
            setMsg("Scanner error: " + String(e));
            setStatus("error");
          }}
        />
      </div>

      {/* Manual Entry Form */}
      <form onSubmit={handleVerify} style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600}}>Guest UID</label>
          <input 
            placeholder="Guest UID" 
            value={uid} 
            onChange={e => setUid(e.target.value)} 
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }} 
          />
        </div>

        <div>
           <label style={{display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600}}>Verification Token</label>
           <input 
            placeholder="VTOK" 
            value={vtok} 
            onChange={e => setVtok(e.target.value)} 
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }} 
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={snowAccess} 
            onChange={e => setSnowAccess(e.target.checked)} 
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontWeight: '500' }}>Grant Snow World access</span>
        </label>

        <button 
          type="submit"
          style={{ 
            padding: '12px', 
            background: '#059669', 
            color: '#fff', 
            borderRadius: 6, 
            border: 'none', 
            fontSize: 16, 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Verify Guest
        </button>
      </form>

      {/* --- RESULT MESSAGE AREA --- */}
      {msg && (
        <div style={{ 
          marginTop: 20, 
          padding: 16, 
          borderRadius: 8, 
          textAlign: 'center',
          backgroundColor: status === 'success' ? '#d1fae5' : (status === 'error' ? '#fee2e2' : '#f3f4f6'),
          color: status === 'success' ? '#065f46' : (status === 'error' ? '#991b1b' : '#374151'),
          border: `1px solid ${status === 'success' ? '#34d399' : (status === 'error' ? '#f87171' : '#d1d5db')}`
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>
            {status === 'success' ? ' Success' : (status === 'error' ? ' Error' : 'ℹ Info')}
          </h3>
          <div style={{ fontSize: 16 }}>{msg}</div>
          
          {snowMsg && status === 'success' && (
             <div style={{ marginTop: 8, fontWeight: 'bold', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 8 }}>
                {snowMsg}
             </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, color:'#6b7280', fontSize:13 }}>
        Tip: You can paste guest QR payload uid/vtok in the inputs to verify quickly.
      </div>
    </div>
  );
}