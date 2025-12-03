// client/src/components/QRScanner.js
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * Responsive QRScanner component
 *
 * - Automatically calculates a square qrbox that fits the container/window.
 * - On resize/orientation change it restarts the scanner with the new qrbox.
 *
 * Props:
 *  - onDecode(decodedString)
 *  - onError(errMessage)
 *  - autoStopOnDecode = true
 *  - autoSubmitOnDecode = true
 *  - verbose = false
 *  - elementId = "qr-reader"
 */
export default function QRScanner({
  onDecode,
  onError,
  autoStopOnDecode = true,
  autoSubmitOnDecode = true,
  verbose = false,
  elementId = "qr-reader",
}) {
  const [running, setRunning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState(null);
  const [message, setMessage] = useState("");
  const html5Ref = useRef(null);

  const containerRef = useRef(null);
  const resizeObserver = useRef(null);
  const [qrSize, setQrSize] = useState(280); 

  // compute a good qr box size based on container width and viewport height
  function computeSize(containerWidth = 320) {
    // keep some margins and cap max size (so not too huge on desktop)
    const maxByContainer = Math.floor(containerWidth * 0.92);
    const maxByViewport = Math.floor(Math.min(window.innerHeight * 0.5, 540));
    const chosen = Math.max(160, Math.min(maxByContainer, maxByViewport, 420));
    return chosen;
  }

  useEffect(() => {
    // initialize size on mount
    const c = containerRef.current;
    if (c) {
      const w = Math.max(200, c.clientWidth || 320);
      setQrSize(computeSize(w));
    }

    // Setup ResizeObserver if available
    if (typeof window !== "undefined" && "ResizeObserver" in window) {
      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width || entry.target.clientWidth || 320;
          const newSize = computeSize(w);
          if (newSize !== qrSize) {
            setQrSize(newSize);
            // if running - restart scanner with new size
            if (running) {
              restartScannerWithNewBox(newSize);
            }
          }
        }
      });
      if (c) resizeObserver.current.observe(c);
    } else {
      // Fallback: listen to window resize/orientation for older browsers
      const onResize = () => {
        const w = containerRef.current ? containerRef.current.clientWidth : window.innerWidth;
        const newSize = computeSize(w);
        if (newSize !== qrSize) {
          setQrSize(newSize);
          if (running) {
            restartScannerWithNewBox(newSize);
          }
        }
      };
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
      };
    }

    return () => {
      // cleanup observer
      try {
        resizeObserver.current?.disconnect();
      } catch (e) {}
      stopScanner(); 
    };
  }, []); 

  // Helper: list cameras
  async function listCameras() {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices || []);
      if (devices && devices.length > 0 && !cameraId) setCameraId(devices[0].id);
      if (verbose) console.log("QRScanner cameras:", devices);
      setMessage((prev) => (devices && devices.length ? "Cameras found" : "No cameras found"));
    } catch (err) {
      if (verbose) console.warn("QRScanner: getCameras error", err);
      setMessage("Could not list cameras.");
      if (onError) onError("Could not list cameras: " + String(err));
    }
  }

  // restart scanner with new qrbox size (used during resize)
  async function restartScannerWithNewBox(newSize) {
    try {
      if (!html5Ref.current) return;
      await stopScanner();
      // small delay to ensure camera is released
      setTimeout(() => {
        startScanner(newSize).catch((e) => {
          if (verbose) console.warn("restartScannerWithNewBox error", e);
        });
      }, 180);
    } catch (e) {
      if (verbose) console.warn("restart failed", e);
    }
  }

  // Wait for container element
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
      }, 60);
    });

  async function startScanner(manualSize) {
    if (running) return;
    setMessage("");
    try {
      await waitForElement(elementId, 2500);
    } catch (err) {
      setMessage("Scanner element not found.");
      if (onError) onError && onError("Scanner element not found.");
      return;
    }

    // ensure previous instance cleared
    try {
      if (html5Ref.current) {
        await html5Ref.current.stop();
        await html5Ref.current.clear();
      }
    } catch (e) {
    } finally {
      html5Ref.current = null;
    }

    // create new instance
    html5Ref.current = new Html5Qrcode(elementId, { verbose: false });

    // ensure camera list (best effort)
    await listCameras().catch(() => {});

    const chosen = cameraId || (cameras && cameras.length ? cameras[0].id : null);
    const constraints = chosen ? { deviceId: { exact: chosen } } : { facingMode: { ideal: "environment" } };

    // pick the size (manual override -> state)
    const box = typeof manualSize === "number" ? manualSize : qrSize;

    try {
      await html5Ref.current.start(
        constraints,
        { fps: 10, qrbox: { width: box, height: box } },
        (decodedText /*, result*/) => {
          if (verbose) console.log("QRScanner decoded", decodedText);
          onDecode && onDecode(decodedText, { autoSubmit: autoSubmitOnDecode });
          if (autoStopOnDecode) {
            setTimeout(() => stopScanner(), 100);
          }
        },
        (err) => {
          if (verbose) console.debug("QRScanner decode error", err);
        }
      );
      setRunning(true);
      setMessage("Scanner started — point camera at the QR.");
    } catch (err) {
      console.error("QRScanner start error", err);
      setMessage("Unable to start camera. Check permissions.");
      if (onError) onError("Unable to start camera: " + String(err));
      try {
        await html5Ref.current?.stop();
      } catch (_) {}
      try {
        html5Ref.current?.clear();
      } catch (_) {}
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
      {/* container that will be sized (use containerRef for measuring) */}
      <div
        ref={containerRef}
        id={`${elementId}-container`}
        style={{
          width: "100%",
          maxWidth: 640,
          height: qrSize,
          borderRadius: 8,
          overflow: "hidden",
          background: "#000",
        }}
      >
        {/* Html5Qrcode will render into this element id */}
        <div id={elementId} style={{ width: "100%", height: "100%" }} />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => {
            if (!running) startScanner();
            else stopScanner();
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            background: running ? "#ef4444" : "#0369a1",
            color: "#fff",
            border: "none",
          }}
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

        <div style={{ fontSize: 13, color: "#6b7280", marginLeft: "auto" }}>
          {message || "Tip: start scanner and point camera at QR."}
        </div>
      </div>
    </div>
  );
}
