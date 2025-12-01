import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import api from "../utils/api";
// import printStub from "../utils/printStub"; // Removed
import Button from "../ui/Button";

/**
 * Guest registration page.
 * Creates guest via /auth/register and generates a QR code for activation.
 */

export default function Register() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [qrData, setQrData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setQrData(null);

    try {
      const res = await api.post("/auth/register", { name });
      const { qrPayload } = res.data;

      // Printing logic removed:
      /*
      const stubData = {
        type: "registration",
        guestName: res.data.user?.name || "Guest",
        guestId: res.data.user?.id || qrPayload?.uid,
        qr: JSON.stringify(qrPayload)
      };

      try {
        printStub(stubData);
      } catch (err) {
        console.warn("printStub failed:", err);
      }
      */

      setMessage("Registration complete! Your QR code is ready for activation.");
      setQrData(qrPayload);
      setName("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.msg || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Adjusted Logo and Heading Section */}
        <div className="text-center mb-8">
          {/* LOGO: Increased size to w-40 h-40 */}
          <img src="/SClogo.png" alt="Star City" className="mx-auto w-40 h-40 object-contain" /> 
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Guest Registration</h2>
          <p className="text-sm text-slate-500 mt-2">Create a guest account and receive an activation QR code</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              aria-label="Guest name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            />

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full py-3" 
              disabled={loading || !name.trim()}
            >
              {loading ? "Registering..." : "Register & Generate QR"}
            </Button>
          </form>

          {message && <div className={`mt-4 p-3 border rounded-lg text-sm text-center font-medium ${qrData ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{message}</div>}

          {qrData && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <h3 className="text-md font-semibold text-slate-700 mb-3">Activation QR Code</h3>
              <div className="inline-block bg-white p-4 rounded-xl border border-slate-200 shadow-md">
                <QRCodeCanvas value={JSON.stringify(qrData)} size={200} includeMargin={false} /> {/* Increased QR size */}
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Show this QR code to a staff member for **immediate activation** of your guest account.
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered? <a href="/login" className="text-sky-600 hover:underline font-medium">Activate here</a>
        </div>
      </div>
    </div>
  );
}