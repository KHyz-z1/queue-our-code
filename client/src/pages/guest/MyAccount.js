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
        // normalize response shape (some endpoints return user, some return data.user)
        const user = res.data.user || res.data;
        setMe(user);
      } catch (err) {
        console.error('load me err', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex' }}>
        <GuestSidebar />
        <div style={{ padding: 24 }}>Loading...</div>
      </div>
    );
  }

  if (!me) {
    return (
      <div style={{ display: 'flex' }}>
        <GuestSidebar />
        <div style={{ padding: 24 }}>
          <h2>My Account</h2>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            Could not load account. Please log in again.
          </div>
        </div>
      </div>
    );
  }

  // friendly snow access text + color
  const hasSnow = !!me?.snowAccess; // coerce anything truthy to boolean
const snowText = typeof me?.snowAccess === 'undefined' ? 'N/A' : (hasSnow ? 'YES' : 'NO');
const snowColor = hasSnow ? 'green' : (typeof me?.snowAccess === 'undefined' ? '#666' : 'red');


  const qrPayload = JSON.stringify({ uid: me.id, vtok: me.verificationToken || '' });

  return (
    <div style={{ display: 'flex' }}>
      <GuestSidebar />
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ maxWidth: 720 }}>
          <h2>My Account</h2>

          <div
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              background: '#fff',
              padding: 16,
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
              <QRCode value={qrPayload} size={160} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{me.name}</div>
              <div style={{ color: '#6b7280', marginTop: 6 }}>UID: {me.id}</div>

              <div style={{ marginTop: 8, color: me.verified ? 'green' : 'orange' }}>
                {me.verified ? 'Verified at gate' : 'Not verified'}
              </div>

            <div style={{ marginTop: 8 }}>
  <div style={{ fontSize: 13, color: '#6b7280' }}>
    Snow World Access:&nbsp;
    <span style={{ fontWeight: 700, color: snowColor }}>{snowText}</span>
  </div>
</div>


              <div style={{ marginTop: 10, fontSize: 13, color: '#6b7280' }}>
                Show this QR to staff so they can activate or add you to queues.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
