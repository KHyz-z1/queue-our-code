import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

/**
 * Responsive StaffSidebar
 * - visible as left column on md+
 * - collapses to a drawer on small screens (toggle button)
 */
export default function StaffSidebar() {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);

  function handleSignout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const LinkItem = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive ? "bg-white text-[#07203a]" : "text-white hover:bg-white/10"
        }`
      }
      onClick={() => setOpen(false)}
    >
      {children}
    </NavLink>
  );

  return (
    <>
      {/* Desktop sidebar (md+) */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:min-w-[14rem] bg-[#07203a] text-white p-5 box-border">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">STAFF PANEL</h3>
          <div className="text-sm text-slate-200 mt-1 truncate">{user?.name || "Staff"}</div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <LinkItem to="/staff/home">Home</LinkItem>
          <LinkItem to="/staff/activate">Activate Guest</LinkItem>
          <LinkItem to="/staff/register-guest">Register Guest</LinkItem>
        </nav>

        <div className="mt-4">
          <button
            onClick={handleSignout}
            className="w-full px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile: floating burger button */}
      <div className="md:hidden">
        <button
          aria-label="Open staff menu"
          onClick={() => setOpen(true)}
          className="fixed left-3 top-3 z-50 p-2 rounded-md bg-white shadow-md text-[#07203a]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#07203a] text-white h-full shadow-2xl p-4 animate-slide-in-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-semibold text-white">
                  { (user?.name || "S").charAt(0).toUpperCase() }
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-md bg-white/5 hover:bg-white/10"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="font-semibold text-lg truncate">{user?.name || "Staff"}</div>
              <div className="text-xs text-slate-200 uppercase tracking-wide">{user?.role || "staff"}</div>
            </div>

            <nav className="flex flex-col gap-2">
              <LinkItem to="/staff/home">Home</LinkItem>
              <LinkItem to="/staff/activate">Activate Guest</LinkItem>
              <LinkItem to="/staff/register-guest">Register Guest</LinkItem>
            </nav>

            <div className="mt-auto pt-4">
              <button
                onClick={() => { setOpen(false); handleSignout(); }}
                className="w-full px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
