// client/src/components/QRScanner.js
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * QRScanner - polished reusable scanner component
 *
 * Props:
 *  - onDecode(decodedString)      required: callback when successful decode
 *  - onError(errMessage)          optional: callback for non-fatal errors
 *  - autoStopOnDecode = true      optional: stop scanner after a decode
 *  - autoSubmitOnDecode = true   optional: call onDecode and immediately indicate "submit" (parent handles)
 *  - qrboxSize = 250              optional: scanning box size in px
 *  - verbose = false              optional: console logs for debugging
 *
 * Usage:
 *  <QRScanner onDecode={(s)=>{ ... }} />
 *
 * Notes:
 *  - This component renders a Start/Stop button so camera won't auto-activate.
 *  - Use a unique `id` for multiple scanners on the same page (defaults to "qr-reader").
 */
export default function QRScanner({
  onDecode,
  onError,
  autoStopOnDecode = true,
  autoSubmitOnDecode = true,
  qrboxSize = 250,
  verbose = false,
  elementId = "qr-reader"
}) {
  const [running, setRunning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState(null);
  const [message, setMessage] = useState("");
  const html5Ref = useRef(null);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function listCameras() {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices || []);
      if (devices && devices.length > 0 && !cameraId) setCameraId(devices[0].id);
      if (verbose) console.log("QRScanner cameras:", devices);
    } catch (err) {
      if (verbose) console.warn("QRScanner: getCameras error", err);
      setMessage("Could not list cameras.");
      if (onError) onError("Could not list cameras: " + String(err));
    }
  }

  // Wait for element existence (protects against race when element not yet mounted)
  const waitForElement = (id, timeout = 2500) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const iv = setInterval(() => {
        const el = document.getElementById(id);
        if (el) {
          clearInterval(iv);
          resolve(el);
        } else if (Date.now() - start > timeout) {
          clearInterval(iv);
          reject(new Error("element not found"));
        }
      }, 50);
    });

  async function startScanner() {
    if (running) return;
    setMessage("");
    // ensure the div exists
    try {
      await waitForElement(elementId, 2500);
    } catch (err) {
      setMessage("Scanner element not found.");
      if (onError) onError && onError("Scanner element not found.");
      return;
    }

    // create Html5Qrcode instance
    html5Ref.current = new Html5Qrcode(elementId, { verbose: false });

    // ensure camera list
    await listCameras().catch(() => { /* ignore */ });

    const chosen = cameraId || (cameras && cameras.length ? cameras[0].id : null);

    // Prepare camera constraints
    const constraints = chosen ? { deviceId: { exact: chosen } } : { facingMode: { ideal: "environment" } };

    try {
      await html5Ref.current.start(
        constraints,
        { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } },
        (decodedText /*, decodedResult*/) => {
          if (verbose) console.log("QRScanner decoded", decodedText);
          // send to parent
          onDecode && onDecode(decodedText, { autoSubmit: autoSubmitOnDecode });
          if (autoStopOnDecode) {
            // small timeout to ensure parent sees value before stopping
            setTimeout(() => stopScanner(), 100);
          }
        },
        (err) => {
          // decode error per frame (ignore or report)
          if (verbose) console.debug("QRScanner decode error", err);
        }
      );
      setRunning(true);
      setMessage("Scanner started — point camera at the QR.");
    } catch (err) {
      console.error("QRScanner start error", err);
      setMessage("Unable to start camera. Check permissions.");
      if (onError) onError("Unable to start camera: " + String(err));
      try { await html5Ref.current?.stop(); } catch (_) {}
      try { html5Ref.current?.clear(); } catch (_) {}
      html5Ref.current = null;
      setRunning(false);
    }
  }

  async function stopScanner() {
    try {
      if (html5Ref.current && running) {
        await html5Ref.current.stop();
        await html5Ref.current.clear();
      }
    } catch (e) {
      if (verbose) console.warn("QRScanner stop error", e);
    } finally {
      html5Ref.current = null;
      setRunning(false);
      setMessage("Scanner stopped.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div id={elementId} style={{ width: "100%", maxWidth: 420, height: 280, borderRadius: 8, overflow: "hidden", background: "#000" }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => {
            if (!running) startScanner();
            else stopScanner();
          }}
          style={{ padding: "8px 12px", borderRadius: 6, background: running ? "#ef4444" : "#0369a1", color: "#fff", border: "none" }}
        >
          {running ? "Stop scanner" : "Start scanner"}
        </button>

        <button
          onClick={() => {
            listCameras();
            setMessage("Refreshing cameras...");
          }}
          style={{ padding: "8px 10px", borderRadius: 6 }}
        >
          Refresh cameras
        </button>

        {cameras.length > 0 && (
          <select
            value={cameraId || ""}
            onChange={(e) => setCameraId(e.target.value)}
            style={{ padding: 8, borderRadius: 6 }}
            aria-label="Camera selection"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label || c.id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ fontSize: 13, color: "#6b7280" }}>
        {message || "Tip: start scanner and point camera at QR. Use Refresh cameras if camera list is empty."}
      </div>
    </div>
  );
}
