// client/src/components/MobileGuestNav.js
import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function MobileGuestNav() {
  const [open, setOpen] = useState(false);

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  function handleSignout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#07203a] text-white">
        <h1 className="font-bold text-lg">Guest Panel</h1>

        {/* Burger Button */}
        <button onClick={() => setOpen(true)} className="text-xl">
          ☰
        </button>
      </header>

      {/* Dark overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        ></div>
      )}

      {/* Sliding Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#07203a] text-white z-40 transform transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="p-5 border-b border-white/20">
          <h2 className="text-lg font-bold">GUEST PANEL</h2>
          <p className="text-sm text-slate-300 mt-1 truncate">
            {user?.name || "Guest"}
          </p>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col p-4 gap-2">
          <NavLink
            to="/guest/home"
            onClick={() => setOpen(false)}
            className="px-3 py-2 rounded-md hover:bg-white/10"
          >
            Home
          </NavLink>

          <NavLink
            to="/guest/account"
            onClick={() => setOpen(false)}
            className="px-3 py-2 rounded-md hover:bg-white/10"
          >
            My QR
          </NavLink>

          <NavLink
            to="/guest/queues"
            onClick={() => setOpen(false)}
            className="px-3 py-2 rounded-md hover:bg-white/10"
          >
            My Queues
          </NavLink>

          <button
            onClick={handleSignout}
            className="mt-4 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md"
          >
            Sign out
          </button>
        </nav>
      </aside>
    </>
  );
}
