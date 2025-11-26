// client/src/pages/Register.js
import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import api from "../utils/api";
import printStub from "../utils/printStub";


function Register() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [qrData, setQrData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setQrData(null);


    try {
      const res = await api.post("/auth/register", { name });
      const { qrPayload } = res.data;

      // after successful register (client)
const stubData = {
  type: "registration",
  guestName: res.data.user?.name || "Guest",
  guestId: res.data.user?.id || qrPayload?.uid,
  qr: JSON.stringify(qrPayload) // or qrPayload.uid depending on your decode logic
};
    printStub(stubData);



      setMessage(`Registered successfully!`);
      setQrData(qrPayload);
      console.log("Response:", res.data);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.msg || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: "1.5rem",
      textAlign: "center",
      maxWidth: "400px",
      margin: "0 auto"
    }}>
      <h2>Guest Registration</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            padding: "0.6rem",
            width: "80%",
            marginBottom: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />
        <br />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#0078ff",
            color: "white"
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}

      {qrData && (
        <div style={{ marginTop: "1rem" }}>
          <QRCodeCanvas
            value={JSON.stringify(qrData)}
            size={200}
            includeMargin
          />
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Show this QR code to a staff member for activation
          </p>
        </div>
      )}
    </div>
  );
}

export default Register;
