import React, { useState } from "react";
import api from "../utils/api";

function Activate() {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(null);

  const handleActivate = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // Send either UID or name
      const res = await api.post("/auth/activate", { name: input });
      setMessage("Account reactivated!");
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.msg || "Activation failed");
    }
  };

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>Re-Activate Your Account</h2>
      <p style={{ fontSize: "0.9rem", color: "#555" }}>
        Enter your name (or UID if available) to regain access.
      </p>

      <form onSubmit={handleActivate}>
        <input
          type="text"
          placeholder="Enter name or UID"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            padding: "0.6rem",
            width: "280px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
          required
        />
        <br />
        <button
          type="submit"
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "6px",
            backgroundColor: "#0078ff",
            color: "white",
          }}
        >
          Reactivate
        </button>
      </form>

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
      {token && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "green" }}>
          Token saved locally!
        </p>
      )}
    </div>
  );
}

export default Activate;
