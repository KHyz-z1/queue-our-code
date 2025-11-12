// client/src/pages/VerifyGuest.js
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../utils/api";

export default function VerifyGuest() {
  const [mode, setMode] = useState("idle"); // "idle" | "scan" | "manual"
  const [uid, setUid] = useState("");
  const [vtok, setVtok] = useState("");
  const [message, setMessage] = useState("");
  const html5Ref = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wait for element helper (protects against race)
  const waitForElement = (elementId, timeout = 2000) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.getElementById(elementId);
        if (el) {
          clearInterval(interval);
          resolve(el);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error("qr-reader element not found"));
        }
      }, 50);
    });

  const startScanner = async () => {
  if (isScanningRef.current) return;
  setMessage("");
  const elementId = "qr-reader";

  // Ensure the scanner DOM is rendered by switching mode first
  // so the <div id="qr-reader"> appears in the DOM.
  setMode("scan");

  // Now wait for the element to exist (max 2s)
  const waitForElement = (id, timeout = 2000) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.getElementById(id);
        if (el) {
          clearInterval(interval);
          resolve(el);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error("qr-reader element not found"));
        }
      }, 50);
    });

  try {
    await waitForElement(elementId);
  } catch (err) {
    console.error("startScanner: element not found", err);
    setMessage("Scanner element not found. Try again.");
    // fallback keep mode as scan so user can retry start
    return;
  }

  try {
    html5Ref.current = new Html5Qrcode(elementId, { verbose: false });

    // optionally pick a camera if available
    let cameraId = null;
    try {
      const devices = await Html5Qrcode.getCameras();
      cameraId = devices && devices.length ? devices[0].id : null;
    } catch (_) {
      // ignore camera list errors
    }

    await html5Ref.current.start(
      cameraId ? { deviceId: { exact: cameraId } } : { facingMode: { ideal: "environment" } },
      { fps: 10, qrbox: { width: 300, height: 300 } },
      (decodedText) => {
        handleScanText(decodedText);
      },
      (errorMessage) => {
        // ignore frame decode errors
      }
    );

    isScanningRef.current = true;
    setMessage("Scanner started — point camera at the QR.");
  } catch (err) {
    console.error("Could not start scanner:", err);
    setMessage("Camera not available or permission denied.");
    // cleanup partial state
    try { await html5Ref.current?.stop(); } catch (_) {}
    try { html5Ref.current?.clear(); } catch (_) {}
    html5Ref.current = null;
    isScanningRef.current = false;
  }
};


  const stopScanner = async () => {
    if (html5Ref.current && isScanningRef.current) {
      try {
        await html5Ref.current.stop();
      } catch (e) {
        // ignore
      }
      try {
        html5Ref.current.clear();
      } catch (e) {
        // ignore
      }
    }
    html5Ref.current = null;
    isScanningRef.current = false;
    if (mode === "scan") setMode("idle");
    setMessage("Scanner stopped.");
  };

  const handleScanText = (text) => {
    if (!text) return;
    // parse JSON first
    try {
      const parsed = JSON.parse(text);
      const u = parsed.uid || parsed.id || parsed.userId || null;
      const v = parsed.vtok || parsed.verificationToken || null;
      if (!u) {
        setMessage("Scanned QR does not contain uid.");
        return;
      }
      setUid(u);
      if (v) setVtok(v);
      stopScanner();
      if (v) verifyGuest(u, v);
      else setMessage("Scanned UID. Enter vtok if required then press Verify.");
      return;
    } catch (e) {
      // not JSON -> continue
    }

    // try uid:vtok
    if (text.includes(":")) {
      const [u, v] = text.split(":");
      setUid(u.trim());
      setVtok(v?.trim() ?? "");
      stopScanner();
      if (v) verifyGuest(u.trim(), v.trim());
      else setMessage("Scanned UID. Enter vtok if required then press Verify.");
      return;
    }

    // fallback: plain uid
    setUid(text.trim());
    stopScanner();
    setMessage("Scanned UID. Enter vtok if required then press Verify.");
  };

  const verifyGuest = async (u, v) => {
    setMessage("Verifying...");
    try {
      const res = await api.post("/auth/verify", { uid: u, vtok: v });
      setMessage(`✅ Guest verified: ${res.data.user.id}`);
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.msg || err.response?.data;
      if (status === 401 || status === 403) {
        setMessage("Forbidden: make sure you're logged in as staff.");
      } else if (status === 400) {
        setMessage(serverMsg || "Bad request — check uid/vtok.");
      } else if (status === 404) {
        setMessage("Guest not found.");
      } else {
        setMessage(serverMsg || "Verification failed. Check console.");
      }
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Staff — Verify Guest (QR Scanner)</h2>

      <div style={{ marginBottom: 12 }}>
        {mode !== "scan" && (
          <>
            <button onClick={startScanner} style={{ marginRight: 8 }}>
              Start Scanning
            </button>
            <button
              onClick={() => {
                stopScanner();
                setMode("manual");
                setMessage("");
              }}
            >
              Manual Entry
            </button>
          </>
        )}

        {mode === "scan" && (
          <>
            <button onClick={stopScanner} style={{ marginRight: 8 }}>
              Stop Scanner
            </button>
            <button
              onClick={() => {
                // switch to manual without restarting camera
                stopScanner();
                setMode("manual");
                setMessage("");
              }}
            >
              Manual Entry
            </button>
          </>
        )}
      </div>

      {mode === "scan" && (
        <div>
          <div
            id="qr-reader"
            style={{
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
              border: "1px solid #ddd",
              padding: 8,
            }}
          />
          <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
            Point the camera at the guest's QR. Allow camera permission if prompted.
          </p>
        </div>
      )}

      {mode === "manual" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyGuest(uid, vtok);
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <input
              placeholder="Guest UID"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              style={{ padding: 8, width: 300 }}
              required
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input
              placeholder="Verification token (vtok, optional)"
              value={vtok}
              onChange={(e) => setVtok(e.target.value)}
              style={{ padding: 8, width: 300 }}
            />
          </div>
          <button type="submit" style={{ marginRight: 8 }}>
            Verify
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("idle");
              setMessage("");
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {message && (
        <div style={{ marginTop: 12, color: message.startsWith("✅") ? "green" : "red" }}>
          {message}
        </div>
      )}
    </div>
  );
}
