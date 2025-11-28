import React from "react";

/**
 * Badge with color 
 * default gray
 */
export default function Badge({ children, colorClass = "bg-gray-400", className = "" }) {
  // colorClass SHOULD BE a tailwind/bg color utility string or custom class
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${colorClass} ${className}`}>
      {children}
    </span>
  );
}
