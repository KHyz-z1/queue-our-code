// client/src/utils/printStub.js
import React from "react";
import ReactDOMServer from "react-dom/server";
import QRCode from "react-qr-code";

/**
 * printStub(data)
 * data: {
 *   type: 'registration'|'queue',
 *   guestName,
 *   guestId,
 *   rideName?,
 *   position?,
 *   estimatedReturn?,
 *   qr?,              // string or object serializable to string
 *   snowAccess?       // boolean (true/false) or undefined
 * }
 *
 * This function opens a new window with printable HTML and triggers print.
 */
export default function printStub(data) {
  const { type } = data;
  const title = type === "registration" ? "Guest Registration Stub" : "Queue Stub";
  const now = new Date().toLocaleString();

  // friendly text for snow access
  const snowText =
    data.snowAccess === true ? "YES" : data.snowAccess === false ? "NO" : "N/A";

  // Ensure QR value is a string
  let qrValue = "";
  try {
    if (data.qr === undefined || data.qr === null) {
      // fallback to guestId or guestName
      qrValue = String(data.guestId || data.guestName || "noid");
    } else if (typeof data.qr === "string") {
      qrValue = data.qr;
    } else {
      qrValue = JSON.stringify(data.qr);
    }
  } catch (e) {
    qrValue = String(data.guestId || data.guestName || "noid");
  }

  // Build React element and render to string for nicer styling
  const element = (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 12, width: 320 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div style={{ fontSize: 12, color: "#444" }}>{now}</div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{data.guestName || "Guest"}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{data.guestId ? `ID: ${data.guestId}` : ""}</div>

          {/* Snow World / SnowPass indicator for registration and queue (if available) */}
          {data.snowAccess !== undefined && (
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Snow World Access: <strong>{snowText}</strong>
            </div>
          )}

          {/* Extra info for queue stubs */}
          {type === "queue" && data.rideName && (
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Ride: <strong>{data.rideName}</strong>
            </div>
          )}
          {type === "queue" && (data.position || data.position === 0) && (
            <div style={{ fontSize: 12 }}>Queue position: <strong>{data.position}</strong></div>
          )}

          {data.estimatedReturn && (
            <div style={{ fontSize: 12 }}>Return at: {data.estimatedReturn}</div>
          )}
        </div>

        <div style={{ width: 110, height: 110, padding: 8, background: "#fff", borderRadius: 6 }}>
          {/* QR code - uses react-qr-code to render an SVG */}
          <QRCode value={qrValue} size={96} />
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#333", marginTop: 8 }}>
        Please show this stub to staff when requested.
      </div>
    </div>
  );

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-family: Arial, sans-serif; }
          /* ensure QR svg scales nicely on print */
          svg { width: 100% !important; height: auto !important; }
        </style>
      </head>
      <body>
        <div id="root">${ReactDOMServer.renderToString(element)}</div>
        <script>
          // Delay slightly to allow the printed content to be painted
          setTimeout(() => { window.print(); }, 300);
        </script>
      </body>
    </html>
  `;

  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) {
    alert("Pop-up blocker prevented opening the print window. Please allow pop-ups.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
