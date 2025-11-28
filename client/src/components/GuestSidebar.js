// client/src/components/GuestSidebar.js
import React from "react";
import { NavLink } from "react-router-dom";
import Button from "../ui/Button";

export default function GuestSidebar() {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  function handleSignout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <aside className="w-56 min-w-[14rem] bg-[#07203a] text-white min-h-screen p-5 box-border hidden md:block">
      <div className="mb-6">
        <h3 className="text-lg font-bold">GUEST PANEL</h3>
        <div className="text-sm text-slate-300 truncate">{user?.name || "Guest"}</div>
      </div>

      <nav className="flex flex-col gap-2">
        <NavLink
          to="/guest/home"
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm ${isActive ? "bg-white text-[#07203a]" : "text-white hover:bg-white/10"}`
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/guest/account"
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm ${isActive ? "bg-white text-[#07203a]" : "text-white hover:bg-white/10"}`
          }
        >
          My QR
        </NavLink>

        <NavLink
          to="/guest/queues"
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm ${isActive ? "bg-white text-[#07203a]" : "text-white hover:bg-white/10"}`
          }
        >
          My Queues
        </NavLink>

        <div className="mt-4">
          <Button variant="danger" onClick={handleSignout} className="w-full justify-center">
            Sign out
          </Button>
        </div>
      </nav>
    </aside>
  );
}
