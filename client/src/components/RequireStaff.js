// client/src/components/RequireStaff.js
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * RequireStaff
 * - Checks localStorage.user for a staff or admin role
 * - Redirects to /login if not present or role mismatch
 */
export default function RequireStaff({ children }) {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return <Navigate to="/login" replace />;
    const user = JSON.parse(raw);
    if (!user || (user.role !== "staff" && user.role !== "admin")) {
      return <Navigate to="/login" replace />;
    }
    return children;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
}
