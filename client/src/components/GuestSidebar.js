// client/src/components/GuestSidebar.js
import React from "react";
import { NavLink } from "react-router-dom";

export default function GuestSidebar() {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  function handleSignout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220, 
        flexShrink: 0,
        background: "#07203a", 
        color: "#fff",
        minHeight: "100vh",
        padding: 18, 
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 18 }}> 
        <h3 style={{ margin: 0 }}>GUEST PANEL</h3>
        <div style={{ fontSize: 12, color: "#cbd5e1" }}>{user?.name || "Guest"}</div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}> 
        <NavLink 
          to="/guest/home" 
          style={({isActive}) => ({ 
            color: isActive ? "#07203a" : "#fff", 
            background: isActive ? "#fff" : "transparent", 
            padding: "8px 10px", 
            borderRadius: 6, 
            textDecoration: 'none' 
          })}
        >
          Home
        </NavLink>

        <NavLink 
          to="/guest/account" 
          style={({isActive}) => ({ 
            color: isActive ? "#07203a" : "#fff", 
            background: isActive ? "#fff" : "transparent", 
            padding: "8px 10px", 
            borderRadius: 6, 
            textDecoration: 'none' 
          })}
        >
          My QR
        </NavLink>

        <NavLink 
          to="/guest/queues" 
          style={({isActive}) => ({ 
            color: isActive ? "#07203a" : "#fff", 
            background: isActive ? "#fff" : "transparent", 
            padding: "8px 10px", 
            borderRadius: 6, 
            textDecoration: 'none' 
          })}
        >
          My Queues
        </NavLink>

        
        <button
          onClick={handleSignout}
          style={{ 
            marginTop: 12, 
            padding: "8px 10px", 
            background: '#ef4444', 
            color: '#fff', 
            border: 'none',
            borderRadius: 6,
            width: "100%", 
          }}
        >
          Sign out
        </button>
      </nav>
    </aside>
  );
}