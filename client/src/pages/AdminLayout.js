// client/src/pages/AdminLayout.js
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

/**
 * AdminLayout
 * - Simple sidebar + content area
 * - Links: Dashboard (staff), Rides, Guests
 *
 * Uses localStorage 'user' to show role and do a basic guard.
 */

function getUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = getUser();

  function handleSignOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <aside style={{
        width: 220,
        background: "#0f172a",
        color: "#fff",
        padding: 18,
        boxSizing: "border-box"
      }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>QUEUE-OUR-CODE</h2>
          <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>
            Admin Panel
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <NavLink
            to="/admin"
            end
            style={({ isActive }) => ({
              color: isActive ? "#0f172a" : "#fff",
              background: isActive ? "#fff" : "transparent",
              padding: "8px 10px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600
            })}
          >
            Staff Management
          </NavLink>

          <NavLink
            to="/admin/rides"
            style={({ isActive }) => ({
              color: isActive ? "#0f172a" : "#fff",
              background: isActive ? "#fff" : "transparent",
              padding: "8px 10px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600
            })}
          >
            Rides
          </NavLink>

                    <NavLink
            to="/admin/guests"
            style={({ isActive }) => ({
              color: isActive ? "#0f172a" : "#fff",
              background: isActive ? "#fff" : "transparent",
              padding: "8px 10px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600
            })}
          >
            Guests
          </NavLink>

           <NavLink
            to="/admin/reports"
            style={({ isActive }) => ({
              color: isActive ? "#0f172a" : "#fff",
              background: isActive ? "#fff" : "transparent",
              padding: "8px 10px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600
            })}
          >
            Reports
          </NavLink>

        </nav>

        <div style={{ marginTop: 24, fontSize: 13, color: "#94a3b8" }}>
          Signed in as:
          <div style={{ color: "#fff", marginTop: 6, fontWeight: 600 }}>{user?.name || "Unknown"}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{user?.role || ""}</div>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            marginTop: 22,
            background: "#ef4444",
            color: "#fff",
            border: "none",
            padding: "8px 10px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Sign out
        </button>
      </aside>

      <main style={{ flex: 1, padding: 20, background: "#f8fafc" }}>
        <Outlet />
      </main>
    </div>
  );
}
