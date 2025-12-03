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
  const snowText =
    data.snowAccess === true ? "YES" : data.snowAccess === false ? "NO" : "N/A";

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

  const sidePaddingMm = 3;
  const usableWidthMm = Math.max(32, paperWidthMm - sidePaddingMm * 2);
  const qrMm = Math.min(36, Math.floor(usableWidthMm * 0.7)); 

  const containerWidthMm = Math.max(40, paperWidthMm - 6);
  const fontSizeBase = compact ? 12 : 14;
  const smallFont = Math.max(10, Math.floor(fontSizeBase - 2));

  const element = (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "6px",
        width: `${containerWidthMm}mm`,
        boxSizing: "border-box",
        color: "#000",
        fontWeight: "bold",
        textAlign: "center"
      }}
    >
      {/* QR centered block */}
      <div style={{ marginBottom: compact ? 6 : 10 }}>
        <div
          className="qr-wrap"
          style={{
            width: `${qrMm}mm`,
            height: `${qrMm}mm`,
            margin: "0 auto",
            padding: 2,
            background: "#fff",
            borderRadius: 4,
            boxSizing: "border-box"
          }}
        >
          <QRCode value={qrValue} size={256} />
        </div>
      </div>

      {/* Title & time */}
      <div style={{ marginBottom: compact ? 6 : 10 }}>
        <div style={{ fontWeight: 700, fontSize: `${fontSizeBase + 2}px`, lineHeight: 1 }}>
          {title}
        </div>
        <div style={{ fontSize: `${smallFont}px`, marginTop: 2 }}>{now}</div>
      </div>

      {/* Content Left-aligned after QR */}
      <div style={{ textAlign: "left" }}>
        <div
          style={{
            fontSize: `${fontSizeBase}px`,
            fontWeight: 700,
            lineHeight: 1.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {data.guestName || "Guest"}
        </div>

        <div style={{ fontSize: `${smallFont}px`, marginTop: 3 }}>
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

      <div style={{ fontSize: `${smallFont}px`, marginTop: compact ? 6 : 10 }}>
        Please show this stub to staff when requested.
      </div>
    </div>
  );

  const rendered = ReactDOMServer.renderToString(element);

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page {
        size: ${paperWidthMm}mm auto;
        margin: 2mm;
      }
      html, body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      #root { width: ${containerWidthMm}mm; box-sizing: border-box; }
      .qr-wrap svg { width: ${qrMm}mm !important; height: ${qrMm}mm !important; display: block; }
      body, #root { font-family: Arial, Helvetica, sans-serif; color: #000; }
      svg { display:block; }
    </style>
  </head>
  <body>
    <div id="root">${rendered}</div>

    <script>
      function doPrint() {
        try { window.focus(); window.print(); } catch (e) {}
      }
      if (document.readyState === 'complete') {
        setTimeout(doPrint, 250);
      } else {
        window.addEventListener('load', function() {
          setTimeout(doPrint, 250);
        });
      }

      ${autoClose ? `
      window.addEventListener('afterprint', function() {
        try { window.close(); } catch(e) {}
      });
      setTimeout(function(){
        try { window.close(); } catch(e) {}
      }, 5000);
      ` : ""}
    </script>
  </body>
</html>`;

  const w = window.open("", "_blank", `width=400,height=800`);
  if (!w) {
    alert("Pop-up blocker prevented opening the print window. Please allow pop-ups for this site.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
