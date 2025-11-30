// client/src/components/GuestSidebar.js
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function GuestSidebar() {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const navigate = useNavigate();

  function handleSignout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <aside className="hidden md:flex md:flex-col w-56 bg-white border-r border-slate-100 p-4 min-h-screen">
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold">
          {user?.name ? user.name.charAt(0).toUpperCase() : "G"}
        </div>
        <div>
          <div className="font-semibold text-slate-900">{user?.name || "Guest"}</div>
          <div className="text-xs text-slate-500">{user?.role || "guest"}</div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        <NavLink to="/guest/home" className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>Home</NavLink>
        <NavLink to="/guest/account" className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>My QR</NavLink>
        <NavLink to="/guest/queues" className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>My Queues</NavLink>
        <NavLink to="/faq" className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>FAQs</NavLink>
      </nav>

      <div className="mt-4">
        <button onClick={handleSignout} className="w-full px-3 py-2 rounded bg-red-50 text-red-700 hover:bg-red-100">Sign out</button>
      </div>
    </aside>
  );
}
