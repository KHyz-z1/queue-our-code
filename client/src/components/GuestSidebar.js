// client/src/components/GuestSidebar.js
import React from "react";
import { NavLink } from "react-router-dom";

export default function GuestSidebar() {
  const activeStyle = { background: "#e6f6ff", color: "#0369a1" };

  return (
    <aside
      style={{
        width: 220,
        background: "#f3f4f6",
        minHeight: "100vh",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Guest Menu</h3>

      <nav style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        <NavLink to="/guest/home" style={({isActive}) => ({ padding: 10, borderRadius: 6, textDecoration: 'none', color: '#111', background: isActive ? '#e6f6ff' : '#fff' })}>
          Home
        </NavLink>

        <NavLink to="/guest/account" style={({isActive}) => ({ padding: 10, borderRadius: 6, textDecoration: 'none', color: '#111', background: isActive ? '#e6f6ff' : '#fff' })}>
          My QR
        </NavLink>

        <NavLink to="/guest/queues" style={({isActive}) => ({ padding: 10, borderRadius: 6, textDecoration: 'none', color: '#111', background: isActive ? '#e6f6ff' : '#fff' })}>
          My Queues
        </NavLink>

        <button
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
          style={{ marginTop: 8, padding: 10, borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none' }}
        >
          Sign out
        </button>
      </nav>
    </aside>
  );
}
