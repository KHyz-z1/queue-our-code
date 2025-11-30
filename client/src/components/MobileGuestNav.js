// client/src/components/MobileGuestNav.js
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import FAQModal from "./FAQModal";

export default function MobileGuestNav() {
  const [open, setOpen] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const navigate = useNavigate();

  // Optimization: Only parse localStorage when the component mounts, not every render
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "G";
  const role = user?.role || "guest";

  function handleSignout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Use replace to prevent back-button navigation to protected routes
    navigate("/login", { replace: true });
  }

  function openFaqFromDrawer() {
    setOpen(false);
    setTimeout(() => setShowFaq(true), 150);
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="p-2 -ml-2 rounded-md text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="font-semibold text-lg text-slate-900">
               Star City
            </div>

            {/* Placeholder to balance the flex layout */}
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" onClick={() => setOpen(false)} />

          <aside className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col animate-slide-in-left">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-sky-500 shadow-sm flex items-center justify-center text-white text-xl font-bold">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate text-lg">{user?.name || "Guest"}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">{role}</div>
                </div>
                <button 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" 
                  onClick={() => setOpen(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">

              <Link to="/guest/home" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
               Home
              </Link>
            
              <Link to="/guest/account" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
               My QR Code
              </Link>

              <Link to="/guest/queues" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
               My Queues
              </Link>

              <button
                onClick={openFaqFromDrawer}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
               FAQs
              </button>
            </nav>

            <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handleSignout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-700 font-medium hover:bg-red-100 transition-colors"
                >
                  Sign out
                </button>
                <div className="mt-4 text-center text-xs text-slate-300 font-medium">
                  v1.0.0 • Star Parks Guest
                </div>
            </div>
          </aside>
        </div>
      )}

      <FAQModal open={showFaq} onClose={() => setShowFaq(false)} />
    </>
  );
}