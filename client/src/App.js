// client/src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Register from "./pages/Register";
import Activate from "./pages/Activate";
import VerifyGuest from "./pages/VerifyGuest";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRides from "./pages/AdminRides";
import AdminLayout from "./pages/AdminLayout";
import RequireAdmin from "./components/RequireAdmin";
import AdminGuests from "./pages/AdminGuests";
import AdminReports from './pages/admin/AdminReports';


import RequireStaff from "./components/RequireStaff";
import StaffLayout from "./pages/staff/StaffLayout";
import StaffHome from "./pages/staff/StaffHome";
import StaffActivate from "./pages/staff/StaffActivate";
import QueueManage from "./pages/staff/QueueManage";
import RegisterGuest from "./pages/staff/RegisterGuest";

import MyAccount from './pages/guest/MyAccount';
import RidesList from './pages/guest/RidesList';
import MyQueues from './pages/guest/MyQueues';
import GuestHome from './pages/guest/GuestHome';
import GuestRideStatus from './pages/guest/GuestRideStatus';

/**
 * Small TopNav that only appears on public auth pages.
 * We use useLocation inside a component so hooks work correctly.
 */
function TopNav() {
  const location = useLocation();
  const p = location.pathname || "";

  // show nav only on auth pages (exact match)
  const showAuthNav = ["/", "/login", "/activate", "/verify"].includes(p);

  if (!showAuthNav) return null;

  return (
    <nav style={{ marginBottom: 12 }}>
      <Link to="/" style={{ marginRight: 8 }}>Register</Link>
      <Link to="/login" style={{ marginRight: 8 }}>Login (dev)</Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 12 }}>
        <TopNav />

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
            <Route path="guests" element={<AdminGuests/>} />    {/* /admin/guests */}
            <Route path="reports" element={<AdminReports />} />

          </Route>

          <Route path="/staff/*" element={<RequireStaff><StaffLayout/></RequireStaff>}>
            <Route index element={<StaffHome />} />                {/* /staff */}
            <Route path="home" element={<StaffHome />} />         {/* /staff/home */}
            <Route path="activate" element={<StaffActivate />} /> {/* /staff/activate */}
            <Route path="rides/:rideId" element={<QueueManage />} />{/* /staff/rides/:rideId */}
            <Route path="register-guest" element={<RegisterGuest />} /> {/* /staff/register-guest */}
          </Route>

          <Route path="/guest/home" element={<GuestHome/>} />
          <Route path="/guest/account" element={<MyAccount/>} />
          <Route path="/guest/rides" element={<RidesList/>} />
          <Route path="/guest/queues" element={<MyQueues/>} />
          <Route path="/guest/ride/:rideId" element={<GuestRideStatus />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
