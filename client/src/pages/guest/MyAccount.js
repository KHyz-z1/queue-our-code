import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import MobileGuestNav from "../../components/MobileGuestNav";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";
import api from "../../utils/api";

export default function MyAccount() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/auth/me");
        const user = res.data.user || res.data;
        setMe(user);
      } catch (err) {
        console.error("load me err", err);
        setMsg("Could not load account. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const snowAccess = me?.snowAccess;
  const snowText =
    typeof snowAccess === "undefined"
      ? "N/A"
      : snowAccess
      ? "Yes"
      : "No";

  const snowColor =
    typeof snowAccess === "undefined"
      ? "bg-gray-400"
      : snowAccess
      ? "bg-green-600"
      : "bg-red-500";

  const qrPayload = me
    ? JSON.stringify({ uid: me.id, vtok: me.verificationToken || "" })
    : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <MobileGuestNav />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-5">
        <h2 className="text-xl font-semibold mb-4">My Account</h2>

        {loading && (
          <div className="text-slate-500 text-sm">Loading...</div>
        )}

        {msg && (
          <div className="mb-4 text-sm text-red-600">{msg}</div>
        )}

        {!loading && !me && (
          <Card className="p-4 text-sm text-slate-600">
            Unable to load account. Please log in again.
          </Card>
        )}

        {!loading && me && (
          <>
            {/* QR + Info Card */}
            <Card className="flex flex-col sm:flex-row gap-5 items-center sm:items-start p-5">

              {/* QR BLOCK */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
                <QRCode value={qrPayload} size={160} />
              </div>

              {/* INFO BLOCK */}
              <div className="flex-1 min-w-0">

                <div className="font-bold text-lg text-slate-900 truncate">
                  {me.name}
                </div>

                <div className="text-sm text-slate-600 mt-1">
                  UID: <span className="font-medium">{me.id}</span>
                </div>

                {/* Verified Status */}
                <div className="mt-2">
                  {me.verified ? (
                    <Badge colorClass="bg-green-600">Verified at Gate</Badge>
                  ) : (
                    <Badge colorClass="bg-amber-500">Not Verified</Badge>
                  )}
                </div>

                {/* Snow World Access */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-slate-600">Snow World Access:</span>
                  <Badge colorClass={snowColor}>{snowText}</Badge>
                </div>

                {/* Instructions */}
                <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                  Show this QR code to a ride staff so they can add you to the virtual queue.
                </p>
              </div>
            </Card>

            {/* Additional info / fof future items */}
            <div className="mt-6 text-xs text-slate-400 text-center">
              v1.0 • Star Parks Guest
            </div>
          </>
        )}
      </main>
    </div>
  );
}
