// client/src/pages/staff/StaffHome.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API = "http://localhost:5000/api/staff";

export default function StaffHome() {
  const [rides, setRides] = useState([]);
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRides();
  }, []);

  async function fetchRides() {
    try {
      const res = await axios.get(`${API}/rides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort by queueCount descending for "most congested first" display
      const sortedRides = (res.data.rides || []).sort((a, b) => b.queueCount - a.queueCount);
      setRides(sortedRides);
    } catch (err) {
      console.error("fetchRides err", err);
      setMsg("Could not load rides");
    }
  }

  const statusColors = {
    open: "#10b981", // Green
    maintenance: "#f59e0b", // Amber
    closed: "#ef4444", // Red
  };

  // Define common button/link styles here for consistency
  const baseButtonStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: 8,
    border: 'none',
    fontWeight: 600,
    textAlign: 'center',
    cursor: 'pointer',
    textDecoration: 'none', // For Link consistency
    boxSizing: 'border-box', // Crucial fix to prevent cropping due to padding
    // Note: Link requires display: 'inline-block' or similar if not set as a native block
  };

  return (
    // Centered container with max width
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, backgroundColor: '#f9fafb' }}>
      <header style={{ marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Ride Management Dashboard</h1>
        <p style={{ color: "#6b7280", margin: '4px 0 0 0' }}>Overview of all amusement rides.</p>
      </header>

      {msg && (
        <div style={{ padding: 12, marginBottom: 16, background: "#fef2f2", color: "#b91c1c", borderRadius: 6, border: '1px solid #fca5a5' }}>
          {msg}
        </div>
      )}

      <div style={{ display: "grid", gap: 20 }}>
        {rides.length === 0 && !msg ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No rides found.</div>
        ) : (
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {rides.map((r) => (
                <div 
                    key={r.id} 
                    style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        borderRadius: 12, 
                        background: "#fff", 
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)", 
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb'
                    }}
                >
                    {/* Ride Image/Placeholder */}
                    <div style={{ height: 160, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                    {r.image ? (
                        <img
                        src={`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${r.image}`}
                        alt={r.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    ) : (
                        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' }}>
                            
                        </div>
                    )}
                    </div>
                    
                    {/* Ride Details */}
                    <div style={{ padding: 16, flexGrow: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{r.name}</div>
                        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>
                            ID: {r.id} • Max Cap: {r.capacity} • Duration: {r.duration} min
                        </div>
                        
                        {/* Queue and Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>{r.queueCount}</div>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>in queue</div>
                            </div>
                            
                            <div 
                                style={{ 
                                    fontSize: 12, 
                                    fontWeight: 600, 
                                    color: '#fff', 
                                    padding: '4px 8px', 
                                    borderRadius: 6, 
                                    background: statusColors[r.status] || '#9ca3af',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {r.status}
                            </div>
                        </div>
                    </div>

                    {/* Action Button - Unified styling and box-sizing */}
                    <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        { r.status !== 'open' ? (
                            <button 
                                disabled 
                                style={{ 
                                    ...baseButtonStyle,
                                    cursor: 'not-allowed',
                                    background:'#d1d5db', 
                                    color:'#4b5563', 
                                }}
                            >
                                CANNOT MANAGE
                            </button>
                        ) : (
                            <Link 
                                to={`/staff/rides/${r.id}`} 
                                // Added display: 'inline-block' for reliable width/padding application on the Link component
                                style={{ 
                                    ...baseButtonStyle,
                                    display: 'inline-block', 
                                    background: "#0369a1", 
                                    color: '#fff', 
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                Manage Ride
                            </Link>
                        )}
                    </div>
                </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}