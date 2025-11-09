// client/src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";
import Activate from "./pages/Activate";
import VerifyGuest from "./pages/VerifyGuest";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRides from "./pages/AdminRides";
import AdminLayout from "./pages/AdminLayout";
import RequireAdmin from "./components/RequireAdmin";
import AdminGuests from "./pages/AdminGuests";






function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 12 }}>
        <nav style={{ marginBottom: 12 }}>
          <Link to="/" style={{ marginRight: 8 }}>Register</Link>
          <Link to="/login" style={{ marginRight: 8 }}>Login (dev)</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/verify" element={<VerifyGuest />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Admin area (guarded) */}
        <Route path="/admin/*" element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }>
          {/* nested admin routes rendered inside AdminLayout Outlet */}
          <Route index element={<AdminDashboard />} />        {/* /admin */}
          <Route path="rides" element={<AdminRides />} />    {/* /admin/rides */}
          <Route path="staff" element={<AdminDashboard />} />{/* optional: /admin/staff */}
          <Route path="guests" element={<AdminGuests/>} />      {/* /admin/guests */}
        </Route>

          


        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
