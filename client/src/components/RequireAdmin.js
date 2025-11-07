// client/src/components/RequireAdmin.js
import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return <Navigate to="/login" replace />;
    const user = JSON.parse(raw);
    if (user.role !== "admin") return <Navigate to="/login" replace />;
    return children;
  } catch {
    return <Navigate to="/login" replace />;
  }
}
