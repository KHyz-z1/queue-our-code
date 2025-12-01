// client/src/pages/Register.js
import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import api from "../utils/api";
import Button from "../ui/Button";
import TermsModal from "../components/TermsModal"; 

export default function Register() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [qrData, setQrData] = useState(null);

  // terms modal state + checkbox
  const [showTerms, setShowTerms] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const [showTnCError, setShowTnCError] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setMessage("");
    setQrData(null);
    setShowTnCError(false); 

    if (!agreed) {
      setMessage("You must agree to the Terms & Conditions to register.");
      setShowTnCError(true); 
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/register", { name });
      const { qrPayload } = res.data;

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

  const messageStyle = (() => {
    if (!message) return "";

    if (showTnCError) {
        return "bg-amber-50 text-amber-800 border-amber-200";
    }
    
    return qrData ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200";
  })();


  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-slate-50 p-4">
      <div className="w-full max-w-md mt-16 mb-8">
        <div className="text-center mb-8">
          <img src="/SClogo.png" alt="Star City" className="mx-auto w-60 h-60 object-contain" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Guest Registration</h2>
          <p className="text-sm text-slate-500 mt-2">Create a guest account and receive an activation QR code</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <input
              aria-label="Guest name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            />

            <div className="flex items-start gap-3">
              <label className="inline-flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-200"
                />
                <span className="text-slate-700">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-sky-600 hover:underline font-medium"
                  >
                    Terms &amp; Conditions
                  </button>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              // UPDATED: Removed '!agreed' so user can click and see the error
              disabled={loading || !name.trim()}
            >
              {loading ? "Registering..." : "Register & Generate QR"}
            </Button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 border rounded-lg text-sm text-center font-medium ${messageStyle}`}
            >
              {message}
            </div>
          )}

          {qrData && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <h3 className="text-md font-semibold text-slate-700 mb-3">Activation QR Code</h3>
              <div className="inline-block bg-white p-4 rounded-xl border border-slate-200 shadow-md">
                <QRCodeCanvas value={JSON.stringify(qrData)} size={200} includeMargin={false} />
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Show this QR code to a staff member for <strong>immediate activation</strong> of your guest account.
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered? <a href="/login" className="text-sky-600 hover:underline font-medium">Activate here</a>
        </div>
      </div>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}