// client/src/components/MobileGuestNav.js
import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

export default function MobileGuestNav() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggle() {
    setOpen(!open);
  }

  function close() {
    setOpen(false);
  }

  // close when clicking overlay
  function onOverlayClick(e) {
    if (e.target === overlayRef.current) close();
  }

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <>
      {/* Top header */}
      <header className="w-full bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            aria-label="Open navigation"
            onClick={toggle}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            {/* Burger icon */}
            <svg className="w-6 h-6 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="text-lg font-semibold text-slate-800">Dashboard</div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-semibold">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : "G"}
            </div>
          </div>
        </div>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div
          ref={overlayRef}
          onClick={onOverlayClick}
          className="fixed inset-0 z-40 bg-black/40 flex"
        >
          {/* Drawer panel (left) */}
          <nav className="w-72 max-w-[85%] bg-white h-full p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Menu</div>
              <button aria-label="Close" onClick={close} className="p-1">
                <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ul className="space-y-2">
              <li>
                <NavLink to="/guest/home" onClick={close} className={({isActive}) => `block px-3 py-2 rounded-md ${isActive ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/guest/account" onClick={close} className={({isActive}) => `block px-3 py-2 rounded-md ${isActive ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>
                  My QR
                </NavLink>
              </li>
              <li>
                <NavLink to="/guest/queues" onClick={close} className={({isActive}) => `block px-3 py-2 rounded-md ${isActive ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>
                  My Queues
                </NavLink>
              </li>
              <li>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50"
                >
                  Sign out
                </button>
              </li>
            </ul>

            {/* small footer */}
            <div className="mt-6 text-xs text-slate-500">
              Star Parks — Guest Panel
            </div>
          </nav>

          {/* rest of overlay (click to close) */}
          <div className="flex-1" />
        </div>
      )}
    </>
  );
}
