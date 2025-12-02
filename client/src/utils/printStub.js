// client/src/utils/printStub.js
import React from "react";
import ReactDOMServer from "react-dom/server";
import QRCode from "react-qr-code";

/**
 * printStub(data, opts)
 *
 * data: { type, guestName, guestId, rideName?, position?, estimatedReturn?, qr?, snowAccess? }
 * opts: {
 *   paperWidthMm: number (defaults to 55),
 *   orientation: "portrait" | "landscape" (defaults to "portrait"),
 *   compact: boolean (defaults to true) - reduce vertical spacing,
 *   autoClose: boolean (defaults to true) - close popup after print,
 * }
 */
export default function printStub(data = {}, opts = {}) {
  const {
    paperWidthMm = 55,
    orientation = "portrait",
    compact = true,
    autoClose = true,
  } = opts;

  const title = data.type === "registration" ? "Guest Registration" : "Queue Stub";
  const now = new Date().toLocaleString();

  // friendly text for snow access
  const snowText =
    data.snowAccess === true ? "YES" : data.snowAccess === false ? "NO" : "N/A";

  // normalize QR value
  let qrValue = "";
  try {
    if (data.qr === undefined || data.qr === null) {
      qrValue = String(data.guestId || data.guestName || "noid");
    } else if (typeof data.qr === "string") {
      qrValue = data.qr;
    } else {
      qrValue = JSON.stringify(data.qr);
    }
  } catch (e) {
    qrValue = String(data.guestId || data.guestName || "noid");
  }

  // QR target size in mm (tuned to fit 55mm width)
  // Keep some side padding (set to 2mm each side), allocate QR ~ 30-36mm depende sa paper width
  const sidePaddingMm = 3; 
  const usableWidthMm = Math.max(32, paperWidthMm - sidePaddingMm * 2); // minimum para safe
  const qrMm = Math.min(36, Math.floor(usableWidthMm * 0.45)); // qr ~45% of usable width, capped

  // overall container width in mm (match paper minus small print margins)
  const containerWidthMm = Math.max(40, paperWidthMm - 4); // 2mm margins each side

  // Font sizing tuned for receipts
  const fontSizeBase = compact ? 12 : 14; 
  const smallFont = Math.max(10, Math.floor(fontSizeBase - 2));

  // Build the element using React for cleaner markup
  const element = (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "6px 6px",
        width: `${containerWidthMm}mm`,
        boxSizing: "border-box",
        color: "#000",    
        fontWeight: "bold"
      }}
    >
      <div style={{ textAlign: "center", marginBottom: compact ? 6 : 10 }}>
        <div style={{ fontWeight: 700, fontSize: `${fontSizeBase + 2}px`, lineHeight: 1 }}>
          {title}
        </div>
        <div style={{ fontSize: `${smallFont}px`, color: "#000000ff", marginTop: 2 }}>{now}</div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: compact ? 6 : 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: `${fontSizeBase}px`, fontWeight: 700, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.guestName || "Guest"}
          </div>

          <div style={{ fontSize: `${smallFont}px`, color: "#222", marginTop: 3 }}>
            {data.guestId ? `ID: ${data.guestId}` : ""}
          </div>

          {data.snowAccess !== undefined && (
            <div style={{ fontSize: `${smallFont}px`, marginTop: 6 }}>
              Snow World Access: <strong>{snowText}</strong>
            </div>
          )}

          {data.type === "queue" && data.rideName && (
            <div style={{ fontSize: `${smallFont}px`, marginTop: 6 }}>
              Ride: <strong>{data.rideName}</strong>
            </div>
          )}

          {data.type === "queue" && (data.position || data.position === 0) && (
            <div style={{ fontSize: `${smallFont}px` }}>
              Queue position: <strong>{data.position}</strong>
            </div>
          )}

          {data.estimatedReturn && (
            <div style={{ fontSize: `${smallFont}px`, marginTop: 3 }}>
              Return at: {data.estimatedReturn}
            </div>
          )}
        </div>

        <div style={{ width: `${qrMm}mm`, height: `${qrMm}mm`, padding: 2, background: "#fff", borderRadius: 4, boxSizing: "border-box" }} className="qr-wrap">
          {/* react-qr-code will render an SVG; we'll force the svg size for print via CSS below */}
          <QRCode value={qrValue} size={256} />
        </div>
      </div>

      <div style={{ fontSize: `${smallFont}px`, color: "#000", marginTop: compact ? 6 : 10 }}>
        Please show this stub to staff when requested.
      </div>
    </div>
  );

  const rendered = ReactDOMServer.renderToString(element);

  // - @page size set to paper width (height auto)
  // - body margin set to 0 and we provide tiny page margins
  // - svg forced to QR size in mm inside .qr-wrap
  // - set -webkit-print-color-adjust: exact to encourage faithful printing
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page {
        size: ${paperWidthMm}mm ${orientation === "portrait" ? "auto" : "auto"};
        margin: 2mm;
      }
      html, body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      /* container root */
      #root { width: ${containerWidthMm}mm; box-sizing: border-box; }
      /* force QR svg to exact mm dimensions */
      .qr-wrap svg { width: ${qrMm}mm !important; height: ${qrMm}mm !important; display: block; }
      /* tighten typography for receipts */
      body, #root { font-family: Arial, Helvetica, sans-serif; color: #000; }
      h3 { margin: 0; padding: 0; }
      /* remove default margins/padding from svg wrappers produced by react-qr-code */
      svg { display:block; }
      /* ensure the printed page is compact */
      .qr-wrap { margin: 0; padding: 0; }
      /* small visual helpers */
      .text-muted { color: #222; font-size: ${smallFont}px; }
    </style>
  </head>
  <body>
    <div id="root">${rendered}</div>

    <script>
      // Ensure print is triggered only when resource loaded.
      function doPrint() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error('print error', e);
        }
      }

      // Some browsers require onload to finish painting SVG etc.
      if (document.readyState === 'complete') {
        setTimeout(doPrint, 250);
      } else {
        window.addEventListener('load', function() {
          setTimeout(doPrint, 250);
        });
      }

      // Optionally close the window after printing (some browsers block close; wrapped in try)
      ${autoClose ? `
      window.addEventListener('afterprint', function() {
        try { window.close(); } catch(e) { /* ignore */ }
      });
      // fallback - close after a short delay (in case afterprint doesn't fire)
      setTimeout(function(){
        try { window.close(); } catch(e) {}
      }, 5000);
      ` : ""}
    </script>
  </body>
</html>`;

  // Open popup window
  const w = window.open("", "_blank", `width=400,height=800`);
  if (!w) {
    alert("Pop-up blocker prevented opening the print window. Please allow pop-ups for this site.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
