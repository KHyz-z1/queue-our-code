// client/src/pages/guest/MyQR.js
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import api from '../../utils/api'; // your axios wrapper
import GuestSidebar from '../../components/GuestSidebar';

export default function MyQR() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/auth/me');
        setMe(res.data.user);
      } catch (err) {
        console.error('load me err', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ display:'flex' }}><GuestSidebar /><div style={{ padding:24 }}>Loading...</div></div>;

  return (
    <div style={{ display: 'flex' }}>
      <GuestSidebar />
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ maxWidth: 720 }}>
          <h2>My Account</h2>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', background:'#fff', padding:16, borderRadius:8 }}>
            <div style={{ padding: 12, background: '#f9fafb', borderRadius:8 }}>
              <QRCode value={JSON.stringify({ uid: me.id, vtok: me.verificationToken || '' })} size={160} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight:700, fontSize:18 }}>{me.name}</div>
              <div style={{ color:'#6b7280', marginTop:6 }}>UID: {me.id}</div>
              <div style={{ marginTop:8, color: me.verified ? 'green' : 'orange' }}>
                {me.verified ? 'Verified at gate' : 'Not verified'}
              </div>
              <div style={{ marginTop:10, fontSize:13, color:'#6b7280' }}>
                Show this QR to staff so they can activate or add you to queues.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
