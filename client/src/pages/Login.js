import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import Button from "../ui/Button";

/**
 * Login / Activate page
 * - Guest: activate / re-issue token (name or UID)
 * - Staff: login with StarPass code
 */

export default function Login() {
  const navigate = useNavigate();

  // UI state
  const [mode, setMode] = useState("guest"); // "guest" | "staff"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // guest activation
  const [guestNameOrUid, setGuestNameOrUid] = useState("");

  // staff login
  const [starPassCode, setStarPassCode] = useState("");

  function saveSession(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }

  function routeByRole(user) {
    if (!user || !user.role) return navigate("/");
    if (user.role === "admin") return navigate("/admin");
    if (user.role === "staff") return navigate("/staff/home");
    return navigate("/guest/home");
  }

  // Guest activation
  const handleGuestActivate = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const body = { name: guestNameOrUid };
      const res = await api.post("/auth/activate", body);
      const token = res.data.token;
      const user = res.data.user;
      saveSession(token, user);
      setMsg("✅ Activated — redirecting to Guest homepage...");
      setTimeout(() => routeByRole(user), 700);
    } catch (err) {
      console.error("activate err", err);
      setMsg(err.response?.data?.msg || "Activation failed");
    } finally {
      setLoading(false);
    }
  };

  // Staff login
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { starPassCode });
      const token = res.data.token;
      const user = res.data.user;
      saveSession(token, user);
      setMsg("✅ Login successful — redirecting...");
      setTimeout(() => routeByRole(user), 500);
    } catch (err) {
      console.error("login err", err);
      setMsg(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/SClogo.png" alt="Star City" className="mx-auto w-40 h-40 object-contain" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Star City — Queue Portal</h1>
          <p className="text-sm text-slate-500 mt-2">Guest Activation / Staff Sign-In</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 justify-center mb-6">
            <button
              type="button"
              onClick={() => { setMode("guest"); setMsg(""); }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                mode === "guest" ? "bg-sky-600 text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Guest Activation
            </button>
            <button
              type="button"
              onClick={() => { setMode("staff"); setMsg(""); }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                mode === "staff" ? "bg-sky-600 text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Staff / Admin
            </button>
          </div>

          {mode === "guest" ? (
            <form onSubmit={handleGuestActivate} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Enter Name or UID from registration:</label>
              <input
                aria-label="Guest name or UID"
                value={guestNameOrUid}
                onChange={(e) => setGuestNameOrUid(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Name or UID"
              />

              <Button type="submit" variant="primary" className="w-full py-3" disabled={loading || !guestNameOrUid.trim()}>
                {loading ? "Processing..." : "Activate / Login (Guest)"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">StarPass code required for sign-in:</label>
              <input
                aria-label="StarPass code"
                type="password" 
                value={starPassCode}
                onChange={(e) => setStarPassCode(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Enter StarPass code"
              />

              <Button type="submit" variant="primary" className="w-full py-3" disabled={loading || !starPassCode.trim()}>
                {loading ? "Signing in..." : "Sign in (Staff / Admin)"}
              </Button>
            </form>
          )}

          {msg && (
            <div className={`mt-4 p-3 border rounded-lg text-sm text-center font-medium ${msg.startsWith("✅") ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {msg}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            Not registered yet? <Link to="/" className="text-sky-600 hover:underline font-medium">Register here</Link>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          v1.0 • Star Parks
        </div>
      </div>
    </div>
  );
}