import React, { useState } from "react";
import QRScanner from "../../components/QRScanner";
import api from '../../utils/api';

export default function StaffActivate() {
  const [uid, setUid] = useState("");
  const [vtok, setVtok] = useState("");
  const [msg, setMsg] = useState("");
  const [snowMsg, setSnowMsg] = useState("");
  const [status, setStatus] = useState("idle");
  const [snowAccess, setSnowAccess] = useState(false);

  const token = localStorage.getItem("token");

  async function handleVerify(e) {
    e.preventDefault();
    setMsg("Verifying...");
    setSnowMsg("");
    setStatus("idle");

    try {
      const res = await api.post('/auth/verify',
        { uid, vtok, snowAccess },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setStatus("success");
      setMsg(res.data.msg || 'Guest verified successfully!');
      if (res.data.user) {
        const hasAccess = res.data.user.snowAccess ? "YES" : "NO";
        setSnowMsg(`Snow World Access: ${hasAccess}`);
      }

      setUid('');
      setVtok('');
      setSnowAccess(false);
    } catch (err) {
      console.error('verify err', err);
      setStatus("error");
      setMsg(err.response?.data?.msg || 'Verification Failed');
      setSnowMsg("");
    }
  }

  const handleScan = (decoded) => {
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
    <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Activate / Verify Guest</h2>
        <div className="text-sm text-slate-500">Scan QR or enter manually</div>
      </div>

      <section className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 mb-6">
        <h4 className="mb-3 text-sm font-medium">Scan guest QR (recommended)</h4>

        <div className="mb-3">
          <QRScanner
            onDecode={handleScan}
            onError={(e) => {
              setMsg("Scanner error: " + String(e));
              setStatus("error");
            }}
          />
        </div>

        <form onSubmit={handleVerify} className="grid gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Guest UID</label>
            <input
              placeholder="Guest UID"
              value={uid}
              onChange={e => setUid(e.target.value)}
              className="w-full px-3 py-2 border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Verification Token</label>
            <input
              placeholder="VTOK"
              value={vtok}
              onChange={e => setVtok(e.target.value)}
              className="w-full px-3 py-2 border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <label className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={snowAccess}
              onChange={e => setSnowAccess(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="font-medium">Grant Snow World access</span>
          </label>

          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Verify Guest
            </button>
          </div>
        </form>

        {msg && (
          <div
            className={`mt-4 p-3 rounded-md border ${
              status === 'success'
                ? "bg-green-50 border-green-200 text-green-800"
                : status === 'error'
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-slate-50 border-slate-100 text-slate-700"
            }`}
          >
            <div className="font-semibold mb-1">{status === 'success' ? 'Success' : status === 'error' ? 'Error' : 'Info'}</div>
            <div>{msg}</div>
            {snowMsg && status === 'success' && (
              <div className="mt-2 font-medium border-t pt-2 text-slate-700">{snowMsg}</div>
            )}
          </div>
        )}

        <div className="mt-4 text-sm text-slate-500">
          Tip: You can paste guest QR payload uid/vtok in the inputs to verify quickly.
        </div>
      </section>
    </div>
  );
}