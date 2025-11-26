// client/src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api"; 

export default function Login() {
  const navigate = useNavigate();

  // shared UI state
  const [mode, setMode] = useState("guest"); // "guest" | "staff"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // guest re-activate form
  const [guestNameOrUid, setGuestNameOrUid] = useState("");

  // staff login form
  const [starPassCode, setStarPassCode] = useState("");

  // helper to persist token & user
  function saveSession(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }

  // route helper based on role
  function routeByRole(user) {
    if (!user || !user.role) return navigate("/");
    if (user.role === "admin") return navigate("/admin");
    if (user.role === "staff") return navigate("/staff/home");
    // default guest home
    return navigate("/guest/home");
  }

  // Guest activation / re-issue token
  const handleGuestActivate = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const body = { name: guestNameOrUid }; // try name first
      const res = await api.post("/auth/activate", body);
      const token = res.data.token;
      const user = res.data.user;
      saveSession(token, user);
      setMsg("✅ Activated — redirecting to Guest homepage...");
      setTimeout(() => routeByRole(user), 700);
    } catch (err) {
      console.error("activate err", err);
      const serverMsg = err.response?.data?.msg || "Activation failed";
      setMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Staff/Admin login using starPassCode
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
      const serverMsg = err.response?.data?.msg || "Login failed";
      setMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 560, margin: "30px auto" }}>
      <h2>Queue-Our-Code — Login / Activate</h2>

      <p style={{ color: "#666" }}>
        Choose mode: <strong onClick={() => setMode("guest")} style={{ cursor: "pointer", color: mode === "guest" ? "blue" : "inherit" }}>Guest</strong> |{" "}
        <strong onClick={() => setMode("staff")} style={{ cursor: "pointer", color: mode === "staff" ? "blue" : "inherit" }}>Staff / Admin</strong>
      </p>

      {mode === "guest" && (
        <form onSubmit={handleGuestActivate} style={{ marginTop: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Guest re-activation (name or UID)</label>
          <input
            placeholder="Enter registered name or UID"
            value={guestNameOrUid}
            onChange={(e) => setGuestNameOrUid(e.target.value)}
            style={{
            padding: "0.6rem",
            width: "80%",
            marginBottom: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
            required
          />
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={loading} style={{
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#0078ff",
            color: "white"
          }}>
              {loading ? "Processing..." : "Login"}
            </button>
          </div>
        </form>
      )}

      {mode === "staff" && (
        <form onSubmit={handleStaffLogin} style={{ marginTop: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Staff / Admin login (StarPass code)</label>
          <input
            placeholder="Enter StarPass code"
            value={starPassCode}
            onChange={(e) => setStarPassCode(e.target.value)}
            style={{
            padding: "0.6rem",
            width: "80%",
            marginBottom: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
            required
          />
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={loading} style={{
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#0078ff",
            color: "white"
          }}>
              {loading ? "Signing in..." : "Sign in (Staff / Admin)"}
            </button>
          </div>
        </form>
      )}

      {msg && <p style={{ marginTop: 14, color: msg.startsWith("✅") ? "green" : "red" }}>{msg}</p>}

      <p style={{ marginTop: 18, color: "#444", fontSize: 13 }}>
        NOTE: Guests should use this page to re-activate / re-issue token if they get logged out. Staff/Admin use StarPass code to sign in.
      </p>
    </div>
  );
}
