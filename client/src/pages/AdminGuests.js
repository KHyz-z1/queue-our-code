// client/src/pages/AdminGuests.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = `${(process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/admin`;

export default function AdminGuests() {
  const [guests, setGuests] = useState([]);
  const [msg, setMsg] = useState("");
  const [expanded, setExpanded] = useState(null); // id of expanded guest
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchGuests();
  }, []);

  async function fetchGuests() {
    try {
      const res = await axios.get(`${API_BASE}/guests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuests(res.data.guests || []);
    } catch (err) {
      console.error("fetchGuests err", err);
      setMsg("Could not load guests (see console).");
    }
  }

  function toggleExpand(id) {
    setExpanded(prev => (prev === id ? null : id));
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete guest "${name}"? This cannot be undone.`)) return;
    try {
      const res = await axios.delete(`${API_BASE}/guests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg(res.data.msg || "Guest deleted");
      fetchGuests();
    } catch (err) {
      console.error("delete guest err", err);
      setMsg(err.response?.data?.msg || "Server error");
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 18 }}>
      <h2 style={{ textAlign: "center", marginBottom: 12 }}>Guest Users</h2>

      {msg && (
        <div style={{ marginBottom: 12, padding: 10, background: "#fff3cd", borderRadius: 6 }}>
          {msg}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {guests.length === 0 ? (
          <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc" }}>No guests found.</div>
        ) : guests.map(g => {
          const isOpen = expanded === g.id;
          return (
            <div
              key={g.id}
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>ID: {g.id}</div>
                  <div style={{ fontSize: 12, color: g.verified ? "#065f46" : "#b91c1c" }}>
                    {g.verified ? "Verified" : "Unverified"}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Created: {new Date(g.createdAt).toLocaleString()}</div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => toggleExpand(g.id)}
                    aria-expanded={isOpen}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "transparent",
                      border: "1px solid #e6edf3",
                      padding: "8px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{isOpen ? "Hide queues" : "Show queues"}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .18s" }}>
                      <path d="M6 9l6 6 6-6" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(g.id, g.name)}
                    style={{ background: "#ef4444", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 6, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Verified details */}
              <div style={{ fontSize: 13, color: "#374151" }}>
                {g.verifiedAt ? (
                  <div>Verified at: {new Date(g.verifiedAt).toLocaleString()} by: {g.verifiedByName || g.verifiedBy || "—"}</div>
                ) : (
                  <div>Not verified yet</div>
                )}
              </div>

              {/* Expandable area */}
              <div
                style={{
                  maxHeight: isOpen ? 400 : 0,
                  overflow: "hidden",
                  transition: "max-height .25s ease",
                }}
              >
                <div style={{ marginTop: isOpen ? 8 : 0 }}>
                  {g.activeQueues && g.activeQueues.length > 0 ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      {g.activeQueues.map(q => (
                        <div key={q.id} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          padding: "8px 10px",
                          borderRadius: 6,
                          background: "#f8fafc",
                          border: "1px solid #eef2f7"
                        }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{q.rideName || q.rideId}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>Position: {q.position} • {q.status}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>Joined: {new Date(q.joinedAt).toLocaleString()}</div>
                          </div>

                          {/* <div style={{ fontSize: 12, color: "#374151" }}>  view button disabled for now
                            <button
                              onClick={() => {}}
                              style={{ background: "#0369a1", color: "#fff", padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer" }}
                            >
                              View
                            </button>
                          </div> */}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 10, borderRadius: 6, background: "#f8fafc", color: "#6b7280" }}>No active or waiting queues</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
