import React from "react";

/** 
 * Card component fr wrapping content in a container 
 */ 
export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}>
      {children}
    </div>
  );
}
