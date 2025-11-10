// client/src/pages/staff/StaffLayout.js
import React from "react";
import { Outlet } from "react-router-dom";
import StaffSidebar from "../../components/StaffSidebar";

export default function StaffLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <StaffSidebar />
      <main style={{ flex: 1, padding: 20, background: "#f8fafc" }}>
        <Outlet />
      </main>
    </div>
  );
}
