import axios from "axios";

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";


export default function AdminVerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("verifying");

  

useEffect(() => {
  const token = new URLSearchParams(window.location.search).get("token");

  if (!token) {
    setStatus("error");
    return;
  }

  axios
    .get(`${process.env.REACT_APP_API_BASE}/api/admin/verify-email?token=${token}`)
    .then((res) => {
      if (res.data.msg === 'Admin email verified successfully') {
        setStatus("success");
      } else {
        setStatus("error");
      }
    })
    .catch((err) => {
      console.error("Verification Error:", err.response?.data || err.message);
      setStatus("error");
    });
}, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-6 rounded-xl shadow max-w-md text-center">
        {status === "verifying" && <p>Verifying email…</p>}
        {status === "success" && (
          <>
            <h2 className="text-green-600 font-bold text-xl">Email Verified</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your admin email has been successfully verified.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-red-600 font-bold text-xl">Verification Failed</h2>
            <p className="mt-2 text-sm text-slate-600">
              The verification link is invalid or expired.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
