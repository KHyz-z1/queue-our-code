// client/src/components/StaffSidebar.js
import React from "react";
import { NavLink } from "react-router-dom";

export default function StaffSidebar() {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <aside style={{ width: 220, minWidth: 220, flexShrink: 0, background: "#07203a", color: "#fff", padding: 18, boxSizing: "border-box" }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>STAFF PANEL</h3>
        <div style={{ fontSize: 12, color: "#cbd5e1" }}>{user?.name || "Staff"}</div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <NavLink to="/staff/home" style={({isActive}) => ({ color: isActive ? "#07203a" : "#fff", background: isActive ? "#fff" : "transparent", padding: "8px 10px", borderRadius: 6, textDecoration: "none" })}>Home</NavLink>
        <NavLink to="/staff/activate" style={({isActive}) => ({ color: isActive ? "#07203a" : "#fff", background: isActive ? "#fff" : "transparent", padding: "8px 10px", borderRadius: 6, textDecoration: "none" })}>Activate Guest</NavLink>
        <NavLink to="/staff/rides" style={({isActive}) => ({ color: isActive ? "#07203a" : "#fff", background: isActive ? "#fff" : "transparent", padding: "8px 10px", borderRadius: 6, textDecoration: "none" })}>Rides</NavLink>
      </nav>
    </aside>
  );
}
