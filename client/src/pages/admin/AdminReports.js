// client/src/pages/admin/AdminReports.js
import React, { useEffect, useState } from "react";
import api from "../../utils/api"; 

// small helpers
function toIsoDayStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function toIsoDayEnd(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}
function presetRange(preset, anchorDate) {
  const d = anchorDate ? new Date(anchorDate) : new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);

  if (preset === "day") {
    return { start: toIsoDayStart(start), end: toIsoDayEnd(start), scope: "day" };
  }
  if (preset === "week") {
    // week starts Monday
    const day = start.getDay(); // 0 Sun .. 6 Sat
    const diffToMon = (day + 6) % 7;
    const monday = new Date(start);
    monday.setDate(start.getDate() - diffToMon);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday.toISOString(), end: sunday.toISOString(), scope: "week" };
  }
  if (preset === "month") {
    const first = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    last.setHours(23, 59, 59, 999);
    return { start: first.toISOString(), end: last.toISOString(), scope: "month" };
  }
  return null;
}

export default function AdminReports() {
  const [anchorDate, setAnchorDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [preset, setPreset] = useState("day"); // day|week|month|range
  const [report, setReport] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // initial load saved reports (optional)
    loadSaved();
  }, []);

  async function loadSaved() {
    try {
      const res = await api.get("/admin/reports/saved");
      setSavedReports(res.data.reports || []);
    } catch (err) {
      // ignore failures for now
      // console.error("load saved reports err", err);
    }
  }

  function applyPreset(p) {
    setPreset(p);
    setMsg("");
    if (p === "range") {
      // keep user-provided start/end
      return;
    }
    const r = presetRange(p, anchorDate);
    if (r) {
      // show friendly values in UI inputs
      const s = new Date(r.start).toISOString().slice(0, 10);
      const e = new Date(r.end).toISOString().slice(0, 10);
      setStartDate(s);
      setEndDate(e);
    }
  }

  async function handleGenerate(e) {
    e && e.preventDefault();
    setMsg("");
    setReport(null);
    setLoading(true);
    try {
      if (preset && preset !== "range") {
        // call with preset and anchor date
        const res = await api.get("/admin/reports", { params: { preset, date: anchorDate } });
        setReport(res.data);
      } else {
        // range mode, require both dates
        if (!startDate || !endDate) {
          setMsg("Please choose start and end dates.");
          setLoading(false);
          return;
        }
        const res = await api.get("/admin/reports", { params: { start: startDate, end: endDate } });
        setReport(res.data);
      }
    } catch (err) {
      console.error("generate err", err);
      setMsg(err.response?.data?.msg || "Could not generate report");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!report) {
      setMsg("Generate a report first.");
      return;
    }
    try {
      setMsg("Saving...");
      const payload = {
        title: `Report ${report.range?.scope || "range"} ${report.range?.start?.slice(0,10) || ""} - ${report.range?.end?.slice(0,10) || ""}`,
        start: report.range?.start,
        end: report.range?.end,
        scope: report.range?.scope || "range",
        payload: report
      };
      const res = await api.post("/admin/reports/save", payload);
      setMsg(res.data.msg || "Saved");
      await loadSaved();
    } catch (err) {
      console.error("save err", err);
      setMsg(err.response?.data?.msg || "Save failed");
    }
  }

  async function printSavedReport(reportId) {
    try {
      setMsg("");
      const res = await api.get(`/admin/reports/saved/${reportId}`);
      const rpt = res.data.report || res.data; // depending on server shape

      // Build printable HTML
      const html = `
        <html>
          <head>
            <title>Report - ${rpt.title || reportId}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color:#111827; }
              h1 { font-size: 20px; margin-bottom: 6px; }
              .meta { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
              th { background: #f8fafc; }
            </style>
          </head>
          <body>
            <h1>${rpt.title || 'Saved Report'}</h1>
            <div class="meta">
              Range: ${new Date(rpt.start).toLocaleString()} — ${new Date(rpt.end).toLocaleString()} • Scope: ${rpt.scope || 'N/A'}
              <br/>Generated: ${new Date(rpt.generatedAt || Date.now()).toLocaleString()}
            </div>

            <div>
              <strong>Totals</strong>
              <div>Registered Guests: ${rpt.payload?.guestsToday ?? rpt.guestsToday ?? 0}</div>
              <div>Completed: ${rpt.payload?.totals?.completed ?? rpt.totals?.completed ?? 0}</div>
              <div>Cancelled total: ${rpt.payload?.totals?.cancelled_total ?? rpt.totals?.cancelled_total ?? 0}</div>
              <div>Cancelled staff: ${rpt.payload?.totals?.cancelled_by_staff ?? rpt.totals?.cancelled_by_staff ?? 0} • guest: ${rpt.payload?.totals?.cancelled_by_guest ?? rpt.totals?.cancelled_by_guest ?? 0}</div>
            </div>

            <h3 style="margin-top:18px">Per Ride</h3>
            <table>
              <thead>
                <tr><th>Ride</th><th>Completed</th><th>Cancelled</th><th>By staff</th><th>By guest</th></tr>
              </thead>
              <tbody>
                ${(rpt.payload?.perRide || rpt.perRide || []).map(r => `
                  <tr>
                    <td>${r.rideName || r.rideId}</td>
                    <td>${r.completed_count ?? 0}</td>
                    <td>${r.cancelled_total ?? 0}</td>
                    <td>${r.cancelled_by_staff ?? 0}</td>
                    <td>${r.cancelled_by_guest ?? 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const w = window.open("", "_blank");
      if (!w) {
        setMsg("Blocked popup. Allow popups to print.");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();

      // wait a tick then trigger print
      setTimeout(() => {
        w.focus();
        w.print();
        // optional: close after print dialog opens (many browsers block automatic close)
        // w.close();
      }, 300);
    } catch (err) {
      console.error("printSavedReport err", err);
      setMsg(err.response?.data?.msg || "Could not load saved report for printing");
    }
  }

  async function handleArchiveReport(reportId) {
    if (!window.confirm("Archive this saved report? This will hide it from the list but keep the data for auditing.")) return;
    try {
      setMsg("");
      await api.delete(`/admin/reports/saved/${reportId}`);
      setSavedReports(prev => prev.filter(s => s.id !== reportId));
      setMsg("Report archived");
    } catch (err) {
      console.error("archive err", err);
      setMsg(err.response?.data?.msg || "Could not archive report");
    }
  }

  /* --- END NEW HELPER FUNCTIONS --- */


  return (
    <div style={{ padding: 18, maxWidth: 1100 }}>
      <h2>Admin — Reports</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#374151" }}>Anchor date (for presets)</div>
          <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#374151" }}>Preset</div>
          <select value={preset} onChange={(e)=>applyPreset(e.target.value)}>
            <option value="day">Today (day)</option>
            <option value="week">This week (Mon-Sun)</option>
            <option value="month">This month</option>
            <option value="range">Date range</option>
          </select>
        </div>

        {preset === "range" && (
          <>
            <div>
              <div style={{ fontSize: 12, color: "#374151" }}>Start</div>
              <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#374151" }}>End</div>
              <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
            </div>
          </>
        )}

        <div style={{ alignSelf: "end" }}>
          <button onClick={handleGenerate} style={{ padding: "8px 12px", marginRight: 8 }}>
            {loading ? "Generating..." : "Generate"}
          </button>
          <button onClick={handleSave} disabled={!report} style={{ padding: "8px 12px" }}>
            Save
          </button>
        </div>
      </div>

      {msg && <div style={{ marginBottom: 12, color: msg.startsWith("Saved") || msg.startsWith("Saved") ? "green" : "red" }}>{msg}</div>}

      {/* Report preview */}
      {report ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>Range:</strong> {new Date(report.range.start).toLocaleString()} — {new Date(report.range.end).toLocaleString()}
              {" • "} <strong>Scope:</strong> {report.range.scope}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={{ padding: 12, background: "#fff", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Registered Guests</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{report.guestsToday}</div>
            </div>

            <div style={{ padding: 12, background: "#fff", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Completed queues</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{report.totals.completed}</div>
            </div>

            <div style={{ padding: 12, background: "#fff", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Cancelled (total)</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{report.totals.cancelled_total}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                staff: {report.totals.cancelled_by_staff} • guest: {report.totals.cancelled_by_guest}
              </div>
            </div>
          </div>

          <h3 style={{ marginTop: 18 }}>Per Ride</h3>
          <div style={{ background: "#fff", borderRadius: 8, padding: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: 8 }}>Ride</th>
                  <th style={{ padding: 8 }}>Completed</th>
                  <th style={{ padding: 8 }}>Cancelled (total)</th>
                  <th style={{ padding: 8 }}>Cancelled by staff</th>
                  <th style={{ padding: 8 }}>Cancelled by guest</th>
                </tr>
              </thead>
              <tbody>
                {(report.perRide || []).map((r) => (
                  <tr key={r.rideId} style={{ borderBottom: "1px dashed #f1f5f9" }}>
                    <td style={{ padding: 8 }}>{r.rideName || r.rideId}</td>
                    <td style={{ padding: 8 }}>{r.completed_count ?? 0}</td>
                    <td style={{ padding: 8 }}>{r.cancelled_total ?? 0}</td>
                    <td style={{ padding: 8 }}>{r.cancelled_by_staff ?? 0}</td>
                    <td style={{ padding: 8 }}>{r.cancelled_by_guest ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 8, color: "#6b7280" }}>No report generated yet.</div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Saved Reports</h3>
        {savedReports.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No saved reports yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {savedReports.map((s) => (
              <div key={s.id} style={{ padding: 10, background: "#fff", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.title || `${s.scope} — ${new Date(s.start).toLocaleDateString()}`}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(s.generatedAt || s.createdAt || Date.now()).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => printSavedReport(s.id)} style={{ padding: "6px 10px", background: "#0369a1", color: "#fff", borderRadius: 6, border: "none" }}>Print</button>
                  <button onClick={() => handleArchiveReport(s.id)} style={{ padding: "6px 10px", background: "#ef4444", color: "#fff", borderRadius: 6, border: "none" }}>Archive</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}