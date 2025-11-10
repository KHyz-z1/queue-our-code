// client/src/pages/staff/StaffHome.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API = "http://localhost:5000/api/staff";

export default function StaffHome() {
  const [rides, setRides] = useState([]);
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => { fetchRides(); }, []);

  async function fetchRides() {
    try {
      const res = await axios.get(`${API}/rides`, { headers: { Authorization: `Bearer ${token}` } });
      setRides(res.data.rides || []);
    } catch (err) {
      console.error('fetchRides err', err);
      setMsg('Could not load rides');
    }
  }

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <h2>Rides — Most congested first</h2>
        {msg && <div style={{ marginBottom: 8 }}>{msg}</div>}
        <div style={{ display: "grid", gap: 12 }}>
          {rides.map(r => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: 12, borderRadius: 8, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>ID: {r.id} • Capacity: {r.capacity} • {r.duration} min</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{r.queueCount}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>in queue</div>
                <Link to={`/staff/rides/${r.id}`} style={{ marginTop: 8, background: "#0369a1", color: '#fff', padding: '6px 10px', borderRadius: 6, textDecoration: 'none' }}>Manage</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
