import React from "react";

/**
 * Button - primary/secondary variants
 * variant: "primary" | "secondary" | "danger"
 */
export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "px-3 py-2 rounded-md text-sm font-semibold inline-flex items-center justify-center";
  const map = {
    primary: "bg-sky-600 hover:bg-sky-700 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };
  return (
    <button className={`${base} ${map[variant] || map.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
